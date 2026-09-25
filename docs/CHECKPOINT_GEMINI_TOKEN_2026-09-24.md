> **Atualização 25/09:** token 200 no deployment `dpl_FDZd51PrfQpryMfBczF6UcKEgiQT` (`86fa594`) e áudio no iPhone confirmados por Sol. A falha de token está superada nessa Preview. Permanência/interrupção agora em correção no [checkpoint seguinte da voz](CHECKPOINT_VOZ_CONTINUA_2026-09-25.md); não confundir com promoção de produção.

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

## Prévia confirmada em 24/09, 18:39 UTC

- Commit do candidato completo: `dfa78d93f0d642529daa189d29295c0e488e00bf`.
- Deployment `dpl_GfbbVNDDVhSUH9FHUp329VSewKAF`: READY, alias desta branch, target Preview.
- Navegador abriu a tela “Entrar no Jarvis” com versão visível `dfa78d9`: a exceção de redirect executa o candidato correto.
- Comparação da árvore remota: 312 arquivos anteriores idênticos por SHA, 7 modificados, 8 adicionados, zero exclusões. Documentação canônica anterior mantida integralmente por anexação no início. Main revalidada em `50d9d8c`.
- Health da Preview não foi confirmado: o conector retornou redirecionamento SSO; a navegação direta ao JSON foi bloqueada pelo cliente de navegador. A chave presente foi confirmada em produção, não extrapolada para Preview.
- Links temporários da Vercel devem ser gerados para o deployment corrente e abertos exatamente como emitidos. Sem registrar o parâmetro de acesso no GitHub.
- **Dependência humana atual:** Sol abrir a Preview privada no iPhone, entrar com sua conta e iniciar Gemini Live. Sem essa sessão legítima/permissão física não é possível comprovar áudio nesta execução. Se houver erro, usar os novos logs sanitizados do deployment para prosseguir; não pedir segredo pelo chat.

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

## Retomada após configuração da chave — 24/09/2026

- Teste de Sol às 18:44:10 UTC na Preview `dpl_JANg3w1mHLhmGR9vuq9DuH7FGX1D`: POST do token respondeu 503. A captura de tela informa ausência de GEMINI_API_KEY. Não foi o 400 do Google: a chamada ao provedor não ocorreu nessa tentativa.
- Produção foi reconsultada e manteve `apiKeyPresent: true`; nenhuma chave foi apagada nesta execução. A prévia antiga não havia recebido a variável.
- Sol informou ter atualizado a configuração e feito deploy. O novo deployment observado, `dpl_DWnxbozvmn2aj2uZpvBVs6x5LV84`, está READY em **production**, commit `50d9d8c`; não contém o patch da PR #18. A chave segue presente no health da produção.
- O alias da Preview ainda apontava para `dpl_JANg3w1mHLhmGR9vuq9DuH7FGX1D` / `690687e`, anterior à atualização. Esta revisão documental dispara nova Preview com o código já testado para receber o ambiente atual. Não há troca de modelo, merge, promoção de produção ou alteração de Auth/dados.
- Conferir a presença da chave no novo runtime; depois provar emissão real e conversa. Configuração informada por Sol ainda não equivale a chave carregada/aceita pelo Google.

## Acesso e ajuste de ambiente — 25/09/2026

- Após login legítimo concluído por Sol, o painel Vercel confirmou `GEMINI_API_KEY` como Secret, apenas Production. A Preview `30358c5` estava READY mas seu health retornou `apiKeyPresent: false`.
- Ajustado o escopo da variável existente para **Production e Preview**, mantendo Development desligado. A interface confirmou o estado salvo. Não lido, copiado, revelado, rotacionado ou substituído o valor da chave; não alteradas outras variáveis.
- Este commit somente documental reconstrói a Preview com o ambiente atualizado. Main segue `50d9d8c`; não há promoção ou mudança de código desde os 271 testes registrados.
- Próxima prova: health da nova Preview com chave presente; token real deve ser testado por sessão legítima do Jarvis. Presença da chave não prova validade, cota, WebSocket ou áudio.
