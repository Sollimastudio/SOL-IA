"""Local, resumable preparation and rendering; use python -m local_studio.studio."""
import argparse
from contextlib import contextmanager
import hashlib
import importlib.util
import json
import math
import os
from pathlib import Path
import platform
import shutil
import subprocess
import sys
import tempfile
import uuid


class StudioError(Exception):
    pass


def digest(path):
    with Path(path).open('rb') as source:
        return hashlib.file_digest(source, 'sha256').hexdigest()


def run(argv, timeout=180):
    try:
        result = subprocess.run(argv, capture_output=True, text=True, timeout=timeout, check=True)
        return result.stdout
    except FileNotFoundError as exc:
        raise StudioError(f'Ferramenta ausente: {argv[0]}') from exc
    except (subprocess.CalledProcessError, subprocess.TimeoutExpired) as exc:
        # Do not leak media contents or local paths from decoder diagnostics.
        raise StudioError(f'{Path(argv[0]).name} não concluiu o processamento; originais preservados.') from exc


def local_file(value):
    path = Path(value).expanduser().resolve()
    if not path.is_file():
        raise StudioError('É necessário um arquivo local existente.')
    return path


def probe(path):
    path = local_file(path)
    result = json.loads(run(['ffprobe', '-v', 'error', '-protocol_whitelist', 'file',
                             '-show_format', '-show_streams', '-of', 'json', str(path)]))
    return result


def duration(info):
    try:
        value = float(info['format']['duration'])
    except (KeyError, TypeError, ValueError) as exc:
        raise StudioError('Não foi possível verificar a duração da mídia.') from exc
    if not math.isfinite(value) or value <= 0:
        raise StudioError('Duração inválida.')
    return value


def has_stream(info, kind):
    return any(s.get('codec_type') == kind for s in info.get('streams', []))


def ffmpeg(args):
    run(['ffmpeg', '-nostdin', '-hide_banner', '-loglevel', 'error', '-n', *args])


def private_write(path, content):
    with Path(path).open('x', encoding='utf-8') as output:
        os.chmod(path, 0o600)
        output.write(content)


def save_manifest(job, manifest):
    fd, tmp = tempfile.mkstemp(prefix='.manifest-', dir=job)
    try:
        with os.fdopen(fd, 'w', encoding='utf-8') as output:
            json.dump(manifest, output, ensure_ascii=False, indent=2)
            output.write('\n')
            output.flush()
            os.fsync(output.fileno())
        os.replace(tmp, job / 'job.json')
    finally:
        Path(tmp).unlink(missing_ok=True)


def asset(path):
    os.chmod(path, 0o600)
    return {'file': path.name, 'sha256': digest(path)}


def verified_asset(job, entry):
    name = entry.get('file', '')
    if not name or Path(name).name != name:
        raise StudioError('Caminho de arquivo inválido no trabalho.')
    path = job / name
    if path.is_symlink() or not path.is_file() or path.resolve().parent != job.resolve():
        raise StudioError('Arquivo do trabalho ausente ou fora da pasta privada.')
    if digest(path) != entry.get('sha256'):
        raise StudioError('Arquivo alterado desde o registro; crie uma nova versão do trabalho.')
    return path


def read_job(job):
    job = Path(job).resolve()
    try:
        manifest = json.loads((job / 'job.json').read_text(encoding='utf-8'))
        if manifest['schema'] != 'jarvis-local-studio-v1':
            raise ValueError('schema')
        for entry in manifest['assets'].values():
            verified_asset(job, entry)
    except (OSError, KeyError, ValueError, TypeError) as exc:
        raise StudioError('Trabalho inválido ou incompleto.') from exc
    return job, manifest


@contextmanager
def locked_job(job):
    job = Path(job).resolve()
    lock = job / '.working'
    try:
        fd = os.open(lock, os.O_WRONLY | os.O_CREAT | os.O_EXCL, 0o600)
    except FileExistsError as exc:
        raise StudioError('Trabalho ocupado. Não inicie duas gerações do mesmo trabalho.') from exc
    os.close(fd)
    try:
        yield read_job(job)
    finally:
        lock.unlink(missing_ok=True)


def prepare(source, script, workspace, start=0.0, seconds=10.0, idea=None):
    source, script = local_file(source), local_file(script)
    text = script.read_text(encoding='utf-8')
    if not text.strip() or len(text) > 20000:
        raise StudioError('Roteiro vazio ou acima de 20.000 caracteres.')
    if not all(math.isfinite(x) for x in [start, seconds]) or start < 0 or not 3 <= seconds <= 30:
        raise StudioError('Escolha de 3 a 30 segundos de referência, com início não negativo.')
    source_info = probe(source)
    if not has_stream(source_info, 'audio'):
        raise StudioError('A referência precisa conter áudio.')
    with_video = has_stream(source_info, 'video')
    if start + seconds > duration(source_info) + 0.05:
        raise StudioError('O trecho solicitado ultrapassa a gravação.')
    root = Path(workspace).expanduser().resolve()
    root.mkdir(parents=True, exist_ok=True, mode=0o700)
    identifier = str(uuid.uuid4())
    pending = Path(tempfile.mkdtemp(prefix='.preparing-', dir=root))
    try:
        private_write(pending / 'script.txt', text)
        if idea is not None:
            private_write(pending / 'idea.txt', local_file(idea).read_text(encoding='utf-8'))
        common = ['-protocol_whitelist', 'file', '-ss', str(start), '-i', str(source)]
        ffmpeg([*common, '-t', str(seconds), '-map', '0:a:0', '-vn', '-ac', '1',
                '-ar', '24000', '-c:a', 'pcm_s16le', '-map_metadata', '-1', str(pending / 'reference.wav')])
        if with_video:
            ffmpeg([*common, '-map', '0:v:0', '-frames:v', '1', '-update', '1',
                    '-vf', "scale=w='min(1080,iw)':h=-2", '-map_metadata', '-1', str(pending / 'portrait.png')])
        ref_duration = duration(probe(pending / 'reference.wav'))
        if abs(ref_duration - seconds) > 0.2:
            raise StudioError('A extração não preservou a duração esperada.')
        assets = {key: asset(pending / name) for key, name in {
            'script': 'script.txt', 'reference': 'reference.wav'
        }.items()}
        if with_video:
            assets['portrait'] = asset(pending / 'portrait.png')
        if idea is not None:
            assets['idea'] = asset(pending / 'idea.txt')
        manifest = {'schema': 'jarvis-local-studio-v1', 'id': identifier,
                    'purpose': 'content_production',
                    'stage': 'references_ready', 'assets': assets,
                    'source_sha256': digest(source), 'reference_start_seconds': start,
                    'reference_seconds': ref_duration, 'language': 'pt',
                    'approval': 'draft', 'avatar': 'not_generated',
                    'input_mode': 'video_and_audio' if with_video else 'audio_only',
                    'limitations': ['portrait_is_still' if with_video else 'portrait_missing', 'voice_identity_not_evaluated',
                                    'gesture_model_not_implemented', 'not_published']}
        save_manifest(pending, manifest)
        target = root / identifier
        pending.rename(target)
        return target
    except BaseException:
        shutil.rmtree(pending)
        raise


def attach_audio(job, audio, kind):
    if kind not in {'recorded', 'synthetic_test', 'generated_external'}:
        raise StudioError('Informe a procedência do áudio.')
    audio = local_file(audio)
    info = probe(audio)
    if not has_stream(info, 'audio') or duration(info) > 300:
        raise StudioError('É necessário áudio de até cinco minutos.')
    with locked_job(job) as (job, manifest):
        if 'narration' in manifest['assets']:
            raise StudioError('Narração já registrada. Crie outra versão para substituí-la.')
        with tempfile.TemporaryDirectory(prefix='.audio-', dir=job) as tmp:
            path = Path(tmp) / 'narration.wav'
            ffmpeg(['-protocol_whitelist', 'file', '-i', str(audio), '-map', '0:a:0',
                    '-vn', '-ac', '1', '-ar', '24000', '-c:a', 'pcm_s16le',
                    '-map_metadata', '-1', str(path)])
            if not has_stream(probe(path), 'audio'):
                raise StudioError('Não foi produzido áudio válido.')
            target = job / ('narration-' + str(uuid.uuid4()) + '.wav')
            path.rename(target)
        manifest['assets']['narration'] = asset(target)
        manifest['narration'] = {'origin': kind, 'script_match': 'not_verified',
                                 'voice_identity': 'not_verified'}
        manifest['stage'] = 'narration_ready'
        save_manifest(job, manifest)


def render(job):
    with locked_job(job) as (job, manifest):
        if manifest.get('narration', {}).get('human_review') == 'rejected':
            raise StudioError('Narração reprovada pela dona da voz; crie um novo ensaio antes de montar o vídeo.')
        if 'narration' not in manifest['assets']:
            raise StudioError('Falta uma narração. A amostra de referência não será usada como fala nova.')
        if 'portrait' not in manifest['assets']:
            raise StudioError('Referência somente de voz: falta imagem para montar o vídeo.')
        if 'preview' in manifest['assets']:
            return verified_asset(job, manifest['assets']['preview'])
        image = verified_asset(job, manifest['assets']['portrait'])
        audio = verified_asset(job, manifest['assets']['narration'])
        expected = duration(probe(audio))
        if expected > 300:
            raise StudioError('A prévia aceita até cinco minutos de narração.')
        with tempfile.TemporaryDirectory(prefix='.render-', dir=job) as tmp:
            path = Path(tmp) / 'preview.mp4'
            ffmpeg(['-protocol_whitelist', 'file', '-loop', '1', '-framerate', '25', '-i', str(image),
                    '-protocol_whitelist', 'file', '-i', str(audio), '-map', '0:v:0', '-map', '1:a:0',
                    '-vf', 'scale=720:1280:force_original_aspect_ratio=decrease,pad=720:1280:(ow-iw)/2:(oh-ih)/2,setsar=1',
                    '-t', str(expected), '-c:v', 'libx264', '-preset', 'fast', '-threads', '2',
                    '-pix_fmt', 'yuv420p', '-c:a', 'aac', '-b:a', '128k', '-map_metadata', '-1',
                    '-metadata', 'comment=Jarvis draft: still portrait; not an animated avatar',
                    '-movflags', '+faststart', str(path)])
            info = probe(path)
            video = next((s for s in info['streams'] if s.get('codec_type') == 'video'), {})
            if (video.get('width'), video.get('height')) != (720, 1280) or not has_stream(info, 'audio'):
                raise StudioError('O vídeo não passou na verificação de imagem e áudio.')
            if abs(duration(info) - expected) > 0.2:
                raise StudioError('O vídeo não preservou a duração da narração.')
            target = job / ('preview-' + str(uuid.uuid4()) + '.mp4')
            path.rename(target)
        manifest['assets']['preview'] = asset(target)
        manifest['stage'] = 'still_preview_ready'
        manifest['preview'] = {'width': 720, 'height': 1280, 'duration_seconds': duration(info),
                               'lip_sync': False, 'motion': False, 'human_review': 'pending'}
        save_manifest(job, manifest)
        return target


def doctor():
    return {'system': platform.system(), 'architecture': platform.machine(),
            'python': platform.python_version(),
            'tools': {name: bool(shutil.which(name)) for name in ['ffmpeg', 'ffprobe']},
            'packages': {name: importlib.util.find_spec(name) is not None
                         for name in ['torch', 'chatterbox', 'soundfile']},
            'scope': 'this_machine_only', 'cloud_service': False,
            'voice_clone_verified': False, 'avatar_verified': False}


def main():
    parser = argparse.ArgumentParser(description='Jarvis: estúdio local sem API paga')
    commands = parser.add_subparsers(dest='command', required=True)
    commands.add_parser('doctor')
    command = commands.add_parser('prepare')
    for name in ['source', 'script', 'workspace']:
        command.add_argument('--' + name, required=True)
    command.add_argument('--idea')
    command.add_argument('--start', type=float, default=0)
    command.add_argument('--seconds', type=float, default=10)
    command = commands.add_parser('attach-audio')
    command.add_argument('--job', required=True)
    command.add_argument('--audio', required=True)
    command.add_argument('--kind', required=True, choices=['recorded', 'synthetic_test', 'generated_external'])
    for name in ['render', 'status']:
        command = commands.add_parser(name)
        command.add_argument('--job', required=True)
    args = vars(parser.parse_args())
    command = args.pop('command')
    try:
        if command == 'doctor':
            result = doctor()
        elif command == 'prepare':
            result = {'job': str(prepare(**args)), 'stage': 'references_ready'}
        elif command == 'attach-audio':
            attach_audio(**args)
            result = {'stage': 'narration_ready'}
        elif command == 'render':
            result = {'preview': str(render(**args)), 'animated_avatar': False}
        else:
            result = read_job(args['job'])[1]
        print(json.dumps(result, ensure_ascii=False, indent=2))
    except (StudioError, OSError, ValueError) as exc:
        print(json.dumps({'ok': False, 'error': str(exc)}, ensure_ascii=False), file=sys.stderr)
        return 1
    return 0


if __name__ == '__main__':
    raise SystemExit(main())
