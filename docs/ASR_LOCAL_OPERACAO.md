# Operação do processador local de transcrição

Procedimento de desenvolvimento/infraestrutura, não tarefa para Sol executar. Serviço separado do chat e da clonagem de voz. Não modifica o estúdio histórico nem passa a usar a voz pessoal como assistente.

## Preparação explícita

Python 3.11+, FFmpeg/ffprobe e Node 22+. O ensaio foi Linux x86_64/Python 3.12/CPU; não certifica macOS. Instalar dependências em ambiente virtual isolado com `local_studio/requirements-transcription.txt`. `environment-transcription-linux-cpu.txt` registra as versões do ensaio, não um lock universal de hashes.

```bash
python -m local_studio.install_transcription_model --destination /caminho/privado/pesos-asr
```

Download explícito de aproximadamente 78 MB da revisão fixada no `transcription-model-lock.json`. Reutiliza arquivos íntegros após interrupção e recusa divergência; arquivos incompletos não valem como instalação concluída. Não recebe nem transmite gravações. A inferência só abre pesos locais, verifica hashes e bloqueia conexões Python. Esse bloqueio não é sandbox de sistema operacional para extensões nativas hostis.

```bash
python -m local_studio.transcription --source /caminho/audio-autorizado.m4a --model-dir /caminho/privado/pesos-asr
```

Aceita contêineres limitados de áudio/vídeo: WAV, OGG, MP3, MP4/MOV, Matroska/WebM, FLAC e AAC. Recusa playlists, streams remotos dentro do decodificador, ausência de áudio, arquivo maior que 12 MB ou duração acima de 180 segundos. O resultado tem VTT, texto, intervalos, duração, hash e modelo. `reviewRequired=true` não certifica a fidelidade das palavras. Não há OCR, leitura de gesto/cena ou análise de canal inteiro nesta versão.

## Conexão aos servidores

No processo separado do worker, configurar `JARVIS_MEDIA_PYTHON`, `JARVIS_MEDIA_MODEL_DIR`, `JARVIS_MEDIA_WORK_DIR`, `JARVIS_MEDIA_ADAPTER_TOKEN` e `LUCIDA_TRANSCRIPTION_TOKEN`; usar dois segredos distintos com pelo menos 32 caracteres. Nunca prefixar segredos com `VITE_` nem guardá-los no Git.

```bash
node server/media-worker.mjs
```

Escuta somente `127.0.0.1:8793` por padrão; `JARVIS_MEDIA_PORT` altera a porta. Um proxy HTTPS autenticado, com limite de corpo de 16,1 MB e prazo suficiente, é uma dependência de infraestrutura, **não foi provisionado** nesta entrega. O servidor web precisa alcançar esse proxy: localhost do computador do operador não é localhost da Vercel.

| Chamador | Destino/configuração |
|---|---|
| Jarvis | `JARVIS_MEDIA_ADAPTER_URL=https://HOST/reference`, token correspondente. POST de URL pública, tipo, limite e `allowPaid=false`. |
| Lúcida | `LUCIDA_TRANSCRIPTION_URL=https://HOST/transcribe`, token próprio. POST de bytes/base64, hash, limite e consentimento explícito. |
| Telegram no Magnetus3 | `LUCIDA_TELEGRAM_TRANSCRIPTION_ENABLED=true`, `LUCIDA_TELEGRAM_BOT_TOKEN`, além do vínculo/webhook/episódios já configurados. Migração 006 em banco de teste primeiro. |

Nenhuma rota aceita caminho local fornecido pelo cliente. O worker de referências não aceita credencial para a fonte; valida/pina o DNS e limita redirecionamentos pelo adquiridor existente. Somente áudio/vídeo direto é reconhecido. Página do YouTube é tratada antes pela tentativa de legenda pública, não é baixada por contorno de acesso.

O worker limita a uma operação, mata o reconhecimento após 35 segundos e não grava transcrições em log/cache. Arquivos de entrada e PCM ficam na pasta privada da operação, removida ao concluir. Diretórios abandonados por queda do processo são limpos na próxima operação depois de uma hora. Operação hospedada deve usar volume privado efêmero e monitorar `media_cleanup_failed`; permissões Unix não equivalem a criptografia. O modelo e as amostras não devem entrar no Git.

No Magnetus3, a autorização para transcrever não ativa memória. O texto fica até o vencimento da resposta temporária, com revisão antes de continuar e consentimento separado para lembrar. Até três tentativas por versão do áudio; lease vencido pode ser retomado, sem consumir API de ASR paga. Alterar/apagar a resposta invalida o lease anterior. A API do Telegram não entrega a este bot todos os eventos de exclusão pelo usuário: usar a exclusão/desconexão no app conforme aviso existente.

## Prova reproduzível

Com os caminhos do Python e do modelo configurados:

```bash
node scripts/prove-local-transcription.mjs
python -m unittest discover -s tests/studio -p test_transcription.py -v
node --test tests/media-worker.test.mjs tests/reference-series.test.mjs
```

A primeira prova gera fala sintética original em inglês com `flite`, usa HTTP e ASR reais e verifica silêncio. Não usa bot real nem a voz pessoal. Testes de protocolos usam substitutos declarados. No Magnetus3, `npm run build`, `npm test` e `npm run test:integration` incluem migração, autenticidade, contas, revisão e recuperação com dados sintéticos. `LOCAL_E2E` e endpoints de teste só podem existir no ensaio local; nunca configurar em hospedagem real.
