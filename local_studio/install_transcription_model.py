"""Explicit download of fixed ASR weights. No media is accepted or uploaded."""
import argparse
import json
import os
from pathlib import Path
import tempfile
import urllib.request
from .transcription import LOCK, sha256, verify_model, TranscriptionError


def install(destination):
    folder = Path(destination).expanduser().resolve()
    folder.mkdir(parents=True, exist_ok=True, mode=0o700)
    lock = json.loads(LOCK.read_text())
    marker = folder / '.installing'
    fd = os.open(marker, os.O_CREAT | os.O_EXCL | os.O_WRONLY, 0o600)
    os.close(fd)
    try:
        for name, expected in lock['files'].items():
            target = folder / name
            if target.is_symlink():
                raise TranscriptionError('model_integrity_failed')
            if target.exists():
                if sha256(target) != expected['sha256']:
                    raise TranscriptionError('existing_model_differs_use_new_folder')
                continue
            with tempfile.TemporaryDirectory(prefix='.download-', dir=folder) as temporary:
                pending = Path(temporary) / name
                url = f"https://huggingface.co/{lock['repository']}/resolve/{lock['revision']}/{name}?download=true"
                with urllib.request.urlopen(url, timeout=50) as response, pending.open('xb') as output:
                    count = 0
                    while chunk := response.read(1024 * 1024):
                        count += len(chunk)
                        if count > expected['size']:
                            raise TranscriptionError('model_size_limit')
                        output.write(chunk)
                if count != expected['size'] or sha256(pending) != expected['sha256']:
                    raise TranscriptionError('model_integrity_failed')
                pending.chmod(0o600)
                pending.rename(target)
        verify_model(folder)
        return {'status': 'ready', 'repository': lock['repository'], 'revision': lock['revision'], 'mediaProcessed': False}
    finally:
        marker.unlink(missing_ok=True)


if __name__ == '__main__':
    parser = argparse.ArgumentParser()
    parser.add_argument('--destination', required=True)
    print(json.dumps(install(parser.parse_args().destination)))
