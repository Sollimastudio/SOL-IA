# Jarvis / Sol.IA — Índice oficial de documentação

> **Documento canônico de navegação.** Atualizado em 16/09/2026.

Este índice existe para impedir que o projeto volte a depender de conversas soltas, lembranças ou documentos históricos fora de contexto. Também impede dois erros de arquitetura: tratar o piloto Sol como template universal ou tratar “multiusuário” como algo que só deve ser pensado depois do produto pronto.

## Leitura rápida

Para entender o Jarvis como produto, leia nesta ordem:

1. [`../README.md`](../README.md) — visão executiva e estado geral.
2. [`JARVIS_PRODUTO_E_VISAO.md`](JARVIS_PRODUTO_E_VISAO.md) — propósito, princípios e visão.
3. [`ARQUITETURA_MULTIUSUARIO_E_PERSONALIZACAO.md`](ARQUITETURA_MULTIUSUARIO_E_PERSONALIZACAO.md) — como o mesmo motor atende pessoas, agências, empresas e novos objetivos sem copiar o perfil da Sol.
4. [`JARVIS_MODO_DE_USO.md`](JARVIS_MODO_DE_USO.md) — experiência por texto, voz, memória, workspaces e equipes.
5. [`JARVIS_STATUS_CAPACIDADES.md`](JARVIS_STATUS_CAPACIDADES.md) — o que funciona, o que está implementado aguardando prova e o que é roadmap.

Para manter/desenvolver o sistema:

6. [`JARVIS_ARQUITETURA_GERAL.md`](JARVIS_ARQUITETURA_GERAL.md) — arquitetura técnica, tenants, Core, memória, modelos e ferramentas.
7. [`ARQUITETURA_DE_SKILLS_E_INTERFACES.md`](ARQUITETURA_DE_SKILLS_E_INTERFACES.md) — Core Skills + Skill Packs por tenant.
8. [`ARQUITETURA_CEREBRO_CRESCENTE_SOCIAL.md`](ARQUITETURA_CEREBRO_CRESCENTE_SOCIAL.md) — inteligência crescente, radares e aprendizado.
9. [`JARVIS_OPERACAO_E_MANUTENCAO.md`](JARVIS_OPERACAO_E_MANUTENCAO.md) — runbook, testes, segurança, incidentes e gates multi-tenant.
10. [`CONTINUIDADE_JARVIS.md`](CONTINUIDADE_JARVIS.md) — histórico técnico/checkpoints.

## Documentos oficiais atuais

| Documento | Finalidade | Público |
|---|---|---|
| `README.md` | Capa profissional do produto | Todos |
| `JARVIS_PRODUTO_E_VISAO.md` | Definição do produto | Produto, negócio, engenharia |
| `ARQUITETURA_MULTIUSUARIO_E_PERSONALIZACAO.md` | Tenants, workspaces, agências, empresas e personalização | Produto, engenharia, negócio |
| `JARVIS_MODO_DE_USO.md` | Manual funcional | Usuário final/produto |
| `JARVIS_STATUS_CAPACIDADES.md` | Matriz de maturidade | Produto, QA, engenharia |
| `JARVIS_ARQUITETURA_GERAL.md` | Arquitetura de sistema | Engenharia |
| `JARVIS_OPERACAO_E_MANUTENCAO.md` | Runbook técnico | Engenharia/operação |
| `CONTINUIDADE_JARVIS.md` | Decisões/checkpoints | Engenharia/IA de desenvolvimento |

## Arquiteturas especializadas válidas

- [`ARQUITETURA_ANTIFADIGA_ADAPTATIVA.md`](ARQUITETURA_ANTIFADIGA_ADAPTATIVA.md) — raiz/galhos/delta, continuidade e autocorreção supervisionada.
- [`ARQUITETURA_CEREBRO_CRESCENTE_SOCIAL.md`](ARQUITETURA_CEREBRO_CRESCENTE_SOCIAL.md) — modelos substituíveis, Radar global/domínio e inteligência crescente.
- [`ARQUITETURA_DE_SKILLS_E_INTERFACES.md`](ARQUITETURA_DE_SKILLS_E_INTERFACES.md) — Core Skills, Skill Packs, interfaces e papéis.
- [`INTELIGENCIA_CRESCENTE_E_RADAR.md`](INTELIGENCIA_CRESCENTE_E_RADAR.md) — fontes oficiais, algoritmos, modelos, evidência e benchmark.
- [`LOOP_CONTINUO_TENDENCIA_PARA_RECEITA.md`](LOOP_CONTINUO_TENDENCIA_PARA_RECEITA.md) — tendência → ativo → resultado, parametrizado por tenant.
- [`AUDIENCIA_PREMIUM_E_MONETIZACAO.md`](AUDIENCIA_PREMIUM_E_MONETIZACAO.md) — audiência/mercado/objetivos, funis e monetização parametrizável.
- [`PROGRAMA_DE_CONSTRUCAO_JARVIS.md`](PROGRAMA_DE_CONSTRUCAO_JARVIS.md) — programa de construção e critérios de aceite atualizados.
- [`VOZ_CONTINUA_E_VIDEOCHAMADA.md`](VOZ_CONTINUA_E_VIDEOCHAMADA.md) — requisitos históricos de voz/chamada.
- `ios/JarvisNative/README-INSTALAR.md` — instalação/prova do cliente iOS.

## Checkpoints recentes

- [`ENTREGA_ARQUITETURA_MULTIUSUARIO_2026-09-16.md`](ENTREGA_ARQUITETURA_MULTIUSUARIO_2026-09-16.md) — consolida a mudança de produto: plataforma adaptativa, Sol como primeiro Profile Pack, Agency/Company Packs, isolamento e gates multi-tenant.

## Piloto Sol x produto Jarvis

Regra canônica:

- **Sol** = primeiro tenant/perfil piloto profundo;
- **Sol Profile Pack** = obras, produtos, presença, linguagem, rotinas e skills específicas dela;
- **Jarvis Core** = tecnologia/metodologia reutilizável;
- **conta nova** = começa sem dados, opinião, marca, produtos ou preferências da Sol;
- **agência** = tenant com múltiplos clientes/workspaces isolados;
- **empresa** = tenant com membros/roles/workspaces/políticas próprios.

Não transformar requisito pessoal do piloto em default global sem análise de produto.

## Regra de precedência

Quando houver conflito:

1. comportamento comprovado pelo código/testes atuais;
2. `JARVIS_STATUS_CAPACIDADES.md`;
3. `JARVIS_ARQUITETURA_GERAL.md`, `JARVIS_PRODUTO_E_VISAO.md` e `ARQUITETURA_MULTIUSUARIO_E_PERSONALIZACAO.md`;
4. documentos especializados atuais;
5. checkpoints/históricos antigos;
6. mensagens antigas.

Documento antigo não transforma requisito em capacidade pronta. Documento novo também não transforma arquitetura em implementação.

## Convenções de status

- **OPERACIONAL** — implementado e verificado no ambiente compatível.
- **PARCIAL** — parte funciona; promessa completa ainda não.
- **IMPLEMENTADO / AGUARDA PROVA** — código existe; falta integração/aparelho/plataforma/Preview correspondente.
- **ARQUITETURA OFICIAL** — decisão de produto aceita; não equivale a operação pronta.
- **PLANEJADO** — requisito aceito, ainda não entregue.
- **BLOQUEADO POR TERCEIRO** — depende de API, permissão, credencial ou limitação externa.

## Regra para futuras IAs e desenvolvedores

Antes de propor reconstrução, criar repositório ou pedir novamente a visão do Jarvis:

1. ler este índice;
2. ler README;
3. ler Produto e Visão;
4. ler Multiusuário e Personalização;
5. consultar Continuidade e HEAD real;
6. comparar requisito com o que existe;
7. trabalhar no delta.

Para tendência/crescimento/monetização: ler `LOOP_CONTINUO_TENDENCIA_PARA_RECEITA.md`.

Para qualquer feature nova: perguntar **“isso é global do Core, Skill Pack, configuração de tenant, configuração de workspace ou regra específica da Sol?”** antes de codificar.

Para dados: perguntar **“qual é o escopo e quem está autorizado?”** antes de buscar/gravar.

**O objetivo da documentação é o mesmo do produto: reduzir carga mental, preservar continuidade e impedir que personalização vire vazamento ou hardcode.**

## Diretriz adicional — referências, Visionário e LÚCIDA (21/09/2026)

[PROTOCOLO_REFERENCIAS_CONTEUDO_LUCIDA.md](PROTOCOLO_REFERENCIAS_CONTEUDO_LUCIDA.md) é leitura obrigatória antes de desenvolver ingestão de links, séries/copy, Minutos Magnetus, aprendizado de respostas ou conexão Jarvis–LÚCIDA.
Inclui auditoria do código e requisitos MM01–MM17. É complemento do loop de crescimento, não novo núcleo nem capacidade operacional já ativada.

## Mapa explícito das multifacetas e prompt de execução — 21/09/2026

Complementação solicitada por Sol, sem substituir os documentos anteriores:

| Documento | Uso |
|---|---|
| [JARVIS_MULTIFACETAS_E_ORQUESTRACAO.md](JARVIS_MULTIFACETAS_E_ORQUESTRACAO.md) | Encontrar todas as facetas históricas, Core Skills, Skill Packs, perfis e roteamentos já registrados; preservar as funções ao acrescentar o novo fluxo |
| [REQUISITOS_SOL_REFERENCIAS_LUCIDA_2026-09-21.md](REQUISITOS_SOL_REFERENCIAS_LUCIDA_2026-09-21.md) | Consultar MM01–MM17 integralmente no SOL-IA, com origem/versionamento e distinção entre solicitação e operação |
| [PROMPT_EXECUCAO_REFERENCIAS_MULTIFACETAS_LUCIDA.md](PROMPT_EXECUCAO_REFERENCIAS_MULTIFACETAS_LUCIDA.md) | Continuar a implementação por E1–E7, com preservação do projeto, critérios de aceite e evidências |

Os novos arquivos complementam Produto e Visão, Skills e Interfaces, Loop, Protocolo, Status e Continuidade. O espelho de requisitos conserva a fonte canônica identificada; verificar versões posteriores antes de implementar. Não substituir o inventário completo por uma lista apenas das funções de conteúdo.


## Execução adicional E1–E7 — 21/09/2026

A implementação e a matriz MM01–MM17 estão em [ENTREGA_REFERENCIAS_LUCIDA_2026-09-21.md](ENTREGA_REFERENCIAS_LUCIDA_2026-09-21.md). Base preservada: PR #8, `f75f63988dbdc461af08067a4be55a0f9e828e89`. Há código para tarefas duráveis, roteiros, ponte editorial e continuidade consentida na LÚCIDA; os 234 testes do Jarvis e a compilação passaram localmente. A contraparte Magnetus3 passou 25 testes unitários e 22 de integração HTTP, incluindo os seis novos. Os dados e o provedor usados nessas provas são sintéticos.

Vídeo inicial não lido; aquisição audiovisual/ASR, voz Telegram, qualidade editorial real, navegador/iPhone e ativação externa continuam pendentes. Nenhum gate anterior foi fechado por esta entrega. Não houve migração remota, publicação, envio a clientes, novo gasto ou treinamento de pesos. Ler o relatório antes de retomar; não reduzir Jarvis às funções editoriais.
