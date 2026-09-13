import hashlib
import json
from pathlib import Path
import tempfile
import unittest
from unittest.mock import patch

from local_studio import install_model, voice
from local_studio.studio import StudioError


class ModelInstallationTest(unittest.TestCase):
    def setUp(self):
        self.tmp = tempfile.TemporaryDirectory()
        self.addCleanup(self.tmp.cleanup)
        self.root = Path(self.tmp.name)
        self.destination = self.root / 'models'
        self.payload = b'fixture, not real model weights'
        receipt = json.loads(install_model.LOCK.read_text())
        receipt['files'] = {name: hashlib.sha256(self.payload).hexdigest()
                            for name in voice.REQUIRED_WEIGHTS}
        self.lock = self.root / 'reviewed.json'
        self.lock.write_text(json.dumps(receipt))
        self.calls = []
        self.patcher = patch.object(install_model, 'LOCK', self.lock)
        self.patcher.start()
        self.addCleanup(self.patcher.stop)

    def fetch(self, url, destination):
        self.assertIn('/resolve/5bb1f6ee58e50c3b8d408bc82a6d3740c2db6e18/', url)
        self.calls.append(url)
        destination.write_bytes(self.payload)

    def test_verified_installation_reuses_files_without_network(self):
        install_model.install(self.destination, self.fetch)
        voice.verify_model(self.destination)
        self.assertEqual(len(self.calls), len(voice.REQUIRED_WEIGHTS))
        install_model.install(self.destination, lambda *args: self.fail('must not download twice'))

    def test_interrupted_download_is_resumable_without_false_completion(self):
        def interrupted(url, destination):
            if self.calls:
                destination.write_bytes(b'partial')
                raise OSError('connection interrupted')
            self.fetch(url, destination)
        with self.assertRaises(OSError):
            install_model.install(self.destination, interrupted)
        self.assertFalse((self.destination / 'jarvis-model.json').exists())
        self.assertFalse((self.destination / '.installing').exists())
        self.assertEqual(len(list(self.destination.iterdir())), 1)
        install_model.install(self.destination, self.fetch)
        self.assertEqual(len(self.calls), len(voice.REQUIRED_WEIGHTS))
        voice.verify_model(self.destination)

    def test_corrupt_download_never_becomes_installed(self):
        with self.assertRaises(StudioError):
            install_model.install(self.destination, lambda url, path: path.write_bytes(b'corrupt'))
        self.assertEqual(list(self.destination.iterdir()), [])

    def test_different_release_and_symlink_are_not_overwritten(self):
        self.destination.mkdir()
        manifest = self.destination / 'jarvis-model.json'
        manifest.write_text('{}')
        with self.assertRaises(StudioError):
            install_model.install(self.destination, self.fetch)
        self.assertEqual(manifest.read_text(), '{}')
        manifest.unlink()
        name = next(iter(json.loads(self.lock.read_text())['files']))
        (self.destination / name).symlink_to(self.lock)
        with self.assertRaises(StudioError):
            install_model.install(self.destination, self.fetch)
        self.assertEqual(self.calls, [])

    def test_active_installation_is_not_disturbed(self):
        self.destination.mkdir()
        lock = self.destination / '.installing'
        lock.touch()
        with self.assertRaises(StudioError):
            install_model.install(self.destination, self.fetch)
        self.assertTrue(lock.exists())
        self.assertEqual(self.calls, [])


if __name__ == '__main__':
    unittest.main()
