import json
from pathlib import Path
import shutil
import tempfile
import unittest

from local_studio import audio, studio


@unittest.skipUnless(shutil.which('ffmpeg') and shutil.which('ffprobe'), 'FFmpeg required')
class AudioReviewTest(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.tmp = tempfile.TemporaryDirectory()
        cls.root = Path(cls.tmp.name)
        cls.tone = cls.root / 'reference with spaces.wav'
        cls.silence = cls.root / 'silence.wav'
        studio.run(['ffmpeg', '-nostdin', '-v', 'error', '-f', 'lavfi', '-i',
                    'sine=frequency=180:sample_rate=24000:duration=12', str(cls.tone)])
        studio.run(['ffmpeg', '-nostdin', '-v', 'error', '-f', 'lavfi', '-i',
                    'anullsrc=r=24000:cl=mono', '-t', '12', str(cls.silence)])
        cls.script = cls.root / 'script.txt'
        cls.script.write_text('Referência de teste. Não é uma voz clonada.')

    @classmethod
    def tearDownClass(cls):
        cls.tmp.cleanup()

    def test_audio_only_preparation_allows_voice_but_does_not_invent_a_portrait(self):
        job = studio.prepare(self.tone, self.script, self.root / 'jobs', seconds=10)
        manifest = studio.read_job(job)[1]
        self.assertEqual(manifest['input_mode'], 'audio_only')
        self.assertNotIn('portrait', manifest['assets'])
        self.assertTrue((job / 'reference.wav').is_file())
        studio.attach_audio(job, self.tone, 'synthetic_test')
        with self.assertRaisesRegex(studio.StudioError, 'falta imagem'):
            studio.render(job)

    def test_silence_is_not_a_voice_candidate_or_emotional_signal(self):
        result = audio.analyze(self.silence)
        self.assertIsNone(result['candidate'])
        self.assertIsNone(result['measurements']['rms_dbfs'])
        self.assertEqual(result['interpretation']['emotion'], 'not_inferred')
        self.assertEqual(result['interpretation']['speaker_count'], 'not_verified')

    def test_energy_measurements_do_not_claim_speech_understanding(self):
        result = audio.analyze(self.tone)
        self.assertAlmostEqual(result['measurements']['rms_dbfs'], -21.074, delta=.1)
        self.assertEqual(result['measurements']['near_full_scale_samples_percent'], 0)
        self.assertEqual(result['candidate']['duration_seconds'], 10)
        # A pure tone can pass the energy screen. The output must admit this limitation.
        self.assertEqual(result['interpretation']['speech_content'], 'not_transcribed')
        self.assertEqual(result['candidate']['listening_review'], 'pending')
        self.assertEqual(result['interpretation']['clone_quality'], 'not_tested')

    def test_processing_keeps_original_and_unfiltered_reference(self):
        before = studio.digest(self.tone)
        destination = self.root / 'pack'
        result = audio.prepare_audio_pack(self.tone, destination)
        self.assertEqual(before, studio.digest(self.tone))
        self.assertFalse(result['treatment']['reference_uses_denoising'])
        raw = destination / 'Sol_referencia_voz_sem_filtro.wav'
        treated = destination / 'Sol_voz_tratamento_leve_experimental.wav'
        self.assertAlmostEqual(studio.duration(studio.probe(raw)), 10, places=2)
        self.assertAlmostEqual(studio.duration(studio.probe(treated)), 12, delta=.1)
        self.assertEqual(result['treatment']['quality_improvement'], 'not_confirmed_by_listening')
        self.assertEqual(json.loads((destination / 'Sol_analise_tecnica_voz.json').read_text())['source_sha256'], before)
        with self.assertRaisesRegex(studio.StudioError, 'pasta nova'):
            audio.prepare_audio_pack(self.tone, destination)

    def test_near_fullscale_segments_are_not_selected_as_reference(self):
        clipped = self.root / 'fullscale.wav'
        studio.run(['ffmpeg', '-nostdin', '-v', 'error', '-f', 'lavfi', '-i',
                    'aevalsrc=1:s=24000:d=12', str(clipped)])
        result = audio.analyze(clipped)
        self.assertGreater(result['measurements']['near_full_scale_samples_percent'], 99)
        self.assertIsNone(result['candidate'])


if __name__ == '__main__':
    unittest.main()
