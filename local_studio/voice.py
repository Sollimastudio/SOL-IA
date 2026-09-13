"""Optional Chatterbox adapter. Model installation is a separate, deliberate step."""
import argparse
import importlib.util
import json
import os
from pathlib import Path
import re
import sys
import tempfile
import uuid

from .studio import StudioError, asset, digest, duration, has_stream, locked_job, probe, save_manifest, verified_asset

CODE_REVISION = '5de7a54aa4e5e2baadb0182dde554908b48b85c2'
REQUIRED_WEIGHTS = {'ve.pt', 's3gen.pt', 't3_mtl23ls_v3.safetensors',
                    'grapheme_mtl_merged_expanded_v1.json'}
OPTIONAL_WEIGHTS = {'conds.pt', 'Cangjie5_TC.json'}


def verify_model(directory):
    directory = Path(directory).resolve()
    try:
        receipt = json.loads((directory / 'jarvis-model.json').read_text(encoding='utf-8'))
        if receipt['repository'] != 'ResembleAI/chatterbox' or receipt['code_revision'] != CODE_REVISION:
            raise ValueError('revision')
        if not re.fullmatch('[a-f0-9]{40}', receipt['weights_revision']):
            raise ValueError('weights revision')
        if not receipt['license_source'].startswith('https://huggingface.co/ResembleAI/chatterbox/'):
            raise ValueError('license source')
        files = receipt['files']
        if not REQUIRED_WEIGHTS <= files.keys() or not files.keys() <= REQUIRED_WEIGHTS | OPTIONAL_WEIGHTS:
            raise ValueError('files')
        for name in OPTIONAL_WEIGHTS:
            if (directory / name).exists() and name not in files:
                raise ValueError('unrecorded optional weights')
        for name, expected in files.items():
            if not re.fullmatch('[a-f0-9]{64}', expected):
                raise ValueError('checksum')
            verified_asset(directory, {'file': name, 'sha256': expected})
        if not re.fullmatch('[a-f0-9]{64}', receipt['adapter_source_sha256']):
            raise ValueError('adapter source')
    except (OSError, KeyError, ValueError, TypeError, AttributeError) as exc:
        raise StudioError('Modelo local sem manifesto de versão, licença e integridade válido.') from exc
    return directory, receipt


def deny_network(event, args):
    if event in {'socket.connect', 'socket.connect_ex', 'socket.getaddrinfo', 'socket.sendto'}:
        raise StudioError('Síntese local recusou acesso à rede; prepare as dependências antes.')


def portuguese_tokenizer(base, tokenizer_loader):
    """Keep upstream PT encoding; don't initialize unrelated Chinese downloaders.

    The reviewed upstream constructor loads Chinese assets unconditionally.
    This worker only generates Portuguese and refuses other language paths.
    """
    class PortugueseTokenizer(base):
        def __init__(self, vocab_file_path):
            self.tokenizer = tokenizer_loader.from_file(vocab_file_path)
            self.cangjie_converter = None
            self.check_vocabset_sot_eot()

        def encode(self, txt, language_id=None, lowercase=True, nfkd_normalize=True):
            if language_id != 'pt':
                raise StudioError('Este adaptador local foi validado somente para português.')
            return super().encode(txt, language_id, lowercase, nfkd_normalize)

    return PortugueseTokenizer


def generate_local(text, reference, model_dir, device, output, receipt):
    # HF flags avoid implicit downloads. Audit hook blocks Python socket use as well.
    # This is not an OS sandbox against hostile native extensions: install reviewed dependencies only.
    os.environ['HF_HUB_OFFLINE'] = '1'
    os.environ['TRANSFORMERS_OFFLINE'] = '1'
    os.environ['HF_HUB_DISABLE_TELEMETRY'] = '1'
    sys.addaudithook(deny_network)
    missing = [name for name in ['torch', 'chatterbox', 'soundfile'] if importlib.util.find_spec(name) is None]
    if missing:
        raise StudioError('Dependências locais ausentes: ' + ', '.join(missing) + '. Nenhum download foi iniciado.')
    import torch
    import soundfile
    import chatterbox.mtl_tts as module
    from tokenizers import Tokenizer
    if digest(module.__file__) != receipt['adapter_source_sha256']:
        raise StudioError('A versão instalada do adaptador diverge do manifesto revisado.')
    if device == 'cuda' and not torch.cuda.is_available():
        raise StudioError('CUDA solicitada, mas indisponível neste computador.')
    if device == 'mps' and not torch.backends.mps.is_available():
        raise StudioError('MPS solicitada, mas indisponível neste computador.')
    original_tokenizer = module.MTLTokenizer
    module.MTLTokenizer = portuguese_tokenizer(original_tokenizer, Tokenizer)
    try:
        model = module.ChatterboxMultilingualTTS.from_local(str(model_dir), device=device, t3_model='v3')
    finally:
        module.MTLTokenizer = original_tokenizer
    waveform = model.generate(text, language_id='pt', audio_prompt_path=str(reference))
    # Retain the model's provenance watermark; no voice replacement fallback.
    soundfile.write(str(output), waveform.squeeze(0).detach().cpu().numpy(), model.sr, subtype='PCM_16')


def synthesize(job, model_dir, device='cpu', generator=None, *, content_requested=False):
    if content_requested is not True:
        raise StudioError('A voz pessoal exige pedido explícito de produção de conteúdo; não é a voz de conversa do Jarvis.')
    if device not in {'cpu', 'mps', 'cuda'}:
        raise StudioError('Dispositivo de síntese inválido.')
    model_dir, receipt = verify_model(model_dir)
    with locked_job(job) as (job, manifest):
        if manifest.get('purpose') != 'content_production':
            raise StudioError('A voz pessoal só pode ser usada em trabalhos de conteúdo identificados; nunca no diálogo do Jarvis.')
        if 'narration' in manifest['assets']:
            raise StudioError('Narração já registrada; não será sobrescrita.')
        text = verified_asset(job, manifest['assets']['script']).read_text(encoding='utf-8')
        if not text.strip() or len(text) > 300:
            raise StudioError('Este ensaio de voz aceita até 300 caracteres; não corta o roteiro silenciosamente.')
        reference = verified_asset(job, manifest['assets']['reference'])
        with tempfile.TemporaryDirectory(prefix='.voice-', dir=job) as tmp:
            output = Path(tmp) / 'narration.wav'
            (generator or generate_local)(text, reference, model_dir, device, output, receipt)
            info = probe(output)
            if not has_stream(info, 'audio') or duration(info) > 60:
                raise StudioError('A síntese não produziu áudio válido de até um minuto.')
            target = job / ('narration-' + str(uuid.uuid4()) + '.wav')
            output.rename(target)
        manifest['assets']['narration'] = asset(target)
        manifest['narration'] = {'origin': 'chatterbox_multilingual_v3', 'language': 'pt',
                                 'usage': 'explicitly_requested_content_only',
                                 'human_review': 'pending',
                                 'device': device, 'model': receipt,
                                 'script_match': 'not_verified', 'voice_identity': 'not_verified'}
        manifest['stage'] = 'narration_ready'
        save_manifest(job, manifest)
        return target


def main():
    parser = argparse.ArgumentParser(description='Ensaio local da voz própria em português')
    parser.add_argument('--job', required=True)
    parser.add_argument('--model-dir', required=True)
    parser.add_argument('--device', choices=['cpu', 'mps', 'cuda'], default='cpu')
    parser.add_argument('--content-requested', action='store_true',
                        help='O operador confirma que houve pedido explícito de conteúdo com voz pessoal.')
    args = parser.parse_args()
    try:
        result = synthesize(args.job, args.model_dir, args.device, content_requested=args.content_requested)
        print(json.dumps({'narration': str(result), 'voice_identity': 'not_verified'}))
    except (StudioError, OSError, ValueError, ImportError) as exc:
        print(json.dumps({'ok': False, 'error': str(exc)}, ensure_ascii=False), file=sys.stderr)
        return 1
    return 0


if __name__ == '__main__':
    raise SystemExit(main())
