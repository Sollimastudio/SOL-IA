"""Explicit, resumable download of the reviewed model; never receives user media."""
import argparse
import json
import os
from pathlib import Path
import shutil
import tempfile
import urllib.error
import urllib.request

from .studio import StudioError, digest
from .voice import verify_model


LOCK = Path(__file__).with_name('model-lock.json')
MAX_FILE_BYTES = 2_200_000_000


def download(url, target):
    with urllib.request.urlopen(url, timeout=60) as response, target.open('xb') as output:
        count = 0
        while chunk := response.read(1024 * 1024):
            count += len(chunk)
            if count > MAX_FILE_BYTES:
                raise StudioError('Download excedeu o tamanho previsto para os pesos.')
            output.write(chunk)


def install(destination, fetch=download):
    receipt = json.loads(LOCK.read_text(encoding='utf-8'))
    folder = Path(destination).expanduser().resolve()
    folder.mkdir(parents=True, exist_ok=True, mode=0o700)
    # Existing receipts must refer to this exact reviewed release.
    manifest = folder / 'jarvis-model.json'
    if manifest.is_symlink():
        raise StudioError('Manifesto do modelo não pode ser link simbólico.')
    if manifest.exists():
        if json.loads(manifest.read_text(encoding='utf-8')) != receipt:
            raise StudioError('Outra versão já ocupa a pasta; escolha uma pasta nova.')
        return verify_model(folder)[0]
    lock = folder / '.installing'
    try:
        fd = os.open(lock, os.O_CREAT | os.O_EXCL | os.O_WRONLY, 0o600)
    except FileExistsError as exc:
        raise StudioError('Instalação ocupada; confirme o processo antes de remover o lock.') from exc
    os.close(fd)
    try:
        for name, expected in receipt['files'].items():
            target = folder / name
            if target.is_symlink():
                raise StudioError('Peso do modelo não pode ser link simbólico.')
            if target.exists():
                if not target.is_file() or digest(target) != expected:
                    raise StudioError('Arquivo existente diverge da versão; use uma pasta nova.')
                continue
            if shutil.disk_usage(folder).free < MAX_FILE_BYTES + 100_000_000:
                raise StudioError('Espaço livre insuficiente para baixar os pesos com segurança.')
            with tempfile.TemporaryDirectory(prefix='.download-', dir=folder) as temporary:
                pending = Path(temporary) / name
                url = ('https://huggingface.co/' + receipt['repository'] + '/resolve/'
                       + receipt['weights_revision'] + '/' + name)
                fetch(url, pending)
                if pending.is_symlink() or not pending.is_file() or digest(pending) != expected:
                    raise StudioError('Integridade do download não confirmada; modelo não instalado.')
                os.chmod(pending, 0o600)
                pending.rename(target)
        with tempfile.NamedTemporaryFile(mode='w', encoding='utf-8', dir=folder, delete=False) as f:
            temporary_manifest = Path(f.name)
            json.dump(receipt, f, indent=2)
            f.flush()
            os.fsync(f.fileno())
        try:
            temporary_manifest.replace(manifest)
            return verify_model(folder)[0]
        except Exception:
            manifest.unlink(missing_ok=True)
            raise
        finally:
            temporary_manifest.unlink(missing_ok=True)
    finally:
        lock.unlink(missing_ok=True)


def main():
    parser = argparse.ArgumentParser(description='Baixar pesos oficiais revisados (~3,2 GB), sem enviar mídia')
    parser.add_argument('--destination', required=True)
    args = parser.parse_args()
    try:
        result = install(args.destination)
        print(json.dumps({'model_dir': str(result), 'integrity': 'verified', 'voice_generated': False}))
    except (StudioError, OSError, ValueError, urllib.error.URLError) as exc:
        print(json.dumps({'ok': False, 'error': str(exc)}, ensure_ascii=False))
        return 1
    return 0


if __name__ == '__main__':
    raise SystemExit(main())
