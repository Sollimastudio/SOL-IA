# Jarvis — cérebro crescente, autoatualização e inteligência de domínio

> Atualizado em 16/09/2026. O piloto Sol continua sendo a configuração mais profunda atual, mas esta arquitetura é parametrizável por tenant/workspace.

## Princípio

Jarvis não depende de um único provedor/modelo nem confunde o app ChatGPT com o próprio cérebro. O produto mantém memória, perfil, projetos, permissões, objetivos, continuidade e regras em infraestrutura própria. Modelos externos entram como motores substituíveis por tarefa.

A inteligência crescente deve funcionar para **qualquer contexto autorizado**: creator, agência, empresa, equipe, profissional ou outro objetivo legítimo.

## 1. Cérebro principal

Arquitetura por camadas:

- `Jarvis Core`: identidade operacional, escopo, contexto, anti-fadiga e políticas.
- `Tenant/Workspace Context`: organização, cliente, projeto, usuário e role corretos.
- `Model Router`: escolhe modelo/provedor por tarefa, política, custo, latência e capacidade.
- `Tool Router`: arquivos, web, código, CRM, calendário, redes, analytics e ferramentas autorizadas.
- `Memory/Knowledge/Assets`: memória, Perfil DNA, fontes versionadas, projetos e ativos.
- `Agent/Skill Orchestrator`: coordena especialistas sem exigir escolha manual.
- `Objective Engine`: objetivos, KPIs, prazos, riscos e critérios de sucesso do tenant.

A OpenAI pode ser um dos cérebros via API, mas não é a identidade do Jarvis. Chaves nunca vão para frontend público.

## 2. Uso de modelos e ferramentas

Modelos podem receber texto, imagem, arquivos e usar ferramentas permitidas. O sistema deve selecionar somente capacidades compatíveis com:

- tarefa;
- tenant/workspace;
- privacidade;
- orçamento;
- risco;
- latência;
- qualidade verificada.

Voz realtime, código, vídeo e outros domínios podem usar motores especializados sem quebrar a continuidade do Core.

## 3. Inteligência crescente

“Crescente” não significa modificar pesos do modelo ou transformar qualquer inferência em verdade.

Significa melhorar continuamente com evidência:

- lembrar correções e preferências do escopo correto;
- consolidar decisões;
- aprender padrões de resultado;
- aprender formatos/processos melhores para cada objetivo;
- aprimorar linguagem/voz/estilo por exemplos aprovados/rejeitados;
- detectar repetição causada pelo próprio Jarvis;
- testar novos modelos/ferramentas;
- comparar custo/latência/qualidade;
- promover somente melhorias que superem baseline e gates.

Aprendizado local de Tenant A **não altera silenciosamente** Tenant B.

## 4. Capability Radar global

> **Adendo canônico 25/09/2026:** o Radar agora deve ser comparativo e multifornnecedor, não apenas um monitor de novidades. Ler `RADAR_COMPARATIVO_MULTIFORNECEDOR_2026-09-25.md`. Toda mudança material de modelo/API deve comparar alternativas relevantes (incluindo OpenAI, Gemini, Anthropic e opções locais quando aplicáveis), estimar custo-benefício por tarefa e só então abrir benchmark/Opportunity Card. Nenhum fornecedor é promovido automaticamente.

O `Capability Radar` monitora fontes confiáveis relevantes para a plataforma:

- changelogs/documentação de provedores usados;
- releases de SDKs/dependências;
- novos modelos, limites, preços e depreciações;
- APIs sociais e integrações;
- segurança/vulnerabilidades;
- novas capacidades de voz, vídeo, agentes, modelos locais, automação e infraestrutura.

Fluxo:

1. coletar novidade;
2. validar evidência/frescor;
3. classificar impacto na plataforma;
4. registrar oportunidade/risco;
5. prototipar em branch/sandbox quando necessário;
6. rodar benchmark/testes;
7. promover somente após gates.

O Radar não altera produção sozinho e não cria custo ilimitado.

## 5. Radar de Domínio por tenant

Além do radar tecnológico global, cada tenant pode possuir radar próprio.

Exemplos:

- creator: redes, comportamento cultural, formatos, audiência e ofertas;
- agência: tendências, plataformas e oportunidades por cliente;
- e-commerce: categoria, demanda, preço, concorrência, estoque e canais;
- SaaS: mercado, concorrentes, comunidade, produto e tecnologia;
- empresa B2B: setor, clientes, vendas, riscos e concorrência;
- operação interna: custos, incidentes, gargalos, metas e qualidade.

O mesmo sinal externo pode ser urgente para um tenant e irrelevante para outro.

## 6. Social Intelligence Hub

Objetivo: conectar contas autorizadas e aprender com comportamento agregado/performance sem exceder permissões.

Conectores previstos podem incluir Instagram profissional, Facebook Pages, TikTok, YouTube e outras plataformas oficiais.

Para agências:

- várias contas podem coexistir;
- cada cliente precisa de identidade/credenciais/dados isolados;
- métricas e recomendações permanecem associadas ao cliente correto;
- um playbook pode ser reutilizado sem vazar dados.

Nenhum conector presume acesso a conta/recurso que a API não expõe.

## 7. Objective & Audience Strategy Engine

A camada antiga de “audiência” é generalizada para um motor de objetivo.

Pode receber critérios como:

- público desejado;
- mercado/região;
- oferta/preço;
- objetivo da campanha;
- meta de vendas;
- retenção;
- geração de leads;
- produtividade;
- economia;
- qualidade;
- risco;
- prazo;
- KPI específico.

Evitar inferir características sensíveis de indivíduos. Estratégia deve trabalhar com dados agregados, consentidos e segmentações permitidas.

## 8. Loop de aprendizagem

Para qualquer experimento/ação relevante:

1. registrar hipótese e objetivo;
2. registrar versão executada/publicada;
3. coletar métricas permitidas;
4. normalizar contexto;
5. comparar com baseline;
6. relacionar resultado a fatores observáveis;
7. atualizar recomendações com nível de confiança;
8. não transformar correlação em causalidade sem evidência adequada.

A função de sucesso depende do tenant.

Exemplos:

- conteúdo → retenção/lead/venda;
- campanha → CAC/ROAS/margem;
- suporte → resolução/satisfação;
- engenharia → incidentes/latência;
- operação → tempo/custo/erro;
- vendas → pipeline/conversão.

## 9. Personalization Engine

A personalização é uma capacidade estrutural.

Perfis possíveis por tenant:

- pessoal/privado;
- marca;
- editorial;
- institucional;
- comercial;
- atendimento;
- performance/live;
- departamentos;
- projetos;
- clientes de agência.

Cada perfil pode aprender, de forma versionada e corrigível:

- linguagem;
- exemplos aprovados/rejeitados;
- objetivos;
- regras;
- formatos;
- tolerância a risco;
- preferências de resposta;
- voz/presença;
- canais;
- métricas relevantes.

### Sol Profile Pack

A Sol permanece como primeiro perfil profundo. Seus jargões, livros, produtos, história, estilo, metas e rotinas pertencem ao tenant dela e não devem aparecer em contas novas.

## 10. Loop Tendência → Ativo → Resultado

O radar de atenção é parametrizado pelo objetivo do tenant.

Fluxo:

`ESCANEAR → VALIDAR → CRUZAR COM OBJETIVOS/ATIVOS → PRIORIZAR → PRODUZIR/AGIR → MEDIR → APRENDER`

Para a Sol, isso pode gerar conteúdo/autoridade/receita. Para uma agência, pode indicar quais clientes combinam com a tendência. Para uma empresa, pode virar decisão de produto, economia ou oportunidade comercial.

Ver `LOOP_CONTINUO_TENDENCIA_PARA_RECEITA.md`.

## 11. Relatórios sob demanda

Jarvis não deve despejar relatórios sem necessidade. Por padrão, conduz silenciosamente e informa quando algo muda decisão, risco, custo ou oportunidade.

Relatórios podem variar por role:

- executivo: KPIs, risco, caixa, prioridades;
- agência: clientes, performance e margem;
- marketing: conteúdo/campanhas;
- engenharia: saúde técnica;
- individual: projetos/loops;
- plataforma: tecnologia/modelos/custos.

## 12. Roadmap arquitetural

A ordem de implementação separa **fundamento multi-tenant** de **lançamento comercial multi-tenant**.

### P0/P1 — desde agora

- todo novo desenho deve ser tenant-aware;
- Perfil DNA e skills não podem hardcodar Sol;
- interfaces devem esconder complexidade;
- memória/continuidade permanecem com escopo;
- Capability Radar continua expandindo;
- voz/realtime e conectores entram com gates;
- testes devem preservar isolamento atual e preparar isolamento futuro.

### P2

- execução externa aprovada;
- integrações sociais/operacionais mais completas;
- self-healing supervisionado;
- Skill Packs parametrizáveis;
- workspaces/clientes/roles na interface.

### P3 — comercialização multi-tenant

- criação de múltiplas organizações reais;
- RBAC/ABAC e isolamento comprovado;
- billing/metering;
- exportação/restauração por tenant;
- agência multi-cliente;
- onboarding adaptativo;
- testes adversariais cross-tenant.

Ou seja: **multiusuário comercial pode ser P3; pensar multiusuário não pode esperar até P3.**

## Regra de ouro

A pessoa/equipe fala com Jarvis. A complexidade acontece atrás dele.

Todo novo recurso deve responder:

> isso reduz trabalho mental/operacional e melhora o objetivo daquele tenant, ou apenas adiciona mais uma tela, bot ou ferramenta para ele administrar?
