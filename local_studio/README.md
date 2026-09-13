# Jarvis — primeiro processamento local de mídia

Parte do núcleo `Sollimastudio/SOL-IA`, não outro produto. É código de processamento local para quem desenvolve o Jarvis. Ainda não existe botão de avatar no iPhone nem serviço de geração exposto na internet.

## O que executa

- Recebe áudio local (inclusive M4A) ou vídeo com áudio e um roteiro UTF-8; opcionalmente guarda a ideia original separada.
- Extrai referência de voz mono/24 kHz e um retrato, sem modificar o vídeo original.
- Mantém trabalho com ID, arquivos privados, hashes e estado persistido atomicamente. Roteiro alterado exige nova versão; não renderiza texto diferente usando um áudio antigo silenciosamente.
- Aceita narração pronta com procedência explícita, ou usa o adaptador opcional Chatterbox Multilingual V3 em português.
- Exporta MP4 vertical 720×1280, H.264/AAC, com retrato estático e áudio. Confere duração e streams antes de marcar a prévia pronta.
- Não usa o áudio de referência como se fosse uma nova fala gerada. Não chama essa prévia de avatar animado. Não publica nas redes.

## Ambiente básico

Python 3.11+ e FFmpeg/ffprobe. A preparação e a montagem não precisam de PyTorch, chave API ou assinatura de voz.

```bash
python -m local_studio.studio doctor
python -m local_studio.studio prepare --source /caminho/video-proprio.mp4 --script /caminho/roteiro.txt --workspace /caminho/privado/trabalhos --seconds 10
python -m local_studio.studio status --job /caminho/privado/trabalhos/ID
```

Use pasta privada fora do repositório, em disco protegido. O diagnóstico descreve SOMENTE o computador em que foi executado. Não prova que o Mac da Sol consegue rodar o modelo. As permissões de arquivos não substituem criptografia, backup ou autenticação do aplicativo.

O roteiro não é gerado por este comando. Pode ser preparado no ChatGPT usado pela Sol, dentro de seu plano, e introduzido pelo operador. A automação de ideia → roteiro dentro do Jarvis permanece uma integração pendente; não copiar cookies ou sessões do ChatGPT para a Vercel.

### Narração já disponível

```bash
python -m local_studio.studio attach-audio --job /caminho/ID --audio /caminho/narracao.wav --kind recorded
python -m local_studio.studio render --job /caminho/ID
```

Procedências: `recorded`, `generated_external`, `synthetic_test`. São declarações do operador local, não verificação biométrica. O sistema não certifica que o áudio pronuncia o roteiro: `script_match=not_verified` e revisão humana pendente. O áudio é limitado a cinco minutos nesta etapa. Envio externo não é feito pelo programa.

### Adaptador de voz própria

Fonte de código examinada: [Chatterbox](https://github.com/resemble-ai/chatterbox/tree/5de7a54aa4e5e2baadb0182dde554908b48b85c2), arquivo `src/chatterbox/mtl_tts.py`. O adaptador utiliza `from_local(..., t3_model='v3')` e `generate(..., language_id='pt', audio_prompt_path=...)`.

`requirements-voice.txt` fixa a revisão principal do código. NÃO é lock completo do ambiente: dependências transitivas, pesos e compatibilidade de hardware ainda precisam ser conferidos e fixados antes da instalação no equipamento de Sol. Não instalar automaticamente durante build da aplicação.

O comando só carrega pesos já presentes no disco; não chama `from_pretrained` nem inicia download. O operador responsável deve obter os pesos de fonte oficial, revisar suas licenças, fixar uma revisão do modelo e criar `jarvis-model.json` na pasta de pesos:

```json
{
  "repository": "ResembleAI/chatterbox",
  "code_revision": "5de7a54aa4e5e2baadb0182dde554908b48b85c2",
  "weights_revision": "PREENCHER_COM_COMMIT_REAL_DE_40_HEXADECIMAIS",
  "license_source": "https://huggingface.co/ResembleAI/chatterbox/blob/REVISAO_REAL/LICENSE",
  "adapter_source_sha256": "SHA256_DO_MTL_TTS_PY_DA_REVISAO_REVISADA",
  "files": {
    "ve.pt": "SHA256_REAL",
    "s3gen.pt": "SHA256_REAL",
    "t3_mtl23ls_v3.safetensors": "SHA256_REAL",
    "grapheme_mtl_merged_expanded_v1.json": "SHA256_REAL"
  }
}
```

Este exemplo NÃO é um modelo instalado: valores de exemplo serão recusados. Se `conds.pt` ou `Cangjie5_TC.json` estiverem presentes, incluir os hashes também. Integridade confirma consistência com o manifesto do operador, não procedência independente ou aprovação automática de licença.

```bash
python -m local_studio.voice --job /caminho/ID --model-dir /caminho/pesos-verificados --device cpu
```

`mps` é opção para Mac compatível e `cuda` para NVIDIA compatível; não faz fallback silencioso. A geração inicial é limitada a 300 caracteres para não cortar roteiros silenciosamente. Divisão por frases, alinhamento, qualidade de pronúncia e concatenação longa ainda precisam ser desenvolvidos. Não remover a marca de procedência do modelo.

As flags offline e o bloqueio de sockets Python recusam downloads/chamadas de rede na síntese. Isso não é sandbox de sistema operacional para extensões nativas hostis; somente código e pesos revisados devem ser instalados. Não carregar código arbitrário indicado pelo conteúdo do roteiro.

## Persistência e recuperação

Cada etapa só avança depois de validar os arquivos produzidos. Falha não substitui narração pronta nem confirma vídeo inexistente. Repetir `render` de uma prévia íntegra retorna o mesmo arquivo. Um lock local evita trabalho concorrente; depois de interrupção abrupta, o operador deve confirmar que não existe processo ativo antes de remover `.working`. Restos de uma etapa interrompida não são interpretados como sucesso.

São arquivos locais, não sincronizados com Supabase nesta entrega. Não colocar amostras privadas, pesos ou resultados pessoais no GitHub. Não há senha/Face ID adicional neste worker, servidor HTTP, publicação ou integração móvel ativados.

## Verificação

```bash
python -m unittest discover -s tests/studio -v
```

Os testes usam vídeo de cor sólida e tom sintético, extraem mídia de verdade e geram/decodificam MP4 real. Verificam duração, áudio, dimensões, originais, alteração de roteiro, falha, repetição, lock e integridade de pesos. A parte de síntese usa substituto controlado para testar o contrato; não é prova de clonagem, semelhança, naturalidade ou animação.

Próxima prova de produto: referência autorizada da própria Sol + ambiente local verificado + primeira síntese real curta, seguida de escuta e comparação. Só depois incorporar sincronização labial e movimento. Falta também integrar o worker ao Jarvis com autenticação forte e armazenamento privado.

## Referência somente de voz e tratamento conservador

O mesmo `prepare` aceita áudio sem imagem. Nesse caso registra `input_mode=audio_only`; síntese pode usar a referência, mas `render` informa que falta imagem, sem inventar um retrato.

```bash
python -m local_studio.audio --source /caminho/gravacao.m4a --destination /caminho/privado/analise-nova
```

Esse comando mede duração, pico, RMS, amostras próximas ao limite digital e janelas de baixa energia. Propõe um trecho contínuo de dez segundos por uma heurística de energia. Não reconhece palavras, não detecta número de falantes/música, não estima relação sinal-ruído e não infere emoção ou estado clínico. Um tom sintético pode passar pela triagem: escuta continua necessária.

Produz uma referência sem redução de ruído (apenas conversão para WAV mono/24 kHz), uma cópia completa experimental com filtro de graves de 65 Hz e atenuação espectral leve de ruído, e um relatório JSON. A cópia tratada não substitui a referência do modelo nem o original. Não remove pausas, não muda velocidade/tom, não comprime automaticamente e não promete melhora perceptiva sem comparação auditiva. Arquivos totalmente silenciosos não recebem referência; ausência de trecho elegível é explícita.

Preserva o hash da origem, exige pasta nova e só disponibiliza o pacote após conferir durações. Até 30 minutos por entrada; sem API e sem treinamento de modelo. Antes de usar um trecho como identidade vocal, conferir fala limpa, uma pessoa falando, ausência de música e limites de frase. O JSON marca essas avaliações como pendentes.
