"""Decoder/limit tests need ffmpeg, not a model or downloaded user media."""
import subprocess
import tempfile
import unittest
from pathlib import Path
from local_studio.transcription import transcribe, verify_model, TranscriptionError


class RecognitionBoundaryTests(unittest.TestCase):
    def test_playlist_cannot_open_remote_or_additional_files(self):
        with tempfile.TemporaryDirectory() as folder:
            source = Path(folder) / 'reference.m3u8'
            source.write_text('#EXTM3U\n#EXTINF:3,\nhttps://127.0.0.1/private.wav\n')
            with self.assertRaisesRegex(TranscriptionError, 'media_decode_failed'):
                transcribe(source, Path(folder) / 'no-model')

    def test_long_audio_is_refused_before_loading_a_model_not_truncated(self):
        with tempfile.TemporaryDirectory() as folder:
            source = Path(folder) / 'audio.wav'
            subprocess.run(['ffmpeg', '-nostdin', '-v', 'error', '-f', 'lavfi', '-i', 'sine=frequency=300:sample_rate=16000', '-t', '2', str(source)], check=True)
            with self.assertRaisesRegex(TranscriptionError, 'media_duration_limit'):
                transcribe(source, Path(folder) / 'no-model', max_seconds=1)

    def test_video_without_audio_never_becomes_a_transcript(self):
        with tempfile.TemporaryDirectory() as folder:
            source = Path(folder) / 'silent.mp4'
            subprocess.run(['ffmpeg', '-nostdin', '-v', 'error', '-f', 'lavfi', '-i', 'color=c=white:s=64x64:d=1', '-c:v', 'libx264', str(source)], check=True)
            with self.assertRaisesRegex(TranscriptionError, 'audio_stream_missing'):
                transcribe(source, Path(folder) / 'no-model')

    def test_incomplete_model_is_not_accepted(self):
        with tempfile.TemporaryDirectory() as folder:
            (Path(folder) / 'config.json').write_text('{}')
            with self.assertRaisesRegex(TranscriptionError, 'model_integrity_failed'):
                verify_model(folder)
