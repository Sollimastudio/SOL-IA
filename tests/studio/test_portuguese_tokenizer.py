import unittest

from local_studio.studio import StudioError
from local_studio.voice import portuguese_tokenizer


class PortugueseTokenizerTest(unittest.TestCase):
    def test_portuguese_preserves_encoder_without_initializing_downloaders(self):
        calls = []
        class Base:
            def __init__(self, path):
                raise AssertionError('upstream downloads must not initialize')
            def check_vocabset_sot_eot(self):
                calls.append('vocab checked')
            def encode(self, text, language_id, lowercase, nfkd_normalize):
                calls.append((text, language_id, lowercase, nfkd_normalize))
                return [14, 28]
        class Loader:
            @staticmethod
            def from_file(path):
                calls.append(path)
                return object()
        adapter = portuguese_tokenizer(Base, Loader)('verified-vocab.json')
        self.assertEqual(adapter.encode('Olá, Sol!', 'pt', False, False), [14, 28])
        self.assertEqual(calls, ['verified-vocab.json', 'vocab checked', ('Olá, Sol!', 'pt', False, False)])
        with self.assertRaises(StudioError):
            adapter.encode('text', 'zh')
        with self.assertRaises(StudioError):
            adapter.encode('text')
        self.assertEqual(len(calls), 3)


if __name__ == '__main__':
    unittest.main()
