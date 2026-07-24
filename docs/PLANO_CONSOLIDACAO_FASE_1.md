# Plano de consolidação — Fase 1

## Objetivo

Criar a fundação de governança da Sol.IA sem apagar arquivos, repositórios ou históricos.

## Alterações desta fase

- [x] Declarar `SOL-IA` como repositório canônico.
- [x] Criar registro estruturado dos 69 repositórios.
- [x] Definir regras para manter, absorver, arquivar e excluir.
- [ ] Tornar os diagnósticos do Narrativas manuais e sem autocorreção.
- [ ] Auditar branches não consolidadas.
- [ ] Auditar domínios, checkouts e deploys dos funis comerciais.
- [ ] Migrar capacidades para o núcleo canônico.
- [ ] Executar os cinco testes de intenção.
- [ ] Solicitar confirmação final antes de qualquer exclusão.

## Branches que exigem auditoria

### Tronco-ia

- `main`
- `copilot/add-basic-tests-and-ci`
- `copilot/fix-tronco-ia-functionality`
- `copilot/fix-upgrade-tronco-ia-project`

### Narrativas-Chronoscribe

- `main`
- `copilot/fix-bugs-and-automate-flow`
- `copilot/fix-content-generation-issues`
- `copilot/fix-generate-failures-and-deploy`
- `copilot/fix-generation-issues`
- `copilot/fix-narrative-style-error`
- `copilot/implement-project-revisions`
- `copilot/rebuild-narrativas-chronoscribe`
- `copilot/revise-entire-project`

### Sol-IA-Mentor

- `main`
- `master`
- `copilot/create-content-strategy`
- `copilot/fix-api-key-issue`
- `copilot/fix-sol-ia-voice-commands`

### Supera-ia-ecossistema

- `main`
- `codex/studio-chronoscribe`

## Ordem técnica da próxima fase

1. Definir contratos de entrada e saída dos agentes.
2. Migrar roteador e memória de projeto.
3. Migrar voz, anexos e provedor de modelos.
4. Migrar Publisher, vídeo e fábrica de conteúdo.
5. Adicionar VSL, mentoria e Meta Ads.
6. Validar segurança e aprovações.
7. Testar os cinco pedidos canônicos:
   - vídeo;
   - VSL;
   - capítulo;
   - mentoria;
   - análise de anúncios.

## Restrições

- Nenhuma exclusão nesta fase.
- Nenhum merge direto em `main`.
- Nenhum gasto ou publicação automática.
- Nenhuma dependência deve ser alterada por automação sem revisão.
