import json
import os
from pathlib import Path
import shutil
import subprocess
import tempfile
import unittest
from unittest.mock import patch

from local_studio import studio, voice


@unittest.skipUnless(shutil.which('ffmpeg') and shutil.which('ffprobe'), 'FFmpeg required')
class LocalStudioTest(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.scratch = tempfile.TemporaryDirectory()
        cls.root = Path(cls.scratch.name)
        cls.source = cls.root / 'source $literal ; spaces.mp4'
        studio.run(['ffmpeg', '-nostdin', '-v', 'error', '-f', 'lavfi', '-i',
                    'color=c=0x261138:s=640x360:r=25:d=4', '-f', 'lavfi', '-i',
                    'sine=frequency=440:sample_rate=24000:duration=4', '-c:v', 'libx264',
                    '-threads', '1', '-pix_fmt', 'yuv420p', '-c:a', 'aac', '-shortest', str(cls.source)])
        cls.source_hash = studio.digest(cls.source)
        cls.script = cls.root / 'script.txt'
        cls.original = '  Questionar não é concluir.\nQuero compreender as fontes.\n'
        cls.script.write_text(cls.original, encoding='utf-8')
        cls.tone = cls.root / 'synthetic-test.wav'
        studio.run(['ffmpeg', '-nostdin', '-v', 'error', '-f', 'lavfi', '-i',
                    'sine=frequency=550:sample_rate=24000:duration=1.2', str(cls.tone)])

    @classmethod
    def tearDownClass(cls):
        cls.scratch.cleanup()

    def job(self):
        return studio.prepare(self.source, self.script, self.root / 'jobs', seconds=3)

    def model(self):
        folder = Path(tempfile.mkdtemp(dir=self.root))
        receipt = {'repository': 'ResembleAI/chatterbox', 'code_revision': voice.CODE_REVISION,
                   'weights_revision': 'a' * 40, 'adapter_source_sha256': 'b' * 64,
                   'license_source': 'https://huggingface.co/ResembleAI/chatterbox/blob/' + 'a' * 40 + '/LICENSE',
                   'files': {}}
        for name in voice.REQUIRED_WEIGHTS:
            (folder / name).write_bytes(b'test fixture only; not model weights')
            receipt['files'][name] = studio.digest(folder / name)
        (folder / 'jarvis-model.json').write_text(json.dumps(receipt))
        return folder

    def test_real_preparation_preserves_original_and_private_reference(self):
        job = self.job()
        manifest = studio.read_job(job)[1]
        self.assertEqual((job / 'script.txt').read_text(), self.original)
        self.assertEqual(studio.digest(self.source), self.source_hash)
        self.assertEqual(manifest['source_sha256'], self.source_hash)
        self.assertEqual(manifest['stage'], 'references_ready')
        self.assertEqual(manifest['avatar'], 'not_generated')
        ref = studio.probe(job / 'reference.wav')
        self.assertEqual(ref['streams'][0]['sample_rate'], '24000')
        self.assertEqual(ref['streams'][0]['channels'], 1)
        self.assertAlmostEqual(studio.duration(ref), 3, places=2)
        self.assertEqual(job.stat().st_mode & 0o777, 0o700)
        self.assertEqual((job / 'script.txt').stat().st_mode & 0o777, 0o600)

    def test_real_video_contains_audio_vertical_frame_and_truthful_state(self):
        job = self.job()
        studio.attach_audio(job, self.tone, 'synthetic_test')
        output = studio.render(job)
        info = studio.probe(output)
        self.assertTrue(studio.has_stream(info, 'audio'))
        video = next(x for x in info['streams'] if x['codec_type'] == 'video')
        self.assertEqual((video['width'], video['height']), (720, 1280))
        self.assertAlmostEqual(studio.duration(info), 1.2, delta=0.1)
        manifest = studio.read_job(job)[1]
        self.assertEqual(manifest['narration']['origin'], 'synthetic_test')
        self.assertFalse(manifest['preview']['lip_sync'])
        self.assertEqual(manifest['preview']['human_review'], 'pending')
        self.assertEqual(studio.render(job), output)
        # Verify the file can actually be decoded, not just a valid-looking manifest.
        studio.run(['ffmpeg', '-v', 'error', '-i', str(output), '-f', 'null', '-'])
        evidence = os.environ.get('JARVIS_STUDIO_TEST_EVIDENCE_DIR')
        if evidence:
            target = Path(evidence)
            target.mkdir(parents=True, exist_ok=True)
            shutil.copyfile(output, target / 'synthetic-still-preview.mp4')
            (target / 'verification.json').write_text(json.dumps(manifest, indent=2))
            studio.run(['ffmpeg', '-v', 'error', '-i', str(output), '-frames:v', '1',
                        '-update', '1', '-y', str(target / 'synthetic-frame.png')])

    def test_reference_audio_is_never_presented_as_new_narration(self):
        job = self.job()
        with self.assertRaisesRegex(studio.StudioError, 'Falta uma narração'):
            studio.render(job)
        self.assertFalse(list(job.glob('preview-*.mp4')))

    def test_changed_script_is_rejected_before_synthesis(self):
        job = self.job()
        (job / 'script.txt').write_text('Outro conteúdo')
        with self.assertRaisesRegex(studio.StudioError, 'Arquivo alterado'):
            studio.attach_audio(job, self.tone, 'synthetic_test')

    def test_paths_and_symlinks_cannot_escape_the_job(self):
        job = self.job()
        with self.assertRaises(studio.StudioError):
            studio.verified_asset(job, {'file': '../script.txt', 'sha256': studio.digest(self.script)})
        (job / 'outside.txt').symlink_to(self.script)
        with self.assertRaises(studio.StudioError):
            studio.verified_asset(job, {'file': 'outside.txt', 'sha256': studio.digest(self.script)})

    def test_duplicate_narration_and_concurrent_job_are_refused(self):
        job = self.job()
        studio.attach_audio(job, self.tone, 'synthetic_test')
        before = (job / 'job.json').read_bytes()
        with self.assertRaises(studio.StudioError):
            studio.attach_audio(job, self.tone, 'recorded')
        (job / '.working').touch()
        with self.assertRaisesRegex(studio.StudioError, 'ocupado'):
            studio.render(job)
        self.assertEqual((job / 'job.json').read_bytes(), before)

    def test_failed_render_keeps_narration_and_does_not_claim_completion(self):
        job = self.job()
        studio.attach_audio(job, self.tone, 'synthetic_test')
        before = (job / 'job.json').read_bytes()
        with patch.object(studio, 'ffmpeg', side_effect=studio.StudioError('decoder failed')):
            with self.assertRaises(studio.StudioError):
                studio.render(job)
        self.assertEqual((job / 'job.json').read_bytes(), before)
        self.assertFalse((job / '.working').exists())
        self.assertFalse(list(job.glob('preview-*.mp4')))

    def test_invalid_reference_range_does_not_create_a_ready_job(self):
        for start, seconds in [(3, 3), (0, float('nan')), (-1, 3), (0, 31)]:
            with self.subTest(start=start, seconds=seconds):
                with self.assertRaises(studio.StudioError):
                    studio.prepare(self.source, self.script, self.root / 'bad', start, seconds)
        self.assertFalse((self.root / 'bad').exists())

    def test_corrupt_model_and_untracked_optional_weights_fail_closed(self):
        model = self.model()
        voice.verify_model(model)
        (model / 'conds.pt').write_bytes(b'untracked')
        with self.assertRaises(studio.StudioError):
            voice.verify_model(model)
        (model / 'conds.pt').unlink()
        (model / 've.pt').write_bytes(b'changed')
        with self.assertRaises(studio.StudioError):
            voice.verify_model(model)

    def test_synthesis_contract_and_failed_attempt_preserve_state(self):
        job = self.job()
        model = self.model()
        before = (job / 'job.json').read_bytes()
        def failed(*args):
            raise studio.StudioError('model failed')
        with self.assertRaises(studio.StudioError):
            voice.synthesize(job, model, generator=failed)
        self.assertEqual((job / 'job.json').read_bytes(), before)
        # Contract stub only. This is NOT a real voice-cloning acceptance test.
        calls = []
        def generated(text, reference, weights, device, output, receipt):
            calls.append((text, reference.name, weights, device))
            shutil.copyfile(self.tone, output)
        voice.synthesize(job, model, generator=generated)
        self.assertEqual(calls, [(self.original, 'reference.wav', model, 'cpu')])
        manifest = studio.read_job(job)[1]
        self.assertEqual(manifest['narration']['voice_identity'], 'not_verified')
        self.assertEqual(manifest['narration']['script_match'], 'not_verified')

    def test_long_script_is_not_silently_truncated(self):
        long_script = self.root / 'long.txt'
        long_script.write_text('Palavra ' * 50)
        job = studio.prepare(self.source, long_script, self.root / 'jobs', seconds=3)
        with self.assertRaisesRegex(studio.StudioError, '300 caracteres'):
            voice.synthesize(job, self.model(), generator=lambda *args: self.fail('must not generate'))

    def test_network_audit_policy_refuses_remote_generation(self):
        for event in ['socket.connect', 'socket.connect_ex', 'socket.getaddrinfo', 'socket.sendto']:
            with self.assertRaises(studio.StudioError):
                voice.deny_network(event, ())


if __name__ == '__main__':
    unittest.main()
