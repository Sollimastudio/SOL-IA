# Execução E1–E7 — referências, séries e continuidade da LÚCIDA

Registro adicional da execução solicitada em 21/09/2026. Não substitui o prompt, MM01–MM17, decisões anteriores ou gates de voz/login/iPhone. Esta entrega contém código e testes locais; não declara produção ativada nem aprovação editorial dos roteiros.

## Base preservada e escopo

- SOL-IA: `work/audit-jarvis-ecosystem-20260918`, HEAD `f75f63988dbdc461af08067a4be55a0f9e828e89`, PR #8 aberto, cuja base continua `work/jarvis-gpt-live-1-20260916`. Implementação em branch filha, sem promover a pilha para main.
- Magnetus3: `work/lucida-minutos-magnetus-documentacao-20260921`, HEAD `7bff435d8f451db7053c9850eb2099b4b9b76498`, PR #1 aberto; main conferida em `8e737a65f9b47bf2d8f621d101283129c61b028d`. A integração do runtime é outra branch filha desta documentação.
- Conferidos universo-relacione-se `7f96b48abe0b24c66aa556dfc5ebd88966e14636`, biblia-magnetus `41d76ecea724da07f0e05669157e2f436383c257`, trilogia-sol-lima `e628b76658ef3ecf38815bb7bdc935181b1ac3c2`. D016/D017 admitem avulsos e preservam o combo integrado; a classificação canal versus pack continua pendente.
- Snapshots dos arquivos usados foram conferidos contra os blobs Git. Ícones e corpus original foram preservados. O Mac e mudanças locais nele não foram inspecionados.
- Reutilizados piloto autenticado, orçamento, gateway, biblioteca autoral, UI do Jarvis, corpus da LÚCIDA, política de consentimento, memória, acesso por produto e Mapa Pré-Mentoria. Nenhuma faceta, pack ou função histórica foi removida.

## O que o código faz

**E1.** Colar um link com intenção de leitura/criação na conversa privada abre a série. `server/jarvis-references.mjs` registra a tarefa antes de adquirir conteúdo. `reference-acquisition.mjs` lê texto, HTML e legendas públicas VTT/SRT, resolve tracks de legenda, fixa DNS validado no socket e limita tamanho, tempo e redirecionamentos. Não envia credenciais ao site de referência. Texto fornecido, letra e amostra de canal têm contratos distintos. Um conector de mídia configurável pode devolver transcrição/amostra; seu executor não foi implementado nesta entrega.

O vídeo inicial `https://www.youtube.com/watch?v=okmV674zkd4` **não foi lido**. A tentativa de abertura não devolveu conteúdo, e a aquisição HTTPS direta neste ambiente registrou `EAI_AGAIN`; não há evidência de assinatura exigida. A legenda sintética dos testes é outra fonte, explicitamente identificada, e não corresponde ao vídeo. Ainda falta prova com mídia pública realmente adquirida, ASR e imagens/intervalos analisados.

O plano persistente separa evidência por segmento, síntese, oportunidade, prioridade, hipótese comercial, incertezas e novas pautas. Os papéis de pesquisa, Visionário, conteúdo e revisão são etapas lógicas de um fluxo coordenado por Jarvis; não são prova de especialistas independentes executando em paralelo. O adaptador de geração usa o runtime existente e consulta a biblioteca do usuário autenticado, sem buscar histórias de clientes. O contexto dessa biblioteca continua marcado como não verificado editorialmente. O catálogo comercial operacional deste fluxo está vazio até haver ofertas disponíveis verificadas; nenhuma oferta ou preço é inventado.

**E2.** Série padrão de nove episódios, com suporte de 1–12 no contrato. Cada unidade tem roteiro integral, objetivo, gancho, cena, prática, fechamento, duração estimada, perguntas identificadas, descrição, copy, FAQ, limites e ligação anterior/próxima. Aprovação e classificação de acesso são explícitas. Revisões preservam versões; alteração de direitos também muda versão. Há uma barreira simples contra cópia literal extensa, que não substitui revisão autoral. A geração avança uma unidade por chamada e depende de provedor autorizado; não houve geração paga ou avaliação editorial real nesta execução.

**E3.** A entrega usa HMAC, versão e comprovante de recebimento. Magnetus3 armazena episódios aprovados em índice relacional, consulta episódio/versão/direito no runtime e os inclui como fonte antes da inferência. O corpus histórico permanece intacto. Versão ausente é recusada; publicação não é inferida de aprovação. A ação `recording` aceita transcrição final revisada e abre nova versão; ainda não há comparação automática com o arquivo de áudio, análise audiovisual ou recibo de publicação no Telegram.

**E4.** App: resposta vinculada a episódio/pergunta, texto e ditado opcional do navegador com revisão. Confirmar pode preparar o texto no campo da conversa, sem enviá-lo automaticamente ao modelo. Telegram: webhook autenticado, conversa privada, vínculo de uso único iniciado pela conta autenticada, janela de recebimento consentida de 24 horas, fila de revisão, deduplicação, edição e exclusão no app. Voz do Telegram é identificada como arquivo pendente: seu download/transcrição ainda não foi implementado. Comentários públicos não são transformados em dados privados. Não foi registrado bot nem enviado conteúdo ao Telegram.

**E5.** Memória continua desligável, confirmada, editável e apagável, com limite histórico de vinte registros. Cada contribuição agregada exige permissão própria e tema conferido. Classificação lexical é hipótese explícita; não é diagnóstico nem análise semântica avançada. O relatório semanal usa categorias e grupos de pelo menos cinco pessoas; não entrega narrativas, IDs ou memórias ao Jarvis. Não há treinamento de pesos.

**E6.** Cliente escolhe registros, objetivo, perguntas e exclusões, vê a prévia e autoriza um mapa por 30 dias para a conta configurada da mentora. RLS impede acesso à prévia não compartilhada. Correção/exclusão da memória e revogação de consentimento revogam mapas derivados. A exclusão escrita é um aviso para revisar a seleção, não um filtro automático que garante retirar palavras dos registros: a UI pede desmarcar o que não deve ser incluído.

**E7.** Temas coletivos autorizados geram propostas e podem preencher o brief de uma nova série. A geração do galho é uma ação nova, preservando a tarefa original. Métricas comerciais retornam `null`: não há atribuição transacional de cliques, compras ou renovação. Uso não é venda; renda continua hipótese.

## Rastreabilidade MM01–MM17

“Local” abaixo significa código exercitado com dados sintéticos e banco isolado. Não significa implantação externa.

| Requisito | Estado desta entrega | Evidência / lacuna |
|---|---|---|
| MM01 | Parcial, fluxo local | Conversa → tarefa → aprovação Sol → ponte; facetas históricas preservadas, papéis lógicos no gerador |
| MM02 | Parcial | Plano e novas pautas persistidos; faltam catálogo disponível, perfil editorial aprovado e resultado comercial real |
| MM03 | Local para texto/legendas; externo pendente | API salva antes da aquisição; limitação exata do link; teste UI preparado, navegador local bloqueado |
| MM04 | Parcial | Segmentos temporais de legenda; sem ASR/visão de vídeo nem leitura do YouTube inicial |
| MM05 | Parcial | Letra fornecida e amostra identificada validadas; aquisição de canal/música depende de executor de mídia |
| MM06 | Estrutura local | Nove checkpoints completos em fixture; faltam nove roteiros reais gerados e aceitos por Sol |
| MM07 | Parcial | IDs anterior/próximo e pautas; não há grafo editorial entre séries publicado |
| MM08 | Parcial | Acesso/entitlement validado na LÚCIDA; ofertas operacionais vazias; sem checkout novo |
| MM09 | Parcial | Brief, copy, versão e aprovação; identidade e qualidade literária exigem avaliação com Sol |
| MM10 | Local para conhecimento aprovado | Consulta e citação da versão testadas; publicação externa não comprovada |
| MM11 | Local app/texto Telegram | Ditado depende do navegador; voz Telegram fica pendente, sem transcrição fictícia |
| MM12 | Local agregado limitado | Semana fechada, grupos ≥5, temas revistos; ainda sem análise semântica avançada das dúvidas |
| MM13 | Local consentido | Memória e sinal agregado separados; revisão/exclusão preservadas |
| MM14 | Local autorizado | Seleção → prévia → autorização → acesso mentor → revogação |
| MM15 | Local com limites | Corpus autoral e episódio separados da memória privada; perfil Sol não é importado indiscriminadamente |
| MM16 | Local durável | Banco fechado/reaberto após roteiro 3, retoma 4; leases, revisões e idempotência |
| MM17 | Executado no escopo | Bases e fontes conferidas, histórico preservado; Mac não inspecionado |

## Evidências e reprodução

SOL-IA: `npm ci`; `npm run build` executa os 234 testes Node e TypeScript/Vite; `npm test` executa o verificador de segurança. Os 234 testes e a compilação passaram localmente. `tests/reference-series.test.mjs` cobre fonte acessível simulada/bloqueada, amostra incompleta, instrução maliciosa tratada como dado, validação, série/versões, aprovação, resultado ambíguo e cópia de letra. `tests/reference-database.test.mjs` usa PostgreSQL real via PGlite, RLS entre duas contas, disputa de revisão/lease e reabertura do banco em disco após o terceiro roteiro.

Magnetus3: `npm test` passou 25 testes; `npm run build` passou; `tests/episodes-runtime.test.ts` passou seis testes HTTP de integração sobre PostgreSQL/PGlite, BetterAuth e o servidor Next compilado. O provedor de IA responde com uma **fixture sintética**: prova conteúdo injetado, versão/citação e controles, não qualidade da resposta de um modelo real. A regressão completa usa `npm run test:integration`, incluindo os testes anteriores. Resultados finais também ficam em `evidencias/referencias-2026-09-21/` nos dois repositórios.

Navegador: `agent-browser` falhou ao iniciar o daemon em duas tentativas. A alternativa Playwright não encontrou navegador instalado e o download de Chromium falhou por rede. Teste desktop/mobile de colar link, nove roteiros, aprovação e recebimento preparado em `tests/browser/references.spec.ts` e CI `jarvis-references.yml`. **Não há aprovação visual, screenshot validado, teste físico de voz ou iPhone nesta etapa.** Gate anterior permanece aberto.

## Continuidade, custo e interrupções

- Banco armazena fonte, digest, segmentos, objetivo, plano, versões, etapa, erro e próximo passo. Uma unidade por lease; três tentativas por etapa; geração anterior concluída não se repete ao retomar.
- Resultado de provedor incerto fica `uncertain`; não há repetição silenciosa. A retomada explícita avisa sobre eventual consumo anterior. Não é possível prometer cobrança única se um provedor externo recebeu a chamada e perdeu o recibo. Token/modelo ficam registrados quando informados; custo monetário não conhecido permanece `null`.
- A UI avança enquanto aberta; o servidor não contém cron/fila de geração autônoma. Fechar a tela preserva resultados confirmados. Recuperação de lease vencido não apaga episódios.
- Recebimento pela LÚCIDA é idempotente por versão/digest. Remover a tarefa do Jarvis não retira automaticamente uma versão já ingerida pela LÚCIDA.
- Apagar mensagens comuns no Telegram não produz necessariamente um evento utilizável pelo bot; a exclusão autorizada é disponibilizada no app. Fila expirada fica inacessível e é apagada fisicamente na próxima operação da conta; agendamento global de limpeza continua pendente.

## Ativação isolada e próximo trabalho

1. Revisar as duas PRs como deltas sobre suas bases documentais; conferir HEADs concorrentes. Não alterar main ou a base das pilhas por conveniência.
2. Criar banco/ambiente isolado e aplicar somente ali `20260921182729_reference_series_jobs.sql` no Jarvis e migrações 003–005 no Magnetus3. Conceder ao login de runtime, sem superuser/bypass, membership nas roles específicas conforme o runbook da LÚCIDA. Nenhuma migração remota foi aplicada nesta execução.
3. Configurar segredos de ponte de pelo menos 32 caracteres por ambiente, separados para envio editorial, relatório e webhook. Ativar `JARVIS_REFERENCES_ENABLED` e `LUCIDA_EPISODES_ENABLED` no teste. Preservar o orçamento e as autorizações de IA existentes. Sem credencial/modelo elegível, o link pode ser salvo e a geração fica bloqueada com motivo.
4. Validar com modelo autorizado uma fonte efetivamente obtida, qualidade dos nove roteiros, pacote aprovado e conversa real sobre cada episódio. Não usar a fixture como demonstração do vídeo original ou como roteiro autoral pronto.
5. Implementar/homologar o executor de mídia (captions/ASR/quadros, cobertura e limites) e o worker de voz do Telegram; depois validar o bot em conversa de teste autorizada. O webhook de entrada já tem código, mas bot/segredo/registro externos não existem neste ambiente.
6. Executar navegador/Preview e manter os gates de segurança, voz, login e iPhone existentes. Só depois do aceite correspondente considerar ativação externa. Este relatório não concede autorização de produção, gasto, mensagens a clientes ou publicação.
7. Conectar catálogo operacional e eventos comerciais reais quando existirem. Preservar direitos adquiridos e classificação ainda pendente do canal. Continuar sem inventar receita nem produtos.

O prompt de execução original permanece integralmente preservado. Esta entrega atualiza o estado observado; os itens parciais não foram convertidos em concluídos apenas por estarem documentados.


## Conferência remota da entrega

PR de implementação: [SOL-IA #11](https://github.com/Sollimastudio/SOL-IA/pull/11), branch `work/jarvis-references-lucida-20260921`. Código testado no commit `656a11c6d553a99ab801dbdfd82e9d27cf83497f`. Contraparte: [Magnetus3 #2](https://github.com/Sollimastudio/Magnetus3/pull/2), código `f41e637f52d710e8ebf0197aa7e03859c54af259`. Conferidos os blobs de todos os 31 arquivos do delta Jarvis e 35 da LÚCIDA: correspondem aos arquivos locais.

O [Preview técnico do Jarvis](https://sol-ia-i5wy-n0ksxhb0e-sol-limas-projects.vercel.app) foi criado pelo fluxo Git existente da Vercel: deployment `dpl_5762NZn1Wug2bCLrrTcTQXiZtGBq`, `READY`, SHA correspondente e `target=null` (Preview). Esse estado comprova conclusão do deployment; não comprova aprovação visual ou configuração de banco/ponte. Não houve promoção a produção.

[GitHub Actions do Jarvis](https://github.com/Sollimastudio/SOL-IA/actions/runs/35643849466) e [da LÚCIDA](https://github.com/Sollimastudio/Magnetus3/actions/runs/35643892318) terminaram em `failure` antes de executar qualquer step (listas vazias). O download de logs retornou `BlobNotFound`; a causa não pôde ser determinada pelas ferramentas disponíveis. Não classificar como CI aprovado nem como regressão específica de código sem logs. Os 281 testes aprovados são a evidência **local**. Gate remoto permanece aberto.

O PR #10 de custo de voz continua independente em `d1465b6ac95ec9ee2bdff03f2847d527cf50fc14`; não foi reescrito, fechado ou incorporado silenciosamente. Conciliar essa proposta apenas no fluxo de integração correspondente.
