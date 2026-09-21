# Continuação: transcrição local, Telegram e origem das pautas

## Base e preservação

Continuação da entrega anterior, na PR [SOL-IA #11](https://github.com/Sollimastudio/SOL-IA/pull/11) e na contraparte [Magnetus3 #2](https://github.com/Sollimastudio/Magnetus3/pull/2). Não substitui o relatório anterior nem o prompt E1–E7.

HEADs conferidos antes das alterações:

| Referência | SHA |
|---|---|
| SOL-IA, auditoria/PR #8 | `f75f63988dbdc461af08067a4be55a0f9e828e89` |
| SOL-IA, implementação/PR #11 | `fc1cfa42ea4b9fcec922aeb7bd36586ecfea758b` |
| Magnetus3, implementação/PR #2 | `432d8e104b2e8a3199cd5da11faea990b11c0ab1` |
| Universo, main atual | `160b699f8a5cba29fa987ab4f46c984a24b1ff89` |
| Bíblia, main | `41d76ecea724da07f0e05669157e2f436383c257` |
| Trilogia, main | `e628b76658ef3ecf38815bb7bdc935181b1ac3c2` |

O avanço do Universo registra a revisão C1 de outro aplicativo e conserva MM01–MM17. Não é autorização para trocar este projeto pelo aplicativo Sites. Os destinos comerciais registrados continuam distintos da comprovação de preço, disponibilidade, acesso ou venda. A PR #10 de voz/custos permanece separada. O Mac da Sol não foi inspecionado.

Os registries de multifacetas, Core Skills, Skill Packs e perfis não foram substituídos. Sol dirige Jarvis; os papéis editoriais continuam coordenados pelo fluxo existente. Nenhuma alegação de agentes especialistas autônomos foi acrescentada.

## Código e prova nova

- **E1:** leitura de uma faixa pública de legendas exposta pelo player do YouTube, como JSON, sem executar JavaScript/cookies ou contornar login. URLs de faixas conservam assinatura e caminho. Metadados continuam sem valer como transcrição.
- **E1:** `local_studio/transcription.py` e `server/media-worker.mjs` executam reconhecimento CPU local, com pesos fixados/verificados, VTT, intervalos, hash da mídia e revisão obrigatória. O worker aceita mídia direta por HTTPS público validado ou bytes encaminhados pelo servidor autenticado. Limites: 12 MB, 180 segundos, uma operação simultânea, 35 segundos de processamento. Não corta áudio longo para apresentá-lo como completo.
- **E4:** Magnetus3 baixa o arquivo via `getFile` somente depois da autorização específica para transcrever. Encaminha bytes ao worker, sem encaminhar token do bot ou identificação da cliente. O resultado fica na fila de revisão e só entra na memória pelo mecanismo consentido já existente.
- **E4/MM16:** migração aditiva `006_telegram_transcription.sql`, lease de 90 segundos, até três tentativas, revisão/isolamento por conta. Não há transação de banco aberta durante download/inferência. Edição, exclusão, desconexão, expiração ou substituição do lease impedem um resultado antigo de reaparecer.
- **E7/MM07/MM16:** uma pauta derivada cria outra tarefa com `parentId`, revisão do pai, `rootId` e digest da referência. Preserva o trabalho anterior e identifica o novo texto como hipótese editorial, não como evidência adicional do vídeo. O cliente conserva o identificador para conferir um envio sem confirmação.

Fontes técnicas: [faster-whisper](https://github.com/SYSTRAN/faster-whisper), [pesos fixados](https://huggingface.co/Systran/faster-whisper-tiny/tree/d90ca5fe260221311c53c58e660288d3deb8d356), [Telegram getFile](https://core.telegram.org/bots/api#getfile). Implementação e limites locais estão em [ASR_LOCAL_OPERACAO.md](ASR_LOCAL_OPERACAO.md).

## Evidências e alcance

Em `evidencias/transcricao-2026-09-21/`:

- `real-asr.json`: áudio novo gerado com FFmpeg/flite, 6,75 segundos, reconhecido pelo modelo real via HTTP local autenticado. O texto contém as frases esperadas e os intervalos estão dentro da duração. Um arquivo silencioso retorna `no_speech_detected`, sem texto. Não é voz da Sol nem áudio do vídeo solicitado; a prova controlada está em inglês.
- `jarvis-build.log`: 238 testes Node e compilação TypeScript/Vite aprovados. Incluem os 234 anteriores, acesso ao worker, integridade/consentimento, legendas públicas e preservação da raiz das pautas.
- `studio-regression.log` e `transcription-boundaries.log`: 25 testes anteriores do estúdio e quatro novos. Playlist não abre fonte adicional, excesso de duração é recusado antes do modelo, vídeo sem áudio não vira transcrição e pesos incompletos são recusados.
- Na contraparte Magnetus3: 25 testes unitários e 25 de integração HTTP/banco. Há três casos novos de transcrição, concorrência/exclusão e retomada/limite. O HTTP Telegram/ASR nesses testes é **controlado**, com dados sintéticos; a inferência real é a prova separada acima. O teste anterior de Telegram teve um timestamp sintético anterior ao vínculo corrigido; não foi relaxada a janela de consentimento do produto.

As telas foram compiladas e revisadas quanto a estados de espera, confirmação, revisão desatualizada, limite de texto e exclusão. Não há nova prova visual de navegador/iPhone. A limitação de navegador da entrega anterior continua aberta. Os checks remotos também precisam ser conferidos no HEAD final; testes locais não os substituem.

## MM01–MM17: situação após esta continuação

| ID | Estado verificável e pendência |
|---|---|
| MM01 | Hierarquia preservada; coordenação por código/prompt, sem novos executores autônomos de especialistas. |
| MM02 | Oportunidade e prioridade persistidas; composição com catálogo vigente e métricas reais ainda parcial. |
| MM03 | Link dispara aquisição; leitura de legendas e mídia direta implementadas. Acesso remoto depende da fonte e da conexão configurada. |
| MM04 | ASR real de áudio curto comprovado localmente. Compreensão visual, áudio longo e avaliação em português real pendentes. |
| MM05 | Letras fornecidas têm controle de cópia; canal exige amostra nomeada no contrato. Coleta executora de amostra do canal permanece pendente. |
| MM06 | Gerador de nove roteiros, validação e retomada testados com provedor sintético. Qualidade dos nove roteiros reais e aprovação da Sol não comprovadas. |
| MM07 | Encadeamento de episódios e raiz/pai das novas pautas implementados; expansão não publica conteúdo sozinha. |
| MM08 | Acesso adquirido respeitado no runtime; catálogo de geração continua vazio até integração verificada. Sem preços ou receitas inventadas. |
| MM09 | Brief e revisão autoral preservados; contexto da biblioteca ainda é identificado como não verificado. |
| MM10 | Ponte assinada e recuperação dos nove episódios/versões testadas. Gravação final e publicação real não comprovadas. |
| MM11 | Texto e transcrição revisada por episódio/pergunta implementados. Bot e processador real ainda precisam ser conectados ao ambiente autorizado. |
| MM12 | Relatório agregado existente preservado/testado; classificação semântica livre das queixas ainda parcial. |
| MM13 | Memória consentida e sinais elegíveis preservados; sem retreinamento automático de pesos. |
| MM14 | Mapa autorizado, seleção, compartilhamento e revogação preservados/testados. |
| MM15 | Corpus autoral separado da memória individual. Consolidação do perfil aprovado de Sol no planejamento permanece parcial. |
| MM16 | Checkpoints anteriores mais lease da transcrição e raiz das pautas. ASR pode repetir computação local após queda; não se promete execução exatamente uma vez. |
| MM17 | Auditoria/delta documentados; facetas e documentos históricos preservados. |

## Dependências externas e próxima execução

O vídeo `okmV674zkd4` continua **não lido**. A tentativa externa não retornou seu conteúdo; não há evidência de que ele exija assinatura. Não foram produzidos roteiros atribuídos a esse vídeo.

Não foram configurados bot real, hospedagem HTTPS do worker, segredos, migração remota, provedor editorial ou publicação. Usar o modelo local não contrata uma API; também não torna hospedagem e operação gratuitas. Não houve novo gasto de API, envio a clientes, publicação no Telegram ou implantação em produção.

Próximo trabalho: seguir [PROMPT_CONTINUACAO_ASR_REFERENCIAS.md](PROMPT_CONTINUACAO_ASR_REFERENCIAS.md), começando pela prova integrada em ambiente de teste autorizado, cobertura visual/amostra de canal e contexto autoral/catálogo. E1–E7 permanecem **parciais**, com implementações executáveis e limites discriminados; não estão integralmente homologadas.
