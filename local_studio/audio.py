"""Acoustic measurements and conservative, reversible audio preparation. No ASR or emotion model."""
import argparse
from array import array
import json
import math
import os
from pathlib import Path
import statistics
import sys
import tempfile

from .studio import StudioError, digest, duration, ffmpeg, has_stream, local_file, probe

RATE = 24000
FRAME = 480  # 20 ms. Energy windows, NOT a speech recognizer.
FILTER = 'highpass=f=65,afftdn=nr=6:nf=-45:tn=1'


def db(value):
    return round(20 * math.log10(value), 3) if value > 0 else None


def decode_frames(source):
    info = probe(source)
    if not has_stream(info, 'audio') or duration(info) > 1800:
        raise StudioError('A análise aceita áudio de até 30 minutos.')
    with tempfile.TemporaryDirectory(prefix='jarvis-audio-analysis-') as tmp:
        pcm = Path(tmp) / 'analysis.f32'
        ffmpeg(['-protocol_whitelist', 'file', '-i', str(local_file(source)), '-map', '0:a:0',
                '-vn', '-ac', '1', '-ar', str(RATE), '-f', 'f32le', '-c:a', 'pcm_f32le', str(pcm)])
        frames = []
        with pcm.open('rb') as stream:
            while data := stream.read(FRAME * 4):
                samples = array('f')
                samples.frombytes(data)
                if sys.byteorder != 'little':
                    samples.byteswap()
                if not samples or any(not math.isfinite(x) for x in samples):
                    raise StudioError('Áudio vazio ou com amostras inválidas.')
                square = sum(x * x for x in samples)
                frames.append({'n': len(samples), 'square': square,
                               'peak': max(abs(x) for x in samples),
                               'near_limit': sum(abs(x) >= .999 for x in samples),
                               'mean': sum(samples) / len(samples),
                               'rms': math.sqrt(square / len(samples))})
    if not frames:
        raise StudioError('Nenhuma amostra de áudio foi decodificada.')
    return info, frames


def summarize(frames):
    n = sum(f['n'] for f in frames)
    return {'decoded_seconds': round(n / RATE, 3),
            'peak_dbfs': db(max(f['peak'] for f in frames)),
            'rms_dbfs': db(math.sqrt(sum(f['square'] for f in frames) / n)),
            'near_full_scale_samples_percent': round(100 * sum(f['near_limit'] for f in frames) / n, 5),
            'low_energy_frames_percent': round(100 * sum(f['rms'] < 10 ** (-45 / 20) for f in frames) / len(frames), 2),
            'low_energy_threshold_dbfs': -45,
            'median_frame_rms_dbfs': db(statistics.median(f['rms'] for f in frames)),
            'dc_mean': round(sum(f['mean'] * f['n'] for f in frames) / n, 7)}


def choose_candidate(frames, seconds=10):
    count = int(seconds * RATE / FRAME)
    if len(frames) < count:
        return None
    candidates = []
    # Overlapping one-second steps; never stitch noncontiguous speech.
    for first in range(0, len(frames) - count + 1, RATE // FRAME):
        window = frames[first:first + count]
        m = summarize(window)
        if (m['rms_dbfs'] is None or m['rms_dbfs'] < -38
                or m['low_energy_frames_percent'] > 35
                or m['near_full_scale_samples_percent'] > .1):
            continue
        # Prefer fewer quiet frames and moderate level, not simply the loudest recording.
        score = m['low_energy_frames_percent'] + abs(m['rms_dbfs'] + 23) * .25
        candidates.append((score, first, m))
    if not candidates:
        return None
    _, first, metrics = min(candidates, key=lambda item: (item[0], item[1]))
    return {'start_seconds': first * FRAME / RATE, 'duration_seconds': seconds,
            'selection': 'energy_heuristic_not_speech_or_identity_verification', 'metrics': metrics,
            'listening_review': 'pending', 'word_boundaries': 'not_verified'}


def analyze(source):
    source = local_file(source)
    info, frames = decode_frames(source)
    stream = next(s for s in info['streams'] if s.get('codec_type') == 'audio')
    return {'schema': 'jarvis-acoustic-review-v1', 'source_sha256': digest(source),
            'source': {'duration_seconds': duration(info), 'codec': stream.get('codec_name'),
                       'sample_rate': stream.get('sample_rate'), 'channels': stream.get('channels')},
            'measurements': summarize(frames), 'candidate': choose_candidate(frames),
            'interpretation': {'speech_content': 'not_transcribed', 'speaker_count': 'not_verified',
                               'intelligibility': 'not_evaluated', 'background_music': 'not_evaluated',
                               'emotion': 'not_inferred', 'clinical_state': 'not_inferred',
                               'clone_quality': 'not_tested', 'signal_to_noise_ratio': 'not_estimated'}}


def prepare_audio_pack(source, destination):
    source = local_file(source)
    before = digest(source)
    report = analyze(source)
    destination = Path(destination).expanduser().resolve()
    destination.parent.mkdir(parents=True, exist_ok=True)
    if destination.exists():
        raise StudioError('Use uma pasta nova; a análise anterior não será substituída.')
    with tempfile.TemporaryDirectory(prefix='.audio-pack-', dir=destination.parent) as tmp:
        work = Path(tmp) / 'result'
        work.mkdir(mode=0o700)
        candidate = report['candidate']
        files = []
        if candidate:
            # Keep a minimally processed reference: resampling only, no denoiser/gate.
            raw = work / 'Sol_referencia_voz_sem_filtro.wav'
            ffmpeg(['-protocol_whitelist', 'file', '-ss', str(candidate['start_seconds']), '-i', str(source),
                    '-t', str(candidate['duration_seconds']), '-map', '0:a:0', '-vn',
                    '-ac', '1', '-ar', str(RATE), '-c:a', 'pcm_s16le', '-map_metadata', '-1', str(raw)])
            if abs(duration(probe(raw)) - candidate['duration_seconds']) > .1:
                raise StudioError('Trecho extraído não preservou a duração esperada.')
            files.append(raw)
        # Optional listening copy. It does not replace the source or the clone reference.
        if report['measurements']['rms_dbfs'] is not None:
            treated = work / 'Sol_voz_tratamento_leve_experimental.wav'
            ffmpeg(['-protocol_whitelist', 'file', '-i', str(source), '-map', '0:a:0', '-vn',
                    '-af', FILTER, '-ac', '1', '-ar', str(RATE), '-c:a', 'pcm_s16le',
                    '-map_metadata', '-1', str(treated)])
            _, treated_frames = decode_frames(treated)
            report['treated_measurements'] = summarize(treated_frames)
            if abs(report['treated_measurements']['decoded_seconds'] - report['measurements']['decoded_seconds']) > .1:
                raise StudioError('A cópia tratada não preservou a duração.')
            files.append(treated)
        report['treatment'] = {'filter': FILTER, 'automatic_silence_removal': False,
                               'automatic_gain_or_compression': False, 'pitch_or_speed_change': False,
                               'quality_improvement': 'not_confirmed_by_listening',
                               'reference_uses_denoising': False}
        report['outputs'] = {f.name: {'sha256': digest(f), 'bytes': f.stat().st_size} for f in files}
        report_path = work / 'Sol_analise_tecnica_voz.json'
        report_path.write_text(json.dumps(report, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
        files.append(report_path)
        if digest(source) != before:
            raise StudioError('O arquivo de origem mudou durante a preparação.')
        for f in files:
            os.chmod(f, 0o600)
        work.rename(destination)
    return report


def main():
    parser = argparse.ArgumentParser(description='Análise acústica e cópia de tratamento conservador')
    parser.add_argument('--source', required=True)
    parser.add_argument('--destination', required=True)
    args = parser.parse_args()
    try:
        result = prepare_audio_pack(args.source, args.destination)
        print(json.dumps(result, ensure_ascii=False, indent=2))
    except (StudioError, OSError, ValueError) as exc:
        print(json.dumps({'ok': False, 'error': str(exc)}, ensure_ascii=False), file=sys.stderr)
        return 1
    return 0


if __name__ == '__main__':
    raise SystemExit(main())
