"""Bounded, offline recognition of authorized local media. Never synthesizes a voice."""
import argparse
import hashlib
import json
import os
from pathlib import Path
import socket
import subprocess
import tempfile

LOCK = Path(__file__).with_name('transcription-model-lock.json')
MAX_BYTES = 12_000_000


class TranscriptionError(Exception):
    pass


def sha256(path):
    with Path(path).open('rb') as stream:
        return hashlib.file_digest(stream, 'sha256').hexdigest()


def verify_model(folder):
    folder = Path(folder).resolve()
    lock = json.loads(LOCK.read_text())
    for name, expected in lock['files'].items():
        path = folder / name
        if path.is_symlink() or not path.is_file() or path.stat().st_size != expected['size'] or sha256(path) != expected['sha256']:
            raise TranscriptionError('model_integrity_failed')
    return lock


def command(args, timeout=20):
    result = subprocess.run(args, capture_output=True, timeout=timeout, check=False)
    if result.returncode:
        raise TranscriptionError('media_decode_failed')
    return result.stdout


def timestamp(seconds):
    ms = round(seconds * 1000)
    return f'{ms // 3600000:02}:{ms // 60000 % 60:02}:{ms // 1000 % 60:02}.{ms % 1000:03}'


def transcribe(source, model_dir, max_seconds=180, max_characters=45000):
    source = Path(source).resolve()
    if not source.is_file() or not 0 < source.stat().st_size <= MAX_BYTES:
        raise TranscriptionError('media_size_limit')
    if not 1 <= max_seconds <= 180 or not 40 <= max_characters <= 45000:
        raise TranscriptionError('invalid_limits')
    # No playlist, remote protocol, or attachment can make ffmpeg fetch a second source.
    policy = ['-protocol_whitelist', 'file,pipe', '-format_whitelist', 'wav,ogg,mp3,mov,matroska,webm,flac,aac']
    probe = json.loads(command(['ffprobe', '-v', 'error', *policy, '-show_format', '-show_streams', '-of', 'json', str(source)]))
    duration = float(probe.get('format', {}).get('duration', 0))
    if not 0 < duration <= max_seconds:
        raise TranscriptionError('media_duration_limit')
    if not any(s.get('codec_type') == 'audio' for s in probe['streams']):
        raise TranscriptionError('audio_stream_missing')
    lock = verify_model(model_dir)
    os.environ.update(HF_HUB_OFFLINE='1', TRANSFORMERS_OFFLINE='1', HF_HUB_DISABLE_TELEMETRY='1')
    # Python network is also denied. This is not an OS sandbox for hostile native code.
    def offline(*_args, **_kwargs):
        raise TranscriptionError('network_disabled')
    class OfflineSocket(socket.socket):
        connect = offline
        connect_ex = offline
        sendto = offline
    socket.socket = OfflineSocket
    socket.create_connection = offline
    import numpy as np
    from faster_whisper import WhisperModel
    with tempfile.TemporaryDirectory(prefix='jarvis-pcm-') as temporary:
        wav = Path(temporary) / 'audio.wav'
        command(['ffmpeg', '-nostdin', '-v', 'error', *policy, '-i', str(source), '-map', '0:a:0', '-vn', '-ac', '1', '-ar', '16000', '-t', str(max_seconds + 1), '-c:a', 'pcm_s16le', str(wav)])
        import wave
        with wave.open(str(wav)) as audio:
            samples = np.frombuffer(audio.readframes(audio.getnframes()), dtype=np.int16).astype(np.float32) / 32768
        if len(samples) / 16000 > max_seconds + 0.1:
            raise TranscriptionError('media_duration_limit')
        if not len(samples) or float(np.sqrt(np.mean(samples ** 2))) < 0.0001:
            raise TranscriptionError('no_speech_detected')
        model = WhisperModel(str(Path(model_dir).resolve()), device='cpu', compute_type='int8', cpu_threads=2, num_workers=1, local_files_only=True)
        raw, info = model.transcribe(samples, beam_size=5, vad_filter=True, condition_on_previous_text=False, temperature=0)
        segments = []
        for segment in raw:
            text = segment.text.strip()
            if not text:
                continue
            if not 0 <= segment.start < min(segment.end, duration):
                raise TranscriptionError('invalid_recognition_interval')
            segments.append({'id': f's{len(segments)+1}', 'start': round(segment.start, 3), 'end': round(min(segment.end, duration), 3), 'text': text})
            if len(segments) > 500 or sum(len(s['text']) for s in segments) > max_characters:
                raise TranscriptionError('transcript_size_limit')
        if not segments:
            raise TranscriptionError('no_speech_detected')
        transcript = 'WEBVTT\n\n' + '\n\n'.join(f"{timestamp(s['start'])} --> {timestamp(s['end'])}\n{s['text']}" for s in segments)
        if len(transcript) > max_characters:
            raise TranscriptionError('transcript_size_limit')
        return {'status': 'ready', 'format': 'vtt', 'transcript': transcript, 'text': ' '.join(s['text'] for s in segments), 'segments': segments,
                'audioProcessed': True, 'sourceSha256': sha256(source), 'duration': duration, 'language': info.language,
                'model': {'repository': lock['repository'], 'revision': lock['revision'], 'device': 'cpu', 'computeType': 'int8'},
                'reviewRequired': True, 'visualsProcessed': False,
                'limitations': ['Reconhecimento automático local: revise palavras, nomes e números antes de aprovar.',
                                'Somente áudio, até 180 segundos e 12 MB; imagens, gestos e canal inteiro não foram analisados.']}


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--source', required=True)
    parser.add_argument('--model-dir', required=True)
    parser.add_argument('--max-seconds', type=int, default=180)
    parser.add_argument('--max-characters', type=int, default=45000)
    args = parser.parse_args()
    try:
        result = transcribe(args.source, args.model_dir, args.max_seconds, args.max_characters)
    except TranscriptionError as error:
        result = {'status': 'blocked', 'code': str(error)}
    except Exception:
        result = {'status': 'blocked', 'code': 'local_processor_failed'}
    print(json.dumps(result, ensure_ascii=False))
    return 0 if result['status'] == 'ready' else 1


if __name__ == '__main__':
    raise SystemExit(main())
