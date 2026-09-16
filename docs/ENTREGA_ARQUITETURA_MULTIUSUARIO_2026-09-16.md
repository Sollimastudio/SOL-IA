# Checkpoint — Arquitetura Multiusuário e Personalização Profunda

Data: 16/09/2026  
Repositório: `Sollimastudio/SOL-IA`  
Branch: `work/jarvis-gpt-live-1-20260916`

## Decisão consolidada

Jarvis passa a ser definido oficialmente como **plataforma de inteligência operacional adaptativa**, não como um assistente pessoal da Sol que futuramente seria copiado para outros usuários.

Sol continua sendo o primeiro e mais profundo piloto. Sua configuração vira referência de profundidade e `Sol Profile Pack`, sem se tornar default global.

## O que foi preservado

Nada desta revisão substitui ou reduz:

- Anti-Fadiga;
- raiz/galhos/delta;
- Perfil DNA;
- memória e continuidade;
- Cofre;
- biblioteca/conhecimento;
- Capability Radar;
- Loop Tendência → Ativo → Resultado;
- voz/realtime/live;
- self-healing supervisionado;
- especialistas;
- projetos/produtos da Sol;
- segurança/custos/gates existentes.

A revisão trabalha por **delta de arquitetura**.

## Nova arquitetura oficial

Entidades futuras fundamentais:

- tenant/organização;
- workspace;
- cliente/conta atendida;
- projeto;
- usuário/membro;
- role/permissão;
- marca/persona;
- ativos;
- objetivos/KPIs;
- políticas de custo/risco/aprovação.

## Tipos de cliente previstos

- indivíduo;
- creator;
- profissional;
- agência;
- consultoria;
- equipe;
- empresa;
- e-commerce;
- SaaS/tecnologia;
- outros setores/objetivos configuráveis.

O sistema deve adaptar skills, fontes, conectores, radar, interface, modelos e métricas ao objetivo, sem criar fork por nicho.

## Skills

Foi formalizada a separação:

1. Core Skills globais;
2. Skill Packs por contexto;
3. configuração privada por tenant/workspace.

Exemplos:

- `Sol Profile Pack`;
- `Agency Pack`;
- `Company Pack`;
- Sales/Support/Content/Engineering e futuros packs verticais.

## Agências

A agência é um tenant que pode conter múltiplos clientes isolados.

Playbooks podem ser compartilhados; dados, segredos, métricas, marcas e memória dos clientes não.

## Empresas

Empresa/equipe pode possuir membros, departamentos, workspaces, papéis e memória institucional compartilhada, mantendo separação de memórias pessoais e áreas restritas.

## Radar

Existem dois conceitos:

- Capability Radar global: melhora/protege o próprio Jarvis;
- Domain Radar por tenant: mercado, tendências, concorrência, risco e oportunidade específicos do cliente.

## Tendência → Resultado

O loop deixa de otimizar somente “receita/viralização” e passa a otimizar o objetivo do tenant.

Exemplos:

- creator → audiência/venda;
- agência → performance/margem;
- empresa → receita/economia/qualidade;
- SaaS → ativação/retenção;
- operação → redução de custo/erro.

## Segurança

Multiusuário comercial exige prova futura de:

- isolamento `tenant/workspace/client`;
- RBAC/ABAC;
- busca/cache/embeddings isolados;
- segredos por tenant;
- auditoria;
- custos atribuíveis;
- export/delete/restore por tenant;
- testes adversariais cross-tenant.

A infraestrutura atual de owner/RLS do piloto **não é apresentada como multi-tenant comercial pronta**.

## Documentação revisada nesta entrega

- `README.md`;
- `JARVIS_PRODUTO_E_VISAO.md`;
- `JARVIS_ARQUITETURA_GERAL.md`;
- `ARQUITETURA_MULTIUSUARIO_E_PERSONALIZACAO.md` — novo documento canônico;
- `ARQUITETURA_DE_SKILLS_E_INTERFACES.md`;
- `ARQUITETURA_CEREBRO_CRESCENTE_SOCIAL.md`;
- `INTELIGENCIA_CRESCENTE_E_RADAR.md`;
- `LOOP_CONTINUO_TENDENCIA_PARA_RECEITA.md`;
- `AUDIENCIA_PREMIUM_E_MONETIZACAO.md`;
- `JARVIS_MODO_DE_USO.md`;
- `JARVIS_STATUS_CAPACIDADES.md`;
- `JARVIS_OPERACAO_E_MANUTENCAO.md`;
- `PROGRAMA_DE_CONSTRUCAO_JARVIS.md`;
- `JARVIS_INDICE_DOCUMENTACAO.md`.

## Regra para futuras alterações

Antes de hardcodar um comportamento, perguntar:

> **Isso pertence ao Core global, a um Skill Pack, ao tenant, ao workspace, ao projeto ou ao perfil específico da Sol?**

Antes de acessar dados, perguntar:

> **Qual é o escopo e quem está autorizado?**

Essas duas perguntas passam a ser parte da governança do produto.
