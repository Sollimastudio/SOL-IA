# Arquitetura de Skills e Interfaces — Jarvis

> Atualizado em 16/09/2026. Este documento substitui a leitura antiga de que as skills da Sol seriam o organograma universal do produto.

## Decisão executiva

Jarvis deve ter **uma porta principal simples** e uma arquitetura interna rica de capacidades.

O usuário normal não deve precisar escolher agente, modelo ou departamento para fazer uma pergunta comum. Skills são competências orquestradas nos bastidores.

A interface pode expor Central, detalhes, departamentos e configurações quando isso for útil, mas a experiência padrão permanece:

> **fale com Jarvis → Jarvis escolhe as capacidades necessárias → entrega/coordena o resultado.**

## 1. Três camadas de skills

### Camada A — Core Skills globais

Capacidades reutilizáveis para praticamente qualquer tenant:

1. **Executive / Diretoria** — entende intenção, organiza prioridades, coordena capacidades e entrega próxima ação útil.
2. **Research & Evidence** — pesquisa, verifica fontes, separa fato/hipótese e mantém proveniência.
3. **Vault & Continuity** — memória, decisões, versões, projetos, raiz/galhos e recuperação de contexto.
4. **Risk & Governance** — riscos, contratos/documentos, permissões, compliance e alertas; não substitui profissionais regulamentados.
5. **Finance & Cost Intelligence** — custos, assinaturas, orçamento, caixa e cenários a partir de dados autorizados; não inventa saldos.
6. **Growth & Marketing** — mercado, audiência, conteúdo, aquisição, campanhas, funis, experimentos e métricas.
7. **Editorial & Communication** — documentos, copy, escrita, revisão, apresentações e comunicação institucional.
8. **Motion / Audiovisual** — roteiro, direção, edição, B-roll, imagem, vídeo, voz e prompts para ferramentas criativas.
9. **Technology & Engineering** — código, infraestrutura, logs, APIs, integrações, testes, deploys e self-healing supervisionado.
10. **Operations** — processos, projetos, rotinas, tarefas, reuniões, produtividade e automações.
11. **Learning / Teacher** — explicar, ensinar, estruturar estudo, treinamento interno e documentação.
12. **Data & Analytics** — métricas, comparação, atribuição, relatórios e aprendizado por evidência.

Essas categorias são capacidades, não uma lista fixa de personagens.

## 2. Skill Packs por tenant

Cada tenant/workspace pode habilitar pacotes especializados.

### Sol Profile Pack

Configuração do primeiro piloto profundo. Pode incluir:

- Relacione-se;
- Método Posicione-se / Reposicione-se;
- Magnetus e produtos autorais;
- Publisher editorial autoral;
- Presença Sol;
- Audience/Growth da Sol;
- rotinas e modos pessoais autorizados;
- Guardião de decisões sensíveis;
- protocolos de conteúdo/live específicos.

Nada disso deve aparecer automaticamente numa conta de outro cliente.

### Agency Pack

Para agências/consultorias:

- múltiplos clientes isolados;
- brand profiles;
- conteúdo/social;
- tráfego/mídia;
- calendário;
- criação;
- aprovação;
- relatórios;
- rentabilidade/custo por cliente;
- playbooks compartilháveis sem compartilhar dados confidenciais.

### Company Pack

Para empresas/equipes:

- diretoria e KPIs;
- projetos;
- reuniões/decisões;
- operações;
- vendas;
- marketing;
- suporte;
- tecnologia;
- conhecimento institucional;
- papéis e aprovação interdepartamental.

### Packs verticais

O produto pode ganhar packs para setores quando fizer sentido, sem criar forks do núcleo.

Exemplos: e-commerce, SaaS, educação, imobiliário, consultoria, atendimento, produção de conteúdo, operações internas.

Um pack define ferramentas, vocabulário, processos e templates. **Dados do cliente continuam no tenant.**

## 3. Skills adaptativas

O conjunto de skills ativo deve ser definido por:

- objetivo do tenant;
- projeto atual;
- papel do usuário;
- dados/fontes disponíveis;
- integrações autorizadas;
- risco;
- orçamento;
- contexto da conversa;
- capacidade técnica instalada.

Exemplo:

Uma frase “me ajude a vender mais” pode exigir combinações diferentes:

- creator → conteúdo + oferta + audiência;
- agência → conta do cliente + criativo + mídia + margem;
- SaaS → aquisição + ativação + retenção;
- loja → estoque + campanha + ticket + margem;
- B2B → ICP + pipeline + abordagem + CRM.

O roteador não deve tratar todas como a mesma tarefa.

## 4. Interface principal — Jarvis

A experiência prioritária é a conversa única.

Componentes desejados:

- estado real: disponível / ouvindo / trabalhando / aguardando aprovação;
- entrada por texto;
- voz;
- anexos;
- câmera/live quando aplicável;
- uma recomendação principal por vez;
- acesso a memória/fontes/projetos sem obrigar navegação técnica;
- comprovante de ação quando houver execução.

Uma Central pode mostrar:

- projetos;
- workspaces/clientes;
- fontes;
- memória;
- skills;
- integrações;
- tarefas;
- relatórios;
- custos;
- permissões;
- saúde técnica.

Mas o usuário não deve precisar navegar pela Central para tarefas cotidianas.

## 5. Interface por papel

A mesma plataforma pode apresentar superfícies diferentes conforme o papel.

Exemplos:

- **dono/executivo:** metas, risco, caixa, prioridades e resultados;
- **social media:** pauta, produção, calendário, comentários e métricas;
- **tráfego:** campanhas, criativos, orçamento e performance;
- **vendas:** leads, pipeline, follow-up e propostas;
- **engenharia:** issues, deploys, logs e incidentes;
- **cliente de agência:** aprovação e resultados, sem acesso ao bastidor de outros clientes.

Isso é UI adaptativa sobre o mesmo Core, não produtos concorrentes.

## 6. Modos de contexto

Modos também são parametrizáveis.

### Privado pessoal

Pode acessar a memória pessoal autorizada.

### Workspace / equipe

Acessa somente conhecimento compartilhado/permitido no workspace.

### Público / Performance

Impede vazamento de memória privada em live, conteúdo, apresentação ou atendimento público.

### Foco / execução

Pode reduzir explicações e priorizar uma próxima ação.

### Captura / despejo

Registra ideias/entradas com baixa fricção e classifica depois.

### Modos específicos do tenant

Exemplo Sol: “3 da manhã” pode existir como configuração pessoal dela, mas não é requisito global.

## 7. Risco e aprovação por skill

Toda skill deve declarar:

- dados que pode ler;
- ferramentas que pode usar;
- ações que pode executar;
- risco da ação;
- necessidade de confirmação;
- custo potencial;
- logs/comprovantes esperados.

Uma skill de conteúdo pode criar rascunho livremente, mas publicar pode exigir aprovação.

Uma skill financeira pode analisar transações autorizadas, mas transferência/pagamento exige controles compatíveis.

Uma skill de engenharia pode preparar patch e Preview; produção segue gates.

## 8. Prompt Autopilot

Engenharia de prompt é infraestrutura invisível.

O sistema deve montar internamente instruções adequadas à:

- tarefa;
- skill;
- tenant;
- persona/marca;
- política;
- modelo escolhido;
- ferramenta;
- evidência disponível.

Não pedir ao usuário para ser “engenheiro de prompt” para conseguir qualidade.

## 9. Skills e multiusuário

Toda skill deve ser `tenant-aware`.

Ela nunca recebe “todo o banco”. Recebe somente o contexto autorizado para:

`tenant → workspace → cliente/projeto → usuário/role → tarefa`.

A própria skill não deve poder atravessar essa fronteira por uma instrução do modelo.

## 10. Regra de produto

**A potência do Jarvis está na combinação dinâmica de capacidades, não no número de botões.**

A plataforma pode ter dezenas de especialistas internos e ainda oferecer ao usuário uma experiência de uma única conversa.

A Sol não administra dez agentes. Uma agência não administra cinquenta bots por cliente. Uma empresa não precisa escolher qual LLM responde cada departamento.

**Jarvis coordena o organograma invisível.**
