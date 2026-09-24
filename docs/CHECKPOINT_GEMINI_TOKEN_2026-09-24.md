# Checkpoint 1 — Gemini Live: correção REST, prova real pendente

24/09/2026. Continuação do Jarvis existente.

## Estado recuperado e preservado

- GitHub main: `50d9d8c0cf47ec954c1d87ad9336a541e5347da8`; árvore `136369db9580bd110b107ca0e312ed66ce825cef`. Todos os 319 blobs conferidos por SHA antes de editar.
- Produção Vercel: `dpl_9pVAdujwTH1rNui8dLjivz735unk`, READY, mesmo SHA. Health 200, Gemini 3.8 Live/chave presente, OpenAI sem chave. Presença não prova validade/cota.
- Oito POSTs 502 entre 17:41:25 e 17:44:15 UTC: `mint_ephemeral_token`, Google 400. O código anterior não registrou detalhes da rejeição.
- Supabase `rkkpbmzrucaghrojujvb`: ACTIVE_HEALTHY; 25 tabelas públicas com RLS habilitada; contadores retornados: 23 memórias, 102 documentos, 643 trechos, 23 eventos, 13 respostas. Nenhum conteúdo privado lido para diagnosticar voz; nenhuma alteração em dados/Auth/RLS/migrações.
- Inventariados branches, 100 commits recentes, PRs, migrações e funções. PRs #8/#10/#11 e histórico preservados; main já contém alterações posteriores.
- Há trabalho local adicional em `SOL-IA-reference-implementation`, HEAD `42ebd0b0936669cf89c1cda46215130e96f465bf`, com alterações editoriais não publicadas. Preservado, sem importar sobre main. Esta cópia foi recuperada por blobs; seu commit local é um snapshot. Publicação usa o pai remoto verdadeiro e apenas o delta, sem substituir a história remota.

## Delta

Branch `work/fix-gemini-live-token-20260924`; PR https://github.com/Sollimastudio/SOL-IA/pull/18.
Primeiro commit: `e4b91371e5db94371c3a47d2b2412d32b9414647`.

`fetch` enviava `liveConnectConstraints.config`, objeto de conveniência do SDK. Referência REST AuthToken e conversor oficial do SDK usam `bidiGenerateContentSetup.generationConfig`. Corrigido esse contrato. O guia oficial de tokens contém exemplo REST divergente; a correção segue a referência e o conversor, sem fingir que o detalhe do 400 histórico foi recuperado.

`fieldMask: model,generationConfig.responseModalities` mantém modelo/AUDIO bloqueados, preservando voz escolhida, instruções, transcrição e `consult_jarvis` dos clientes. Sem essa máscara, o setup parcial substituiria todo o setup cliente. Mantidos v1beta, modelo, uma utilização, abertura em 60 segundos e validade de 30 minutos.

Logs contêm apenas status HTTP, código conhecido, causa classificada e nomes conhecidos de campos. Não há texto bruto/metadata/chave/JWT/token/conteúdo privado. `API_KEY_INVALID` com 400 é distinguido de payload inválido. Sem retry ou fallback de modelo.

### Prévia redirecionada para versão antiga

A primeira Preview, `dpl_CXyoZ5ZDsevHo9ksnxu3M9xZwdhv`, ficou READY, mas respondeu 307 para a antiga branch `work/jarvis-neural...`, por regra de `vercel.json`. Adicionada exceção apenas para o alias desta homologação:
`sol-ia-i5wy-git-work-fix-gemini-live-782643-sol-limas-projects.vercel.app`.

Demais redirects, produção e cabeçalhos preservados. Proteção Vercel e login Jarvis não foram desabilitados. Usar o alias da branch: o hostname único do deployment ainda segue a regra legada. Não versionar link temporário de acesso.

## FUNCIONANDO — prova desta rodada

- Baseline 263/263 testes Node.
- Contrato REST novo falhou no original e passou no patch.
- Teste da Preview falhou antes da exceção de host e passou depois.
- 271/271 testes Node após o delta completo; TypeScript, build Vite, auditoria de ambiente e 10 verificações de segurança aprovados localmente.
- Logs completos em `evidencias/gemini-token-2026-09-24/`.

## IMPLEMENTADO MAS NÃO PROVADO

- Correção REST e diagnóstico seguro: validados localmente; emissão real ainda pendente.
- Fluxo token → WebSocket → microfone → fala compreendida → áudio → interrupção → continuação → encerramento ainda não provado.
- iOS/NativeGeminiLive/NativeSpeakerIdentity/NativeSpeechStyle preservados. Testes Node de contrato não compilam Swift nem provam biometria.
- GitHub Actions do primeiro commit falhou; job `107773975451` sem steps e sem runner. Annotations recusadas pelo conector. Causa não determinada; não declarar CI aprovado. Vercel READY e testes locais são evidências distintas.

## QUEBRADO / ABERTO

- Produção permanece no baseline com falha 502; nenhuma promoção automática.
- Causa exata do 400 histórico não recuperável dos logs antigos. Incompatibilidade de contrato identificada; chave/cota/permissão precisam de resposta real.
- Navegador desta sessão chega à tela de login: falta sessão legítima do proprietário para teste. Não extrair tokens do banco, fabricar sessão ou remover autorização.
- Auditoria: clientes Gemini web/nativo não tratam `serverContent.interrupted` nem retomada por `sessionResumption`. Não certificar interrupção/reconexão; corrigir no checkpoint 1 após provar emissão do token.
- Nativo: revisar ordem de autorização de convidado, pois `nao autorizo` contém `autorizo`; revisar validade temporal de identidade e isolamento por proprietário antes da homologação. Não certificar convidados/aprendizado com testes textuais.

## PRÓXIMO CHECKPOINT

Continuar o **checkpoint 1**, sem pular para iOS:
1. Conferir SHA/health na Preview correta e disponibilidade da credencial sem exibi-la.
2. Login legítimo e um teste controlado de INICIAR VOZ NATURAL. Se falhar, ler logs sanitizados e corrigir o mesmo checkpoint.
3. Provar WebSocket/áudio e corrigir/testar interrupção/cancelamento no cliente existente antes do aceite ponta a ponta.
4. Registrar prova e solicitar autorização para promoção conforme o mandato; reexecutar gates antes de merge.
5. Só então seguir `MANDATO_OPERACIONAL_JARVIS_2026-09-24.md`.

## DECISÕES CONGELADAS / NÃO REGREDIR

- PROPRIETÁRIO → JARVIS → LÚCIDA → CLIENTE; memória privada não é compartilhada indiscriminadamente.
- Um Jarvis canônico. Preservar → agregar → testar → comparar → só então substituir.
- Não mudar modelo, iOS, Supabase/Auth nem sobrescrever trabalho local para resolver token.
- Não confundir simulação, botão, build ou READY com voz funcional.
- Rollback: produção/main preservados em `50d9d8c`. Futuro merge permite revert apenas deste delta; sem reset/force-push/exclusões.

## Fontes oficiais

- https://ai.google.dev/api/live
- https://ai.google.dev/api/generate-content
- https://ai.google.dev/gemini-api/docs/live-api/ephemeral-tokens
- https://github.com/googleapis/js-genai/blob/main/src/tokens.ts
- https://github.com/googleapis/js-genai/blob/main/src/converters/_tokens_converters.ts
- https://vercel.com/docs/project-configuration/vercel-json
