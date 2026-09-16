# Jarvis — Arquitetura geral

> **Documento técnico canônico de alto nível.** Atualizado em 16/09/2026. Explica como as partes do Jarvis se relacionam sem depender de um modelo, fornecedor ou perfil de cliente específico.

## 1. Visão arquitetural

Jarvis é uma arquitetura em camadas. A interface conversa com uma pessoa/equipe; o núcleo recupera estado; a camada de escopo determina tenant/workspace/projeto/role; o roteador escolhe capacidades; memória e fontes preservam continuidade; ferramentas executam ações autorizadas; modelos são motores substituíveis.

```text
PESSOA / EQUIPE / EMPRESA
          │
          ▼
INTERFACES
Web / nativo / Voz / Câmera / Live / integrações
          │
          ▼
IDENTITY + SCOPE
Tenant / Workspace / Cliente / Projeto / Usuário / Role
          │
          ▼
JARVIS CORE
estado + contexto + anti-fadiga + políticas
          │
          ├──────────────► MEMORY / KNOWLEDGE / ASSETS
          │               Perfil DNA + Continuidade + Biblioteca + Projetos
          │
          ├──────────────► OBJECTIVE / POLICY ENGINE
          │               metas + KPIs + orçamento + risco + aprovações
          │
          ├──────────────► MODEL ROUTER
          │               local / zero-cost / premium / especialista
          │
          ├──────────────► SKILL / AGENT ORCHESTRATOR
          │               capacidades globais + Skill Packs do tenant
          │
          ├──────────────► TOOL ROUTER
          │               GitHub / Drive / CRM / redes / web / arquivos / APIs
          │
          ├──────────────► RADAR
          │               tecnologia global + domínio/tendências do tenant
          │
          └──────────────► EXECUTION LAYER
                          ações autorizadas + auditoria + rollback
```

O produto não deve depender da memória de uma conversa de ChatGPT para funcionar. O estado operacional vive em infraestrutura própria e no escopo correto.

## 2. Tenant, workspace e escopo

Multiusuário é requisito arquitetural, mesmo enquanto o piloto comercial completo ainda não está pronto.

Entidades conceituais:

- **tenant** — pessoa ou organização contratante;
- **workspace** — espaço operacional dentro do tenant;
- **client/account** — conta atendida, especialmente para agências/consultorias;
- **project** — objetivo/projeto com estado próprio;
- **user/member** — pessoa autenticada;
- **role/permission** — o que aquela pessoa pode ver/fazer;
- **brand/persona** — identidade usada em comunicação;
- **asset** — produto, documento, conteúdo, código, dado ou outro recurso do tenant.

Toda recuperação ou ação deve saber **em qual escopo está operando** antes de acessar contexto.

O piloto atual é majoritariamente `owner_id` de uma única conta. A evolução comercial exige `tenant_id/workspace_id` e políticas correspondentes sem enfraquecer o isolamento atual.

## 3. Interfaces

### 3.1 Web/PWA

Responsabilidades atuais/previstas:

- login;
- conversa por texto;
- voz em primeiro plano/realtime quando habilitada;
- anexos;
- modos privado/performance;
- biblioteca/cofre/integrações;
- câmera e quadro sob comando;
- seleção/indicação de workspace quando houver múltiplos contextos.

Limite estrutural: navegador no iPhone não é a camada ideal para wake word permanente, áudio em background e roteamento avançado de live.

### 3.2 Cliente nativo

Criado para capacidades que precisam do sistema operacional:

- App Intents/atalhos;
- áudio mãos-livres;
- sessão protegida;
- notificações;
- modelos on-device quando disponíveis;
- futuro roteamento de áudio privado/público;
- integração mais profunda com o dispositivo.

O cliente nativo não deve conter chaves privadas de modelo/provedor.

### 3.3 Interfaces por papel

O mesmo Core pode oferecer superfícies diferentes para executivo, agência, cliente aprovador, vendas, engenharia, marketing etc. Isso é personalização de interface sobre a mesma plataforma, não forks do produto.

## 4. Jarvis Core

O `Jarvis Core` é a identidade operacional do sistema, não o modelo de linguagem.

Responsabilidades:

- validar sessão, tenant, workspace e autorização;
- montar contexto relevante;
- preservar raiz/galhos/decisões;
- recuperar memória, objetivos, fontes e ativos;
- aplicar políticas de privacidade/risco;
- informar warnings e ausência de fontes;
- manter interfaces independentes dos modelos;
- impedir que modelo/ferramenta atravesse escopo por prompt.

O Core v1 do piloto é majoritariamente read-only para contexto. A execução externa evolui separadamente por gates.

## 5. Anti-fadiga e estado conversacional

A arquitetura mantém diferença entre:

- assunto-raiz;
- galho atual;
- galhos abertos;
- delta;
- decisão vigente;
- correção;
- hipótese;
- tarefa;
- pendência;
- material importado;
- objetivo/KPI;
- escopo da informação.

Contexto deve ser montado em camadas:

1. interação atual;
2. estado do assunto/projeto;
3. memória relevante do escopo permitido;
4. fontes rastreáveis;
5. políticas/objetivos relevantes;
6. histórico frio apenas quando necessário.

Isso reduz repetição, custo, vazamento e perda de contexto.

## 6. Persistência e banco

Supabase/PostgreSQL é a base de autenticação e persistência do piloto.

Famílias atuais incluem memória, continuidade, Perfil DNA, histórico do assistente, conhecimento e conexões.

Na arquitetura multi-tenant, novos dados devem declarar explicitamente a fronteira adequada:

- `owner_id` para pessoal/privado;
- `tenant_id` para organização;
- `workspace_id` para contexto operacional;
- `project_id/client_id` quando necessário;
- políticas de acesso por role/escopo.

Não adicionar `tenant_id` mecanicamente sem revisar migração, RLS, índices, APIs, cache, embeddings, jobs e testes de isolamento.

## 7. Hierarquia de memória

Escopos mínimos desejados:

- pessoal privada;
- workspace;
- projeto;
- cliente;
- organização;
- pública/referência.

Promoção de memória entre escopos precisa de política/autorização. Uma conversa privada de membro não vira conhecimento corporativo automaticamente.

Respostas do assistente continuam separadas de fatos/decisões humanas.

## 8. Segurança de dados

Princípios obrigatórios:

- Auth antes de acesso privado;
- isolamento por owner/tenant/workspace;
- RLS e autorização por papel/escopo;
- sem `service_role` no navegador/app cliente;
- chaves privadas somente em servidor/vault;
- modo público sem Cofre privado;
- fala de terceiros sem persistência automática;
- respostas de modelo separadas de fatos;
- ações sensíveis com aprovação/política explícita;
- logs/cache/vector store também respeitam tenant;
- segredos de conectores separados por tenant;
- exportação/exclusão/restauração por tenant;
- testes adversariais de cross-tenant.

Teste obrigatório no futuro comercial: Tenant A não pode ler, inferir, pesquisar ou executar sobre Tenant B nem com prompt malicioso.

## 9. Perfil DNA parametrizável

O Perfil DNA não deve ser “perfil da Sol” hardcoded.

Pode armazenar claims versionados como:

- objetivo;
- preferência;
- decisão;
- política;
- público;
- marca;
- tom;
- KPI;
- processo;
- orçamento;
- tolerância a risco;
- formato de trabalho;
- restrição;
- role.

A configuração da Sol é um conjunto de claims do piloto, não defaults globais.

## 10. Estratégia de modelos

Jarvis não é sinônimo de modelo específico.

Camadas possíveis:

### Local/on-device

Para tarefas privadas, rápidas e de baixo custo quando o aparelho suporta.

### Zero-cost verificado

Somente quando catálogo/contrato confirma custo compatível e políticas permitirem.

### Premium

Para tarefas que exigem maior capacidade, com orçamento, medição e autorização do tenant.

### Especialistas

Voz realtime, visão, código, vídeo e outras tarefas podem ter motores especializados.

## 11. Model Router

O roteador deve escolher motor por:

- capacidade necessária;
- privacidade;
- política do tenant;
- custo/orçamento;
- latência;
- disponibilidade;
- contexto;
- benchmark próprio;
- restrição de plataforma;
- finalidade da tarefa.

Trocar modelo não pode apagar memória, identidade ou ferramentas.

Custos precisam ser atribuíveis a tenant/workspace/projeto quando aplicável.

## 12. Skills e Orquestrador

A arquitetura distingue:

- **Core Skills** globais;
- **Skill Packs** por tipo de operação;
- **configuração específica do tenant**.

Exemplos de packs: Sol Profile Pack, Agency Pack, Company Pack, Sales, Support, Content Studio, Engineering.

O usuário fala com Jarvis; o Orquestrador decide a combinação interna.

Ver `ARQUITETURA_DE_SKILLS_E_INTERFACES.md`.

## 13. Tool Router e conectores

Ferramentas atuais/previstas incluem:

- GitHub;
- Google Drive;
- Vercel;
- Supabase;
- calendários/e-mail;
- automação;
- WhatsApp Business;
- Instagram/Facebook/TikTok/YouTube;
- CRM;
- analytics;
- sistemas financeiros quando autorizados;
- web/pesquisa;
- arquivos;
- conectores específicos de cada tenant.

Arquitetura:

1. leitura primeiro;
2. escopos mínimos;
3. proveniência;
4. credencial do tenant correto;
5. escrita somente depois;
6. ações irreversíveis com confirmação/política;
7. comprovante de execução.

Conexão existente no ChatGPT não é automaticamente conexão do Jarvis.

## 14. Capability Radar e Radar de Domínio

### Radar global

Acompanha mudanças de tecnologia, APIs, modelos, segurança, preço e infraestrutura que podem melhorar/ameaçar o próprio Jarvis.

### Radar por tenant

Acompanha mercado, tendências, canais, concorrentes, regulamentação quando aplicável, comportamento de clientes, ferramentas e sinais relacionados aos objetivos daquele tenant.

Fluxo:

```text
sinal
→ validar fonte/frescor
→ classificar impacto no tenant
→ cruzar com objetivos/ativos
→ registrar oportunidade/risco
→ teste/ação apropriada
→ medir resultado
→ aprender
```

O Radar não altera produção sozinho.

## 15. Loop Tendência → Resultado

O motor de oportunidade é parametrizável:

- Sol/creator: atenção → conteúdo → ativo → oferta → receita;
- agência: tendência → clientes compatíveis → campanha → performance/margem;
- empresa: sinal → decisão/processo → receita/economia/qualidade;
- SaaS: sinal → feature/conteúdo → ativação/retenção;
- operação interna: anomalia → correção → redução de custo/erro.

O objetivo do tenant define a função de otimização.

Ver `LOOP_CONTINUO_TENDENCIA_PARA_RECEITA.md`.

## 16. Self-healing supervisionado

Autocorreção significa:

1. observar erro;
2. reproduzir;
3. formular hipótese;
4. criar patch isolado;
5. testar;
6. gerar Preview;
7. comparar baseline;
8. promover após gates;
9. manter rollback.

Aprendizado/configuração de um tenant não altera silenciosamente o comportamento global para outros tenants.

## 17. Voz, multimodalidade e Live

Arquitetura desejada:

```text
wake / ação explícita
→ sessão de áudio/câmera autorizada
→ contexto no escopo correto
→ motor de raciocínio/orquestração
→ resposta de voz/visual
→ barge-in/interrupção
→ continuar sessão
```

No piloto Sol, a wake phrase é “Jarvis, tá aí?”. No produto comercial, voz/wake/persona podem ser configuráveis.

Live deve manter canais privado/público separados e comentários externos como dados, não comandos privilegiados.

## 18. Pipeline de entrega

```text
requisito observado
→ delta
→ branch/PR
→ testes
→ Preview
→ prova física/integração quando necessária
→ documentação de status
→ promoção
```

Mudanças multi-tenant exigem testes extras de isolamento e autorização.

## 19. Critério arquitetural

Toda nova capacidade deve responder:

1. reduz carga mental/operacional?
2. preserva memória e proveniência?
3. respeita tenant/workspace/role?
4. pode ser trocada sem reconstruir o produto?
5. custo/risco estão controlados?
6. tem estado real verificável?

Se não, ainda não está pronta para entrar no núcleo.

**O motor é compartilhável; contexto, dados, objetivos e inteligência acumulada pertencem ao cliente correto.**
