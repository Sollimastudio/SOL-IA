# Jarvis / Sol.IA

**Plataforma de inteligência operacional adaptativa com continuidade, memória, voz, visão, conhecimento, especialistas e ferramentas coordenadas por uma única interface.**

> Projeto-mãe: **Eu Não Desapareço**  
> Repositório canônico: `Sollimastudio/SOL-IA`  
> Primeiro piloto profundo: **Sol**

## O que é

Jarvis é uma camada de inteligência que recebe objetivos, contexto, dados, fontes, ferramentas, limites e permissões e coordena a complexidade nos bastidores.

No piloto atual, ele funciona como a porta única da Sol.IA. A arquitetura, porém, **não deve ser limitada à Sol**: o mesmo motor deve poder ser profundamente personalizado para indivíduos, creators, profissionais, agências, equipes e empresas com objetivos totalmente diferentes.

A ideia central é simples:

> **A pessoa ou equipe fala com Jarvis. Jarvis administra a complexidade autorizada.**

Jarvis não é um modelo específico. Memória, continuidade, Perfil DNA, conhecimento, permissões, projetos, ferramentas e políticas pertencem ao sistema. Modelos locais ou externos são motores substituíveis.

A Sol é o primeiro perfil de alta profundidade — não o template obrigatório de todos os usuários.

## Por que existe

O projeto nasceu para resolver problemas que aparecem tanto na vida individual quanto em operações profissionais:

1. **fadiga de contexto** — não repetir história, decisões, processos e estado dos projetos;
2. **pensamento e trabalho ramificados** — preservar raiz, galhos, versões, pendências e prioridades;
3. **coordenação invisível de especialistas** — entregar capacidade de equipe sem obrigar o usuário a administrar vários agentes;
4. **independência tecnológica** — trocar modelos/provedores sem perder memória, identidade operacional e ferramentas;
5. **inteligência crescente** — acompanhar tecnologia, mercado, tendências, riscos e oportunidades relevantes;
6. **adaptação profunda** — cada pessoa, agência ou empresa possui objetivos, linguagem, ativos, regras, orçamento, métricas e permissões próprios.

## Como funciona

```text
PESSOA / EQUIPE / EMPRESA
          │
          ▼
     JARVIS — porta única
          │
          ▼
       JARVIS CORE
contexto + continuidade + políticas
          │
          ├── Tenant / Workspace / Projetos
          ├── Memória / Perfil DNA / Conhecimento
          ├── Objetivos / KPIs / Regras / Aprovações
          ├── Model Router
          ├── Skill Packs / Especialistas
          ├── Tool Router / Conectores
          ├── Capability & Domain Radar
          └── Execution Layer auditável
```

O Jarvis deve recuperar somente o contexto necessário, distinguir hipótese de decisão, preservar correções, indicar origem das fontes e nunca afirmar uma ação que não foi realmente executada.

## Personalização: o motor é comum, o Jarvis é de cada cliente

O produto deve permitir configurações muito diferentes sem criar um novo aplicativo para cada nicho.

Cada tenant/workspace pode ter:

- identidade, setor e estrutura próprios;
- objetivos, metas, KPIs e prioridades próprios;
- Perfil DNA e memória próprios;
- marcas/personas e tons de voz próprios;
- projetos e ativos próprios;
- Skill Packs adequados ao trabalho;
- conectores e fontes autorizados;
- políticas de risco/aprovação;
- orçamento e roteamento de modelos;
- Radar de mercado/tendências próprio;
- métricas e definição de sucesso próprias.

Exemplos:

- **indivíduo/creator:** segundo cérebro, conteúdo, negócios, rotina, ativos e monetização;
- **agência:** vários clientes isolados, campanhas, criativos, aprovações, métricas e margem por conta;
- **empresa:** departamentos, projetos, conhecimento institucional, vendas, operação, tecnologia, riscos e KPIs;
- **qualquer novo objetivo:** configurar contexto, dados, ferramentas, skills e critérios de sucesso sem fork do produto.

A arquitetura canônica está em [`docs/ARQUITETURA_MULTIUSUARIO_E_PERSONALIZACAO.md`](docs/ARQUITETURA_MULTIUSUARIO_E_PERSONALIZACAO.md).

## Capacidades principais

### Continuidade e anti-fadiga

- memória privada com autenticação;
- raiz/galhos/delta;
- decisões e correções versionadas;
- Perfil DNA corrigível;
- histórico do assistente separado de fatos do usuário/organização;
- retomada de projeto sem começar do zero;
- contexto em camadas para reduzir custo e repetição.

### Conhecimento e ativos

- biblioteca privada versionada;
- busca textual com proveniência;
- fontes de projetos, documentos e propriedade intelectual;
- integração GitHub em leitura para conhecimento selecionado;
- evolução para grafos de ativos, clientes, marcas, produtos e projetos por tenant.

### Especialistas / Skill Packs

O usuário não precisa escolher agentes para tarefas normais.

O Orquestrador pode combinar capacidades como:

- diretoria/estratégia;
- pesquisa e verificação;
- memória e continuidade;
- conteúdo/editorial;
- marketing/crescimento;
- audiovisual;
- tecnologia/engenharia;
- custos/finanças dentro das permissões;
- análise de risco e apoio jurídico-organizacional;
- operações;
- aprendizagem/professor;
- skills específicas do tenant.

As skills autorais e pessoais da Sol formam um **Sol Profile Pack**, não um padrão global.

### Voz e presença

- voz web em primeiro plano;
- frase escolhida no piloto: **“Jarvis, tá aí?”**;
- perfil de voz local atual do assistente: **Veludo**;
- cliente nativo iOS em desenvolvimento para mãos-livres, App Intent, Keychain, áudio e cérebro local Apple;
- câmera e análise de quadro sob comando;
- implementação de GPT-Live em branch para voz natural full-duplex, ainda sujeita a validação de Preview/aparelho real.

Voz, wake phrase, personalidade e canais devem poder ser configurados por tenant no produto comercial.

### Live / tempo real

A visão inclui:

- orientação privada no fone, como estrategista/diretor;
- leitura e agrupamento de perguntas quando plataformas permitirem;
- participação pública do Jarvis quando autorizada;
- separação rigorosa entre áudio privado e áudio público;
- uso equivalente em apresentações, reuniões, atendimento e outras situações ao vivo conforme o contexto do cliente.

### Inteligência crescente

- Capability Radar com fontes oficiais;
- Radar de domínio/mercado parametrizável por tenant;
- Loop contínuo tendência → ativo → resultado;
- testes de regressão;
- Preview antes de promoção;
- self-healing supervisionado: detectar → reproduzir → patch → testar → Preview → aprovação/política → rollback.

### Tendência → resultado

O Jarvis deve cruzar mudanças externas com os ativos e objetivos do tenant.

Para a Sol isso pode significar atenção → conteúdo → produto → receita. Para uma agência pode ser trend → clientes compatíveis → campanha → performance/margem. Para uma empresa pode ser sinal de mercado → ação → economia, receita, retenção ou qualidade.

A regra é: **o objetivo do cliente define o que “resultado” significa.**

## Multiusuário por arquitetura, não por clonagem

A operação comercial multi-tenant completa ainda está em desenvolvimento, mas o produto deve ser **tenant-aware desde a arquitetura**.

Requisitos obrigatórios:

- isolamento por tenant/workspace/cliente;
- papéis e permissões;
- memória pessoal, compartilhada, organizacional e de projeto separadas;
- conectores e segredos isolados;
- custo atribuído por tenant/projeto quando aplicável;
- auditoria de ações;
- exportação/restauração independentes;
- testes contra vazamento entre clientes;
- nenhuma conta nova herda dados, estilo ou objetivos da Sol.

## Estado atual

O projeto está em **beta de desenvolvimento**.

O piloto possui núcleo de memória, continuidade, biblioteca, Core read-only, segurança por usuário e testes. A PWA/web app é a interface atual, mas não representa ainda a plataforma multi-tenant comercial final.

O cliente nativo iOS já possui código para:

- App Intent;
- sessão `playAndRecord`;
- reconhecimento pt-BR;
- login por código;
- Keychain;
- contexto privado read-only;
- Apple Foundation Models quando disponível;
- resposta falada e retorno à escuta;
- autodiagnóstico;
- instalador guiado para Mac/Xcode.

**Ainda falta prova física no Mac/iPhone para classificar a experiência nativa mãos-livres como operacional.**

Consulte a matriz detalhada em [`docs/JARVIS_STATUS_CAPACIDADES.md`](docs/JARVIS_STATUS_CAPACIDADES.md).

## Segurança

Princípios obrigatórios:

- autenticação + RLS/controle de acesso;
- nenhum `service_role` no frontend;
- segredos de IA/OAuth no servidor/vault apropriado;
- sessão nativa no Keychain;
- modo público isolado de memória privada;
- voz não é autenticação única para ação sensível;
- fala de terceiros não vira memória automaticamente;
- publicação, gasto, exclusão e ações irreversíveis seguem política de autorização;
- falha de provedor não autoriza fallback pago silencioso;
- no multi-tenant, dados de um cliente não podem ser lidos, inferidos ou usados por outro.

## Modelos de IA

O Jarvis foi desenhado para não ficar preso a um único modelo.

Pode combinar:

- modelo local/on-device;
- modelo zero-cost verificado;
- modelos premium quando autorizados;
- motores especializados para voz, visão, código, vídeo ou outros domínios.

O `Model Router` deve considerar capacidade, privacidade, custo, latência, contexto, disponibilidade, benchmark e política do tenant.

A assinatura pessoal do ChatGPT não é uma API embutida no Jarvis. ChatGPT/Codex podem ser usados como oficina de desenvolvimento, enquanto o produto usa integrações próprias autorizadas.

## Desenvolvimento

```bash
npm install
npm test
npm run build
```

A Preview da Vercel executa contratos Node no `prebuild` antes de publicar.

Para o cliente nativo iOS, consulte:

- `ios/JarvisNative/README-INSTALAR.md`
- `ios/JarvisNative/PREPARAR-JARVIS.command`

## Documentação oficial

Comece por [`docs/JARVIS_INDICE_DOCUMENTACAO.md`](docs/JARVIS_INDICE_DOCUMENTACAO.md).

Documentos principais:

- [`docs/JARVIS_PRODUTO_E_VISAO.md`](docs/JARVIS_PRODUTO_E_VISAO.md) — propósito e visão;
- [`docs/ARQUITETURA_MULTIUSUARIO_E_PERSONALIZACAO.md`](docs/ARQUITETURA_MULTIUSUARIO_E_PERSONALIZACAO.md) — personalização, tenants, agências e empresas;
- [`docs/LOOP_CONTINUO_TENDENCIA_PARA_RECEITA.md`](docs/LOOP_CONTINUO_TENDENCIA_PARA_RECEITA.md) — radar de atenção, ativos e resultados;
- [`docs/JARVIS_MODO_DE_USO.md`](docs/JARVIS_MODO_DE_USO.md) — manual do usuário;
- [`docs/JARVIS_STATUS_CAPACIDADES.md`](docs/JARVIS_STATUS_CAPACIDADES.md) — o que está pronto e o que não está;
- [`docs/JARVIS_ARQUITETURA_GERAL.md`](docs/JARVIS_ARQUITETURA_GERAL.md) — arquitetura;
- [`docs/JARVIS_OPERACAO_E_MANUTENCAO.md`](docs/JARVIS_OPERACAO_E_MANUTENCAO.md) — runbook técnico;
- [`docs/CONTINUIDADE_JARVIS.md`](docs/CONTINUIDADE_JARVIS.md) — checkpoints e decisões de desenvolvimento.

## Regra de ouro

Toda nova capacidade deve reduzir trabalho mental ou operacional, preservar continuidade, respeitar o escopo correto e manter estado verificável.

**Jarvis não deve virar mais um sistema para o cliente administrar. Ele deve ser o sistema que ajuda o cliente a administrar a complexidade dele.**
