# Jarvis — Arquitetura Multiusuário, Multiempresa e Personalização Profunda

> **Documento canônico de arquitetura de produto.** Registro inicial: 16/09/2026.
>
> Esta camada é **fundacional** para o produto, ainda que a operação comercial multiusuário completa permaneça em desenvolvimento. Ela não substitui o piloto da Sol, Anti-Fadiga, Perfil DNA, Cofre, Capability Radar, Loop Tendência → Receita, voz/live ou especialistas. Ela define como essas capacidades devem ser generalizadas sem transformar a configuração da Sol em padrão universal.

## 1. Decisão de produto

O Jarvis não deve ser construído como “o assistente da Sol que um dia ganha login para outras pessoas”.

Ele deve ser construído como uma **plataforma de inteligência adaptativa** capaz de se configurar profundamente para:

- indivíduos;
- creators;
- profissionais liberais;
- executivos;
- consultores;
- agências de marketing;
- equipes comerciais;
- empresas de qualquer porte;
- escritórios e prestadores de serviço;
- e-commerce;
- educação;
- tecnologia/software;
- operações internas;
- organizações com outros objetivos legítimos ainda não previstos.

A Sol é o **primeiro e mais profundo perfil piloto**. O que o produto aprende com ela valida a infraestrutura de continuidade, anti-fadiga, orquestração, memória, radar, monetização, voz, segurança e adaptação. Seus dados, estilo, projetos, rotinas e regras pessoais **não são defaults globais**.

Princípio:

> **O núcleo tecnológico é compartilhável. A identidade, os objetivos, os dados, as regras e a inteligência acumulada pertencem a cada cliente/workspace.**

---

## 2. Unidade de personalização

A arquitetura deve distinguir entidades diferentes em vez de usar apenas `user_id` para tudo.

### Tenant / Organização

É a fronteira comercial e de isolamento principal.

Pode representar:

- uma pessoa usando o Jarvis individualmente;
- uma agência;
- uma empresa;
- um escritório;
- uma equipe;
- outra organização contratante.

### Workspace

Contexto operacional dentro do tenant.

Exemplos:

- “Vida e negócios da Sol”;
- “Cliente A — lançamento”;
- “Cliente B — tráfego pago”;
- “Marketing Brasil”;
- “Produto X”;
- “Jurídico interno”;
- “Diretoria”.

Um tenant pode ter vários workspaces isolados ou parcialmente compartilhados conforme permissão.

### Usuário / Membro

Pessoa com acesso ao tenant ou workspace.

Deve possuir:

- identidade;
- cargo/função;
- permissões;
- preferências de interface;
- memória pessoal quando permitida;
- níveis de aprovação;
- canais/notificações próprios.

### Cliente / Conta atendida

Entidade especial útil para agências e consultorias.

Cada cliente deve poder possuir:

- marca própria;
- dados e arquivos próprios;
- canais próprios;
- tom de voz próprio;
- produtos/ofertas próprios;
- audiência própria;
- métricas próprias;
- histórico próprio;
- regras de publicação próprias.

Dados de um cliente nunca podem contaminar automaticamente outro.

### Projeto

Unidade de objetivo com estado, decisões, tarefas, fontes, métricas, ativos e histórico.

### Persona / Marca

Perfil de comunicação e presença usado em conteúdos, atendimento ou comunicação institucional.

Um tenant pode possuir múltiplas marcas/personas sem misturar identidades.

---

## 3. Personalização não é um prompt gigante

A personalização deve ser estruturada, versionada e corrigível.

Cada tenant/workspace pode configurar pelo menos dez camadas:

1. **Identidade e contexto** — quem é, setor, estrutura, público e histórico relevante.
2. **Objetivos** — metas, prioridades, KPIs, prazos e definição de sucesso.
3. **Modo de pensar/trabalhar** — nível de detalhe, cadência, formato de organização e anti-fadiga.
4. **Tom e presença** — voz institucional, comercial, editorial, social, suporte etc.
5. **Conhecimento e ativos** — documentos, produtos, serviços, projetos, propriedade intelectual e dados autorizados.
6. **Ferramentas e conectores** — apps, redes, CRM, arquivos, código, analytics, financeiro e outros serviços permitidos.
7. **Risco e aprovações** — o que pode ser feito automaticamente, o que exige revisão e o que é proibido.
8. **Orçamento tecnológico** — limites de uso, modelos permitidos, custo por tarefa, prioridades de privacidade/latência/qualidade.
9. **Radar e inteligência externa** — mercados, concorrentes, fontes, tendências e assuntos relevantes para aquele tenant.
10. **Saídas e rotina** — dashboards, alertas, relatórios, canais, frequência e grau de intervenção.

Nenhuma dessas camadas deve depender de a pessoa conhecer nomes de modelos, APIs ou agentes.

---

## 4. Perfil DNA genérico

O `Perfil DNA` deve evoluir de perfil pessoal da Sol para uma estrutura parametrizável.

Tipos possíveis de claim:

- objetivo;
- preferência;
- regra operacional;
- decisão;
- restrição;
- tom;
- público;
- marca;
- processo;
- política;
- KPI;
- tolerância a risco;
- orçamento;
- papel/cargo;
- necessidade de acessibilidade;
- formato de trabalho;
- preferência de comunicação.

Claims devem continuar versionados, rastreáveis e substituíveis, preservando supersessão e origem.

Uma inferência do modelo não pode virar regra permanente sem evidência ou confirmação compatível.

---

## 5. Hierarquia de memória

A memória precisa ter escopo explícito.

Escopos mínimos:

- **pessoal privada** — somente o usuário autorizado;
- **workspace** — compartilhada pelos membros autorizados daquele workspace;
- **projeto** — restrita ao projeto;
- **cliente** — restrita à conta atendida;
- **organização** — conhecimento institucional compartilhável;
- **pública/referência** — material intencionalmente disponível para saídas públicas.

Promoção entre escopos deve ser explícita ou governada por política clara.

Exemplo: uma anotação privada de uma colaboradora não deve virar “verdade da empresa” automaticamente.

---

## 6. Skill Packs: núcleo comum + especialização

O Jarvis deve ter um conjunto de capacidades-base reutilizável e pacotes especializados.

### Núcleo comum

Capacidades que podem servir a quase qualquer objetivo:

- Diretoria/coordenação executiva;
- pesquisa e verificação;
- memória e continuidade;
- organização de projetos;
- análise de risco;
- finanças/custos em nível permitido;
- tecnologia/engenharia;
- conteúdo e comunicação;
- análise de dados;
- operações;
- aprendizagem/professor;
- documentos;
- automações e integrações.

### Skill Packs por contexto

Exemplos:

- **Sol Profile Pack** — Relacione-se, Posicione-se/Reposicione-se, Magnetus, editorial, presença autoral, rotinas e regras pessoais autorizadas;
- **Agency Pack** — clientes, campanhas, calendário, social, criativos, mídia, relatórios, aprovação e rentabilidade por conta;
- **Company Executive Pack** — metas, projetos, reuniões, KPIs, riscos, decisões e coordenação interdepartamental;
- **Sales Pack** — CRM, leads, pipeline, propostas e follow-up;
- **Support Pack** — base de conhecimento, tickets e qualidade de atendimento;
- **Content Studio Pack** — pesquisa, roteiros, criação, edição, publicação e métricas;
- **Engineering Pack** — código, issues, deploys, logs, incidentes e documentação.

Packs são configurações/capacidades, não personagens que o usuário precisa administrar.

---

## 7. Modo agência

Uma agência precisa de um Jarvis diferente de um creator individual.

Arquitetura mínima:

```text
AGÊNCIA (tenant)
├── Operação interna
├── Cliente A
│   ├── marca
│   ├── canais
│   ├── campanhas
│   ├── ativos
│   ├── métricas
│   └── aprovações
├── Cliente B
└── Cliente C
```

Regras obrigatórias:

- não misturar arquivos, audiência, segredos ou métricas entre clientes;
- permitir playbooks/modelos reutilizáveis sem copiar dados confidenciais;
- permitir papéis: dono, estrategista, social media, tráfego, designer, atendimento, cliente aprovador etc.;
- custo e consumo mensuráveis por cliente/workspace;
- aprovação/publicação configurável por conta;
- histórico de quem decidiu, produziu, aprovou e publicou;
- Radar de tendências pode ser global, mas a relevância é calculada separadamente para cada cliente.

O Jarvis da agência deve conseguir responder, por exemplo:

> “Quais clientes têm oportunidade real com esta trend?”

sem transformar todos os clientes na mesma marca.

---

## 8. Modo empresa/equipe

Uma empresa pode usar Jarvis como camada de inteligência operacional.

Exemplos de objetivos:

- reduzir custo;
- aumentar receita;
- acompanhar metas;
- organizar conhecimento;
- melhorar atendimento;
- apoiar vendas;
- acelerar criação;
- coordenar projetos;
- detectar riscos;
- automatizar processos;
- pesquisar mercado;
- consolidar decisões;
- preparar reuniões e relatórios;
- detectar falhas técnicas/operacionais.

Departamentos podem compartilhar o mesmo tenant com fronteiras de acesso diferentes.

O Jarvis deve saber que “memória da empresa” é diferente de “memória pessoal do CEO”, e que “dados do RH” não são automaticamente acessíveis ao marketing.

---

## 9. Objetivo arbitrário, arquitetura estável

A potência do Jarvis não deve depender do ramo.

A entrada é sempre algo como:

```text
QUEM É ESTE TENANT?
→ O QUE ELE QUER?
→ QUAIS ATIVOS POSSUI?
→ QUAIS RESTRIÇÕES/PERMISSÕES EXISTEM?
→ QUAIS DADOS/FERRAMENTAS ESTÃO AUTORIZADOS?
→ COMO MEDIMOS RESULTADO?
```

A partir daí o Orquestrador escolhe capacidades, modelos, fontes e ferramentas adequados.

Isso permite novos casos de uso sem duplicar o produto inteiro.

---

## 10. Capability Radar por tenant

O Radar global acompanha tecnologia, APIs, segurança e capacidades da plataforma.

Cada tenant pode possuir também um **Radar de Domínio** configurável:

- mercado;
- concorrentes;
- tendências;
- regulamentação quando aplicável;
- comportamento de clientes;
- canais;
- preços;
- ferramentas;
- riscos;
- oportunidades.

O mesmo fato pode ser material para um tenant e irrelevante para outro.

O Jarvis deve evitar spam de alertas e informar apenas o que altera decisão, risco, custo, oportunidade ou resultado relevante para aquele contexto.

---

## 11. Loop Tendência → Resultado parametrizado

O ciclo `ESCANEAR → VALIDAR → CRUZAR COM ATIVOS → PRIORIZAR → EXECUTAR → MEDIR → APRENDER` não pertence só à Sol.

Ele deve aceitar objetivos diferentes:

- creator: atenção → audiência → oferta → venda;
- agência: trend → clientes compatíveis → campanha → performance/margem;
- e-commerce: demanda → produto/estoque → campanha → receita/margem;
- SaaS: problema → conteúdo/feature → trial → ativação → retenção;
- empresa B2B: sinal de mercado → lista/oportunidade → abordagem → pipeline;
- operação interna: anomalia → causa → melhoria → economia/qualidade.

O resultado a otimizar vem do objetivo do tenant, não de uma regra fixa de “viralizar”.

---

## 12. Model Router e orçamento por tenant

Cada tenant deve poder ter políticas diferentes de IA:

- modelos permitidos/proibidos;
- limite de gasto;
- prioridade por custo, qualidade, privacidade ou latência;
- uso local/on-device quando adequado;
- provedores próprios/BYOK no futuro quando seguro;
- limites por usuário/equipe/projeto;
- observabilidade por tarefa.

Um cliente barato não deve consumir silenciosamente a configuração premium de outro.

---

## 13. Segurança e isolamento

Multiusuário muda o padrão de segurança.

Requisitos mínimos:

- `tenant_id`/`workspace_id`/`owner_id` conforme o tipo de dado;
- RLS e autorização por papel/escopo;
- RBAC/ABAC onde necessário;
- segredos isolados por tenant/conector;
- trilha de auditoria;
- testes automáticos de vazamento entre tenants;
- nenhuma busca sem filtro de escopo;
- cache e embeddings também isolados;
- logs sem dados de outro cliente;
- exclusão/exportação/restauração por tenant;
- ações externas vinculadas ao tenant correto;
- aprovação compatível com papel e risco.

**Teste obrigatório:** uma conta de Tenant A não pode ler, inferir, pesquisar, resumir ou executar sobre dados de Tenant B, mesmo por prompt malicioso.

---

## 14. Agência/empresa não herda a Sol

A configuração do piloto Sol deve se tornar um `Sol Profile Pack` ou configuração equivalente.

Não são globais:

- histórias pessoais;
- linguagem da Sol;
- produtos da Sol;
- Relacione-se;
- Magnetus;
- livros;
- estilo comercial;
- preferências de voz;
- regras de rotina;
- metas financeiras;
- audiência;
- crenças/opiniões;
- repertório privado.

O que é global é a **capacidade tecnológica** de aprender essas coisas para cada cliente autorizado.

---

## 15. Onboarding inteligente

O onboarding não deve ser um formulário de 97 perguntas.

O Jarvis deve construir o perfil progressivamente, por conversa e conexão autorizada.

Capturar por etapas:

1. objetivo principal;
2. contexto/negócio;
3. projetos/ativos;
4. pessoas/equipe;
5. ferramentas;
6. riscos e limites;
7. orçamento;
8. estilo/saídas;
9. métricas de sucesso;
10. correções ao longo do uso.

O usuário pode começar pequeno; a inteligência aprofunda conforme o uso.

---

## 16. Autoengenharia: global x local

É preciso separar aprendizado do cliente de evolução da plataforma.

### Evolução local

- preferências;
- memória;
- regras;
- playbooks;
- aprendizado de performance;
- configurações daquele tenant.

### Evolução global do produto

- novo conector;
- modelo melhor;
- correção de bug;
- melhoria de segurança;
- novo motor de roteamento;
- nova capacidade reutilizável.

Dados privados de um tenant não podem treinar ou alterar silenciosamente o comportamento global para outros tenants.

Mudança global continua seguindo:

`descoberta → branch/sandbox → testes → benchmark → Preview → aprovação/política → promoção → rollback`.

---

## 17. Cobrança e unidade econômica

O produto comercial precisa medir custo real por tenant:

- tokens/modelos;
- voz;
- imagem/vídeo;
- armazenamento;
- buscas;
- conectores;
- workers/automações;
- largura de banda;
- recursos premium.

A cobrança pode futuramente combinar assinatura, franquia de uso e consumo, mas a arquitetura deve registrar custo antes de definir preço comercial definitivo.

Agências também podem precisar de custo/margem por cliente.

---

## 18. White-label e marca própria

Possibilidade futura, não requisito da primeira versão comercial:

- nome/branding do workspace;
- voz do assistente;
- identidade visual;
- domínio;
- packs de skills;
- relatórios com marca da agência/empresa.

White-label não pode enfraquecer auditoria, segurança ou isolamento.

---

## 19. Critérios de aceite multiusuário

A arquitetura só pode ser chamada de multiusuário comercialmente pronta quando houver prova de que:

- duas ou mais organizações coexistem sem vazamento de dados;
- membros do mesmo tenant possuem permissões distintas;
- uma agência gerencia clientes isolados;
- memória pessoal e organizacional não se confundem;
- Perfil DNA é específico por escopo;
- conectores/segredos são específicos por tenant;
- custo é atribuível;
- exportação/restauração funcionam por tenant;
- logs e buscas respeitam escopo;
- o Radar retorna relevância diferente conforme objetivo;
- Skill Packs podem variar sem fork do código;
- a configuração da Sol não aparece numa conta nova;
- ações externas respeitam aprovação/role;
- testes de ataque entre tenants passam.

Até isso acontecer, o status correto é **arquitetura multiusuário oficial / operação comercial multi-tenant ainda em desenvolvimento**.

---

## 20. Definição final

Jarvis deve ser uma **camada universal de inteligência operacional adaptativa**.

Para uma pessoa, pode ser segundo cérebro e assessor pessoal.

Para uma agência, pode ser diretoria operacional que conhece cada cliente sem misturá-los.

Para uma empresa, pode ser inteligência transversal que entende objetivos, departamentos, dados e processos dentro das permissões corretas.

Para um novo setor, o sistema não deve exigir outro produto: deve receber um novo perfil, objetivos, fontes, regras, skills e conectores.

> **O produto é o motor. Cada cliente constrói o próprio Jarvis sobre ele.**
