# Checkpoint 1 — voz contínua e estado real do ecossistema

25/09/2026. Continuação do [token Gemini](CHECKPOINT_GEMINI_TOKEN_2026-09-24.md), [mandato operacional](MANDATO_OPERACIONAL_JARVIS_2026-09-24.md) e [requisito hands-free](REQUISITO_HANDSFREE_VOZ_IDENTIDADE_2026-09-23.md). Histórico e módulos anteriores preservados.

## FUNCIONANDO — com limite de evidência

- Sol confirmou conversa real com áudio no iPhone: “Deu certo”. Captura enviada mostra sessão 01:11, transcrição e resposta. Não prova identidade biométrica nem interrupção.
- Vercel: `POST /api/jarvis-gemini-live-token` **200**, 25/09 às 00:07:31 UTC, deployment `dpl_FDZd51PrfQpryMfBczF6UcKEgiQT`, commit `86fa594922208b47d2429f03e07e3a83d4f0d392`.
- Log sanitizado: `[JARVIS_GEMINI_LIVE_SAFE] {"stage":"mint_ephemeral_token","ok":true,"model":"gemini-3.8-live"}`. Nenhum segredo/transcrição no log.
- Prova da **Preview privada da PR #18**; não certifica main/produção. Main conferido: `50d9d8c0cf47ec954c1d87ad9336a541e5347da8`.
- Supabase consultado sem escrita: **101 documentos `imported_unverified`, 643 chunks**. Documentos por projeto: fuga-identitaria 29, geral 17, morte-em-vida 31, reposicione-se 24. Não são fatos automaticamente verificados.
- GitHub registrado como `github_oidc`, leitura `canonical_markdown`, `write:false`, sync habilitado; último sync registrado 14/09/2026 18:06:44 UTC. Não equivale a editar todos os repositórios.
- Drive e Vercel registrados como `bridge` via conectores desta conversa, sem sync. Zero credenciais próprias de conectores armazenadas. Acesso do assistente de desenvolvimento não vira automaticamente ferramenta do Jarvis.

## Diagnóstico e delta preservativo

O corte de 180.000 ms era proteção de inatividade explícita no cliente web. Não foi atribuído a iPhone, login, microfone ou Supabase. Faltavam tratamento de `interrupted`, retomada e GoAway.

1. Opção Gemini **Manter conversa aberta**, desmarcada por padrão, sem consentimento persistido. Escolhida, remove somente o encerramento por três minutos de silêncio. Mantém modo automático anterior, OpenAI e modelo principal.
2. Interrupção do servidor para áudio agendado e limpa a fila; próximo turno continua na sessão.
3. Modo contínuo solicita compressão e retomada oficiais. Usa somente handle declarado retomável pelo Google, nova autorização do servidor e o mesmo modelo/voz. Não persiste tokens/handles, não reproduz transcrições nem inventa nova sessão sem contexto.
4. Máximo de três reconexões rápidas, espaçadas por 500 ms; um minuto saudável renova esse limite. Negativa de política/credencial ou handle inválido encerra. Sem troca de provedor.
5. Silenciar envia fim de stream, desativa tracks e mantém mute durante retomada. Encerrar aborta token/delegações, timers, áudio/socket; tracks de uma permissão concedida tarde são encerrados.
6. Abertura limitada a 30 segundos; callbacks atrasados não reativam a tela. Reinício após fim do provedor funciona no contrato. Mudança de conta/privacidade e saída da tela encerram.
7. Solicita Screen Wake Lock quando disponível, sem afirmar sucesso antes da confirmação do navegador. Isso não autoriza áudio em background.
8. Ferramentas canceladas em execução/fila não devolvem contexto antigo. Transcrição é locutor não verificado inclusive no contexto temporário da ferramenta.

## PROVA

- Baseline: **271/271** testes existentes. Restauradas dependências com `npm ci` do lock após desaparecimento do diretório temporário do node_modules anterior; nenhum pacote/lock atualizado.
- Testes novos falharam no cliente anterior. Depois: **283/283**, TypeScript, build Vite, auditoria de ambiente e **10/10** verificações de segurança aprovados.
- Cobertura nova: pausa acima de três minutos, proteção antiga, fila/interrupção, cancelamento de token e microfone tardio, mute, timeout, cancelamento de ferramentas, retomada/credencial nova/modelo/voz/mute preservados, política/handle inválido, stop durante retomada e limite de tentativas.
- Transporte/áudio/conta dos testes são **sintéticos**, não prova física ou Google real.
- Fixture visual isolada `tests/browser/live-voice.*` compilou. Navegador remoto bloqueou servidor local (`ERR_BLOCKED_BY_CLIENT`): novo fluxo visual por clique não certificado. Fixture não integra produção nem substitui login real.
- Logs em `evidencias/voz-continua-2026-09-25/`.

## IMPLEMENTADO MAS NÃO PROVADO

Conversa contínua, interrupção e retomada aguardam Google + iPhone reais no novo candidato. O 200 anterior não certifica os novos campos de setup. Rede, quota e disponibilidade continuam necessárias. Não prometer escuta ilimitada.

Permanecer no checkpoint 1 até abrir → falar → ouvir → interromper → continuar, inclusive após pausa superior a três minutos e renovação. Não implantar outros checkpoints em paralelo como se esse aceite já existisse.

## Pedidos adicionais preservados e auditados

| Pedido | Existente | Falta |
|---|---|---|
| Personalidade/meta-agentes | Persona, perfil de presença, 11 facetas históricas, 13 Core Skills, 16 Skill Packs e roteamento | Executores reais para cada função; registry não é agente autônomo ativo |
| Conhecimento/projetos pela voz | `consult_jarvis` → chat autenticado, biblioteca e memória com escopo | Provar recuperação real por voz; GitHub operacional com permissões limitadas |
| Reconhecer proprietária | NativeSpeakerIdentity com FluidAudio/CoreML e embedding em Keychain | Cadastro/limiares/prova proprietário/convidado/ambiente no iPhone; transcrição não identifica |
| Instalar/ativar à distância | ios/JarvisNative, App Intents/atalhos, Gemini nativo e Keychain | Xcode, instalação, permissões e teste físico; preservar cliente existente |
| Ambiente/permanência | Modos anteriores de ambiente; nova continuidade web em primeiro plano | Consentimento temporário, terceiros, bateria/custo e retomada nativa após suspensão |
| Câmera/live no MESMO iPhone | Requisito prévio, câmera/quadros web, configuração nativa de background | Captura/mixagem permitida pelo app da transmissão e prova real; não presumir injeção de áudio em outro app |
| Privado/copiloto/público | Isolamento privado/público | Participação audível na live só após autorização explícita; nunca mudar sozinho para público |
| Comandar/treinar LÚCIDA | Núcleo no Magnetus3 e ponte editorial em PRs | Gateway versionado ativo, escopos, teste e rollback; não compartilhar toda memória pessoal |
| Desenvolver-se por conversa | Engenharia/roteamento, tarefas editoriais duráveis parciais | Executor branch → testes → preview → aprovação → integração → monitoramento/rollback ligado ao chat |
| n8n no computador | Integração prevista na UI; instalação relatada por Sol | Nenhuma conexão n8n verificada; canal autenticado limitado sem expor editor local; não criar outro cérebro |
| Apoio com pouco atrito | Perfil pessoal e vida_diaria | Poucas ações, linguagem simples, continuidade sem bronca por repetição; preservar pedidos completos |
| Redes/audiência/conteúdo/CRM/campanhas | Contratos e integrações parciais anteriores | APIs/OAuth e dados reais; sem publicação, envio ou gasto automático sem autorização |
| Multiusuário | Core/Profile Packs, RLS e contratos tenant/workspace | Expandir sem universalizar Sol nem cruzar dados de proprietários |

## LÚCIDA localizada no GitHub

`Sollimastudio/Magnetus3`, main `8e737a65f9b47bf2d8f621d101283129c61b028d`: `app/api/lucida/route.ts`, `lib/server/lucida.ts`, política/UI, migração `002_lucida.sql`, corpus e testes. Há recuperação com integridade/proveniência, contexto escolhido da jornada, memória consentida, provedor configurável e limites. **Não criar do zero.**

A decisão `docs/00-governanca/DECISAO-LUCIDA-CROSSPRODUCT-2026-09-16.md` define núcleo para vários produtos; isso não prova implantação em todos. A ponte de episódios, Magnetus3 PR #2, segue **aberta/não integrada**: head `673a96f0d6da004237560a940d149101ea6b59e3`, base `7bff435d8f451db7053c9850eb2099b4b9b76498`. Preservar também a frente editorial separada. Ler [entrega anterior](ENTREGA_REFERENCIAS_LUCIDA_2026-09-21.md).

## QUEBRADO / pendências concretas

- Main/produção ainda não receberam PR #18. Nenhum merge/promoção desta rodada.
- Web encerra ao ocultar a tela; não resolve outro app de live simultâneo. Background/mixagem nativa não comprova transmissão da voz por outro app.
- Auditoria de NativeGeminiLive: `contains("autorizo")` vem antes das negativas `nao autorizo`/`não autorizo`. Negativa pode autorizar conversa genérica indevidamente. **Bloquear homologação até correção/teste no checkpoint nativo.** Cofre do convidado é controle separado; testes estruturais não certificam segurança física.
- GitHub Actions anterior falhou sem steps/runner. Testes locais/build Vercel não o tornam aprovado.

## PRÓXIMO CHECKPOINT / ação humana

Primeiro provar a nova voz: Sol abre a Preview correta no iPhone, marca **Manter conversa aberta**, conversa, fica quatro minutos sem falar, volta a falar e interrompe uma resposta. Conferir Silenciar/Encerrar. Renovação requer conversa acima de dez minutos e logs do mesmo deployment.

Depois, checkpoint 2: concluir cliente nativo existente, corrigir negativa de convidado e preparar instalação assistida; checkpoint 3 prova identidade. OAuth, microfone, instalação e aprovação de produção são ações humanas no gate correspondente. Nunca pedir chave/código no chat.

## DECISÕES CONGELADAS / NÃO REGREDIR

PROPRIETÁRIO → JARVIS → LÚCIDA → CLIENTE. Preservar → agregar → testar → comparar → só então substituir. Preservar facetas, persona, Core/Profile Packs, memória, corpus, integrações, iOS e documentos completos. Voz é sinal local complementar, não login; não aprender de locutor não verificado. n8n executa, Jarvis coordena, Supabase guarda. Sem autoedição cega de produção.

Rollback: reverter apenas o delta desta rodada, mantendo a correção de token comprovada do `86fa594`. Sem force push/reset, exclusão de dados, migração remota, troca de chave ou modelo.

## Fontes oficiais consultadas

- https://ai.google.dev/gemini-api/docs/live-api/session-management — compressão, duração, retomada e GoAway.
- https://ai.google.dev/api/live — interrupted, audioStreamEnd, toolCallCancellation, sessionResumptionUpdate e setup.
- https://webkit.org/blog/13966/webkit-features-in-safari-16-4/ — Screen Wake Lock, condicionado ao navegador/aparelho.

APIs sustentam a implementação, não substituem prova real.

## Instrução posterior de Sol nesta sessão

Antes de testar a voz, Sol pediu explicitamente conectar Jarvis à LÚCIDA existente no Magnetus3. Essa ordem posterior autoriza preparar a integração agora, mantendo a voz como aguardando prova, sem apagá-la nem declarar seu checkpoint concluído. A conexão real precisa distinguir runtime disponível, identidade/autorização, conhecimento e treinamento versionado. Não substituir a LÚCIDA existente.
