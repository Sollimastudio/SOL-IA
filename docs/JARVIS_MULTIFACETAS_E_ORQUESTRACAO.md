# Jarvis — mapa das multifacetas e da orquestração
Versão 1.0 — 21/09/2026.
Natureza: inventário documental aditivo e contrato de evolução. Não ativa agentes, ferramentas ou integrações.
Base lida: SOL-IA `1355a9bc5c7d420b7c15139c609a2d051a50258f`, branch `work/audit-jarvis-ecosystem-20260918`, PR #8. Conferir HEAD real antes de implementar.

## 1. A documentação já existia

A exigência de um Jarvis multifacetado já está presente em:
- [Produto e visão](JARVIS_PRODUTO_E_VISAO.md): uma entrada com memória, voz, visão, conhecimento e especialistas;
- [Arquitetura de skills e interfaces](ARQUITETURA_DE_SKILLS_E_INTERFACES.md): Core Skills, Skill Packs e perfis;
- [Arquitetura geral](JARVIS_ARQUITETURA_GERAL.md) e [multiusuário/personalização](ARQUITETURA_MULTIUSUARIO_E_PERSONALIZACAO.md);
- [Cérebro crescente](ARQUITETURA_CEREBRO_CRESCENTE_SOCIAL.md) e [loop de resultado](LOOP_CONTINUO_TENDENCIA_PARA_RECEITA.md);
- [Registro de especialistas do piloto](../src/skills/skillRegistry.ts);
- [Core Skills e Skill Packs](../core/skill-packs.mjs);
- [Profile Packs](../core/profile-packs.mjs), [roteador](../src/core/capabilityRouter.ts) e [invariantes](../core/jarvis-invariants.mjs).

Esses registros usam níveis diferentes: função, nome histórico, pacote, perfil e roteamento. As tabelas abaixo os tornam encontráveis; não representam quarenta agentes autônomos ativos. Não confundir um item de registry com processo em execução ou prova de capacidade.

## 2. Visão de Sol que deve permanecer

Sol conversa com Jarvis. Jarvis preserva a intenção, conhece o perfil e os ativos autorizados, escolhe as competências e coordena o resultado. LÚCIDA participa como inteligência especializada do ecossistema, sob a coordenação operacional do Jarvis e a direção de Sol.

O novo fluxo Minutos Magnetus amplia esse Jarvis. Permanecem os papéis pessoal, cotidiano, memória, livros, método, conteúdo/copy, audiovisual, voz, live, análise de audiência, negócios, engenharia, riscos e operação. A live é um módulo do mesmo Jarvis; não uma personalidade sem continuidade.

A percepção transversal acontece a partir das interações e fontes autorizadas. “Observar continuamente” não comprova captura permanente nem permite ativar câmera/microfone ou processar dados privados fora do escopo. Cada tarefa carrega o contexto necessário, sem entregar toda a memória para cada especialista.

## 3. Facetas históricas do piloto — todos os 11 IDs preservados

Fonte literal dos nomes/IDs: `src/skills/skillRegistry.ts`. As correspondências de trabalho abaixo são explicação documental, não renomeação de código.

| ID existente | Nome registrado | Continuidade da função |
|---|---|---|
| `imperatriz` | Imperatriz | Direção executiva e priorização; Executive coordena a tarefa completa. |
| `vault` | Vault | Conhecimento, memória e continuidade; respeitar escopo pessoal/projeto/cliente. |
| `visionaria` | Visionaria | Oportunidades: cruza Research, Knowledge, Content, Growth, Sales e Analytics conforme a tarefa. |
| `lex_vanguard` | Lex Vanguard | Risco preventivo e governança; mantém limites e encaminhamento especializado. |
| `publisher` | Publisher | Obra editorial e documentos; preservar voz, autoria e versões. |
| `content_studio` | Narrativas | Narrativas/copy e adaptação por formato/canal. |
| `mentor` | Mentoria | Orientação metodológica e preparação de mentoria; não é diagnóstico clínico. |
| `motion_video` | Motion / Video | Produção audiovisual e futura ingestão multimodal; função declarada não comprova conector. |
| `meta_ads` | Meta Ads | Métricas e recomendações; preservar o escopo de leitura atual. |
| `vida_diaria` | Vida Diaria | Rotina e apoio pessoal; continua existindo fora do fluxo comercial. |
| `performance` | Performance | Presença pública/live, com canal privado separado e contexto permitido. |

Visionário, Visionária e `visionaria` referem-se à mesma faceta histórica neste pedido. Seu avaliador atual em [visionarySkill.ts](../src/core/visionarySkill.ts) usa sinais lexicais; isso não satisfaz sozinho o novo contrato de entendimento, oportunidades persistentes e expansão editorial.

## 4. Core Skills registradas — todos os 13 IDs preservados

Fonte: `core/skill-packs.mjs`. O propósito declarado é transcrito abaixo. Maturidade e ferramentas disponíveis precisam ser verificadas no runtime.

| ID | Nome | Propósito registrado |
|---|---|---|
| `executive` | Executive | Priorizar, coordenar e transformar intenção em próxima ação verificável. |
| `research` | Research | Pesquisar, validar fontes, comparar evidência e registrar incerteza. |
| `knowledge` | Knowledge | Recuperar, organizar e versionar conhecimento com proveniência. |
| `risk` | Risk | Detectar risco jurídico, reputacional, financeiro, técnico e operacional sem substituir profissionais regulamentados. |
| `content` | Content | Planejar, criar, adaptar e revisar conteúdo conforme objetivo e canal. |
| `growth` | Growth | Relacionar aquisição, distribuição, oferta, retenção e aprendizado com métricas reais. |
| `analytics` | Analytics | Ler dados, comparar baselines e separar sinal de ruído. |
| `operations` | Operations | Coordenar processos, filas, tarefas, custos, integrações e comprovantes de execução. |
| `engineering` | Engineering | Diagnosticar software, preparar mudanças isoladas, testar e preservar rollback. |
| `finance` | Finance | Organizar caixa, custos, assinaturas, cenários e prioridades financeiras sem inventar saldo ou transação. |
| `sales` | Sales | Organizar pipeline, proposta, follow-up, oferta e conversão dentro das autorizações do tenant. |
| `learning` | Learning | Ensinar, explicar, estruturar treinamento e adaptar profundidade ao usuário. |
| `media` | Media | Roteiro audiovisual, edição, voz, imagem, vídeo, live e produção multimodal. |

## 5. Skill Packs existentes — todos os 16 IDs preservados

Fonte: `core/skill-packs.mjs`. Um pacote seleciona competências e escopo; não cria outro Jarvis.

| ID do pacote | Nome | Competências | Escopo registrado |
|---|---|---|---|
| `executive-core` | Executive Core | executive | global |
| `research-core` | Research Core | research, knowledge | global |
| `risk-core` | Risk Core | risk | global |
| `operations-core` | Operations Core | operations, analytics | global |
| `personal-executive` | Personal Executive | executive, operations, learning | template |
| `creator-business` | Creator Business | content, growth, sales, analytics, media | template |
| `editorial-author` | Editorial / Author | content, knowledge, research, media | template |
| `growth-monetization` | Growth & Monetization | growth, sales, finance, analytics | template |
| `agency-ops` | Agency Operations | executive, operations, analytics, risk | template |
| `content-studio` | Content Studio | content, media, research | template |
| `paid-media` | Paid Media | growth, analytics, finance, risk | template |
| `analytics` | Analytics | analytics | template |
| `sales` | Sales | sales, analytics, growth | template |
| `knowledge` | Knowledge | knowledge, research | template |
| `engineering` | Engineering | engineering, operations, risk | template |
| `finance` | Finance | finance, analytics, risk | template |

Perfis em `core/profile-packs.mjs`:
- Core global: neutro, sem identidade pessoal de clientes.
- Sol Pilot: perfil explícito com `personal-executive`, `creator-business`, `editorial-author` e `growth-monetization`.
- Agency e Company: configurações próprias; não herdam histórias, marca, voz ou dados de Sol.

A arquitetura conceitual pode agrupar competências de forma diferente do registry. Essa diferença de organização não autoriza remover funções ou concluir que todos os pacotes estão operacionais.

## 6. Roteamento e agentes executores

O roteador atual declara especialistas como `jarvis_executive`, `vault_memory`, `publisher_editorial`, `chronoscribe_content`, `mentor_posicionamento`, `motion_video`, `meta_ads_strategist`, `lex_vanguard` e `daily_guardian`. São IDs de roteamento; preservar compatibilidade ao evoluir.

A evolução deve aceitar pedidos compostos. Um pedido “leia este vídeo, crie nove áudios e acompanhe as respostas” exige várias funções, não somente a primeira categoria lexical encontrada.

Contrato necessário para execução real:
- objetivo-raiz, escopo, autorizações e requisitos;
- plano/etapas com entradas e saídas identificadas;
- responsável/capacidade por etapa;
- ferramentas instaladas e autorizadas;
- estado persistente, erros, checkpoint e retomada;
- limites de custo e de tentativas;
- artefatos e versões;
- avaliação de qualidade e evidência da execução;
- devolutiva única do Jarvis para Sol.

Ter muitos nomes não substitui esse contrato. Jarvis escolhe o menor conjunto de especialistas necessário e mantém a continuidade da conversa; não faz Sol administrar um painel de agentes.

## 7. Como as novas informações entram nas multifacetas

| Função no novo percurso | Facetas/competências | Resultado esperado |
|---|---|---|
| Receber vídeo, canal, música/letra ou relato | Executive, Research, Media, Knowledge | Fonte obtida por acesso permitido; cobertura/transcrição/análise verificáveis |
| Reconhecer oportunidades e renda | Visionário, Growth, Sales, Analytics, Finance | Ativos existentes, novas pautas, hipóteses comerciais, custos e prioridade |
| Escrever série/copy autoral | Narrativas, Content, Publisher, LÚCIDA editorial | Episódios complementares, perguntas identificadas, roteiro para Sol gravar |
| Tornar LÚCIDA conhecedora da série | Knowledge, Learning, Operations, LÚCIDA | Pacote aprovado, indexado e testado na versão correta |
| Receber respostas no Telegram/app | Operations, Media, LÚCIDA de atendimento | Texto/voz ligados ao episódio/pergunta e à identidade autorizada |
| Aprender com cada interação relevante | LÚCIDA, Knowledge, Analytics | Memória individual consentida, demandas agregadas e propostas revisáveis |
| Preparar a chegada à mentoria | Mentoria, LÚCIDA, Vault | Mapa individual revisado e autorizado para Sol |
| Gerar novos galhos e avaliar resultados | Visionário, Growth, Sales, Analytics | Novas séries/ofertas pertinentes, sem receita inventada ou execução sem limite |
| Preservar o trabalho | Vault, Operations, Engineering | Checkpoints, versões, retomada, permissões e comprovantes |

O contrato integral MM01–MM17 está também no próprio SOL-IA: [requisitos completos](REQUISITOS_SOL_REFERENCIAS_LUCIDA_2026-09-21.md). Inclui acesso a links, análise de canais/letras, nove áudios, perguntas, continuidade, produtos, memória, aprendizado agregado e preparação de mentoria.

## 8. Proteção contra perda de requisitos

Preservar a invariante existente `NEW_CAPABILITY_MUST_NOT_REMOVE_EXISTING_CORE_CAPABILITY`.
Regras de alteração:
1. Ler os documentos atuais e o HEAD real; comparar branches e trabalho local disponível.
2. Trabalhar no delta. Não substituir documentação extensa por resumo, truncar arquivos, recomeçar o repositório ou remover funções silenciosamente.
3. Correção explícita pode superar uma regra antiga com data, origem e elo entre versões; preservar o histórico. Não manter uma contradição ativa apenas por medo de editar.
4. Matriz de requisitos, dono, estado, arquivos de implementação, evidência e próximo passo acompanha a execução.
5. Atualizar índice, continuidade e status; não depender de lembrança de conversa.
6. Conferir diffs e reler os arquivos gravados. Nunca usar force-push/reset/clean como forma de conciliar trabalho alheio.
7. Arquivos novos de referência são espelhos versionados com fonte; não são novos cânones concorrentes.
8. Capacidade planejada só muda para comprovada depois da evidência correspondente.

## 9. Próxima execução

Usar [PROMPT_EXECUCAO_REFERENCIAS_MULTIFACETAS_LUCIDA.md](PROMPT_EXECUCAO_REFERENCIAS_MULTIFACETAS_LUCIDA.md). A primeira entrega funcional integra referência → oportunidade → série → conhecimento consultável pela LÚCIDA, seguida das respostas, aprendizado e mentoria.

Permanecem as pendências de voz/login/segurança e os gates do produto. A frente de conteúdo pode avançar isoladamente sem declarar essas outras frentes concluídas.

## 10. Escopo desta complementação

Somente documentação, espelho integral de requisitos e prompt. Nenhum registry, prompt de runtime, corpus, código, banco, conta externa, cobrança ou produção é alterado. Não se declara que “treinamento” ou integração já estejam ativos.
