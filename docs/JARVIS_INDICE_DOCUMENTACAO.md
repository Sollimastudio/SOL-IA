# Jarvis / Sol.IA — Índice oficial de documentação

> **Documento canônico de navegação.** Atualizado em 15/09/2026.

Este índice existe para impedir que o projeto volte a depender de conversas soltas, lembranças ou documentos históricos fora de contexto. Ele separa **documentação oficial atual**, **documentação de arquitetura**, **manuais operacionais** e **registros históricos de desenvolvimento**.

## Leitura rápida

Se você quer entender o Jarvis como produto, leia nesta ordem:

1. [`../README.md`](../README.md) — visão executiva e estado geral.
2. [`JARVIS_PRODUTO_E_VISAO.md`](JARVIS_PRODUTO_E_VISAO.md) — para que foi criado, proposta de valor, princípios e escopo.
3. [`JARVIS_MODO_DE_USO.md`](JARVIS_MODO_DE_USO.md) — como usar no dia a dia, por texto, voz, câmera, memória e futuramente live.
4. [`JARVIS_STATUS_CAPACIDADES.md`](JARVIS_STATUS_CAPACIDADES.md) — o que funciona, o que está implementado mas ainda precisa de prova física e o que é roadmap.

Se você vai manter ou desenvolver o sistema:

5. [`JARVIS_ARQUITETURA_GERAL.md`](JARVIS_ARQUITETURA_GERAL.md) — arquitetura técnica e fluxos.
6. [`JARVIS_OPERACAO_E_MANUTENCAO.md`](JARVIS_OPERACAO_E_MANUTENCAO.md) — operação, testes, segurança, deploy, incidentes e disciplina de evolução.
7. [`CONTINUIDADE_JARVIS.md`](CONTINUIDADE_JARVIS.md) — histórico técnico e decisões verificáveis do desenvolvimento atual.

## Documentos oficiais atuais

| Documento | Finalidade | Público |
|---|---|---|
| `README.md` | Capa profissional do projeto | Todos |
| `JARVIS_PRODUTO_E_VISAO.md` | Definição do produto e motivo de existência | Produto, negócio, engenharia |
| `JARVIS_MODO_DE_USO.md` | Manual funcional do usuário | Usuário final |
| `JARVIS_STATUS_CAPACIDADES.md` | Matriz de capacidade e maturidade | Produto, QA, engenharia |
| `JARVIS_ARQUITETURA_GERAL.md` | Arquitetura de sistema | Engenharia |
| `JARVIS_OPERACAO_E_MANUTENCAO.md` | Runbook técnico | Engenharia/operação |
| `CONTINUIDADE_JARVIS.md` | Registro de decisões e checkpoints | Engenharia/IA de desenvolvimento |

## Arquiteturas especializadas que continuam válidas

- [`ARQUITETURA_ANTIFADIGA_ADAPTATIVA.md`](ARQUITETURA_ANTIFADIGA_ADAPTATIVA.md) — raiz/galhos, delta, repetição, loops, continuidade e autocorreção supervisionada.
- [`ARQUITETURA_CEREBRO_CRESCENTE_SOCIAL.md`](ARQUITETURA_CEREBRO_CRESCENTE_SOCIAL.md) — modelos substituíveis, inteligência crescente, Capability Radar e inteligência social.
- [`ARQUITETURA_DE_SKILLS_E_INTERFACES.md`](ARQUITETURA_DE_SKILLS_E_INTERFACES.md) — habilidades e fronteiras de interface.
- [`PROGRAMA_DE_CONSTRUCAO_JARVIS.md`](PROGRAMA_DE_CONSTRUCAO_JARVIS.md) — programa de construção e critérios de aceite.
- [`VOZ_CONTINUA_E_VIDEOCHAMADA.md`](VOZ_CONTINUA_E_VIDEOCHAMADA.md) — requisitos históricos de voz e chamada, quando presente no branch.
- `ios/JarvisNative/README-INSTALAR.md` — instalação e prova física do cliente nativo iOS.

## Regra de precedência

Quando houver conflito entre documentos:

1. comportamento comprovado pelo código e testes atuais;
2. `JARVIS_STATUS_CAPACIDADES.md`;
3. `JARVIS_ARQUITETURA_GERAL.md` e `JARVIS_PRODUTO_E_VISAO.md`;
4. documentos especializados atuais;
5. documentos históricos/checkpoints antigos;
6. mensagens de conversas antigas.

Documento antigo não transforma requisito em capacidade pronta. Um recurso só deve ser apresentado como operacional quando houver evidência compatível com seu tipo: teste de código, teste de integração ou prova no aparelho/plataforma real.

## Convenções de status

- **OPERACIONAL** — implementado e verificado no ambiente compatível.
- **IMPLEMENTADO / AGUARDA PROVA FÍSICA** — código existe e testes estáticos passaram, mas falta aparelho/plataforma real.
- **PARCIAL** — parte da experiência funciona; a promessa completa ainda não.
- **PLANEJADO** — requisito aceito e arquitetado, ainda não entregue.
- **BLOQUEADO POR TERCEIRO** — depende de permissão, API, credencial, revisão ou limitação de plataforma externa.

## Regra para futuras IAs e desenvolvedores

Antes de propor uma reconstrução, criar outro repositório ou pedir novamente à usuária a visão do Jarvis:

1. ler este índice;
2. ler o README;
3. consultar `CONTINUIDADE_JARVIS.md` e o PR ativo;
4. verificar o HEAD real do branch;
5. comparar requisito com o que já existe;
6. trabalhar no delta, não recomeçar o projeto.

**O objetivo da documentação é o mesmo do produto: reduzir carga mental e preservar continuidade.**
