# Jarvis — Modo de uso

> Manual funcional. Atualizado em 16/09/2026 para distinguir o piloto Sol da experiência futura de outros indivíduos, agências e empresas.

## 1. A regra mais importante

O usuário não deve precisar saber qual modelo, agente, skill ou API usar.

Uso normal:

> **fale com Jarvis do seu jeito.**

Jarvis identifica intenção, escopo, projeto, contexto, ferramentas e especialistas necessários nos bastidores.

## 2. Escolha do contexto

No piloto atual existe uma única conta principal. No produto multiusuário, Jarvis precisa saber o contexto antes de agir.

Possíveis contextos:

- pessoal;
- empresa;
- workspace;
- cliente de agência;
- projeto;
- marca;
- modo público/performance.

Se houver ambiguidade que muda dados ou ação, Jarvis pergunta uma vez. Se o contexto já está claro pelo workspace/projeto, não repete pergunta inútil.

## 3. Conversa por texto

Exemplos individuais:

- “Organize o que eu preciso fazer hoje.”
- “Continue o projeto que paramos ontem.”
- “Tive uma ideia. Onde isso encaixa?”
- “Revise esse contrato e organize as dúvidas.”
- “O que estou pagando e não usando?”

Exemplos de agência:

- “Quais clientes têm algo urgente hoje?”
- “Essa trend combina com algum dos nossos clientes?”
- “Prepare as versões para o Cliente A sem misturar a marca do Cliente B.”
- “Quais campanhas precisam de atenção por custo?”

Exemplos de empresa:

- “O que mudou desde a última reunião do Projeto X?”
- “Quais riscos ameaçam a meta deste mês?”
- “Resuma os sinais de vendas e suporte.”
- “Qual processo está gerando retrabalho?”

A experiência é a mesma: uma porta, contextos diferentes.

## 4. Despejo de pensamento / captura livre

Jarvis deve aceitar entrada incompleta, ramificada ou longa sem exigir organização prévia.

A pessoa pode falar/escrever:

> “Tenho isso, aquilo, lembrei de outra coisa, esse cliente me preocupa, depois preciso voltar no produto...”

O sistema deve:

- identificar raiz/galhos;
- extrair delta;
- separar ideia/decisão/pendência;
- preservar assuntos abertos;
- não transformar hipótese em fato;
- retomar depois sem pedir tudo novamente.

No contexto de equipe, deve também preservar **a quem/qual projeto** a informação pertence.

## 5. Memória

Nem tudo que é dito deve virar memória permanente.

Escopos desejados:

- privado pessoal;
- workspace/equipe;
- projeto;
- cliente;
- organização;
- público/referência.

Quando alguém diz “guarde isso”, Jarvis deve salvar no escopo adequado ou pedir esclarecimento se compartilhar isso mudaria a privacidade.

Uma informação privada não é promovida para a empresa automaticamente.

## 6. Projetos e continuidade

Jarvis deve saber:

- objetivo;
- estado atual;
- decisões vigentes;
- correções;
- fontes;
- tarefas;
- pendências;
- responsáveis quando houver equipe;
- próxima ação útil.

Comando simples:

> “Continue de onde paramos.”

não deveria exigir que o usuário reconte o projeto.

## 7. Perfil DNA e personalização

Jarvis aprende por uso/correção:

- preferência de resposta;
- linguagem;
- formato de trabalho;
- objetivos;
- prioridades;
- tom de marca;
- regras;
- níveis de risco;
- métricas relevantes.

Essas regras são específicas do escopo.

### Sol

O perfil da Sol inclui suas próprias obras, estilo, produtos, rotina e preferências autorizadas.

### Agência

A agência pode ter um perfil operacional e cada cliente possuir Perfil de Marca/Objetivo separado.

### Empresa

A empresa pode ter Perfil Institucional, perfis de departamento e preferências pessoais separadas.

## 8. Skills

Jarvis possui especialistas internos, mas o usuário não precisa administrar o organograma.

Se uma pergunta exige pesquisa + jurídico + conteúdo + custos, o Orquestrador pode combinar essas capacidades.

Skills ficam disponíveis em detalhes/central para transparência e configuração, não como obrigação de navegação.

## 9. Voz

No piloto Sol existem duas linhas:

- voz web/local;
- implementação GPT-Live full-duplex no branch atualizado.

A experiência desejada é fala natural, interrupção e continuidade.

No produto comercial, voz/persona/wake phrase podem ser configuráveis por tenant quando tecnicamente suportados.

A sessão deve indicar microfone ativo e ter encerramento claro. Sessões pagas não devem ficar conectadas silenciosamente sem controles de custo.

## 10. Câmera e visão

Quando a câmera estiver ativa:

- mostrar indicação clara;
- analisar quadro/stream somente dentro da capacidade instalada;
- não confundir “preview da câmera” com “IA vendo continuamente”;
- respeitar escopo público/privado;
- não usar reconhecimento de identidade como autorização única.

## 11. Live / reunião / apresentação

Jarvis pode evoluir para dois canais:

### Privado

Orientação curta no ouvido/tela:

- “volte para a pergunta”;
- “essa objeção é importante”;
- “mostre o dado X”;
- “CTA agora”;
- “não responda sem confirmar o fato”.

### Público

Quando explicitamente autorizado, pode participar como coapresentador/assistente.

Privado e público precisam de rotas isoladas para impedir vazamento de informação.

O conceito também serve para reuniões, vendas, suporte e apresentações empresariais, não só lives de creator.

## 12. Radar de novidades

Jarvis deve acompanhar mudanças relevantes e evitar alertar por ruído.

Por padrão, avisar quando houver:

- mudança que afeta custo;
- risco/segurança;
- API/modelo/depreciação;
- oportunidade de ferramenta;
- mudança de plataforma;
- sinal de mercado material;
- tendência com alto encaixe;
- informação que muda uma decisão.

A relevância é calculada por tenant.

## 13. Tendência → Resultado

Usuário não precisa perguntar “como monetizo essa trend?” toda vez.

Jarvis cruza o sinal com:

- objetivos;
- ativos;
- público/mercado;
- capacidade;
- prazo;
- risco;
- métricas.

Para Sol pode resultar em conteúdo/produto/receita.

Para uma agência pode virar oportunidade para apenas dois de dez clientes.

Para uma empresa pode virar mudança de produto, vendas ou economia.

## 14. Agência: modo multi-cliente

Fluxo desejado:

1. entrar no tenant da agência;
2. Jarvis sabe quais clientes/workspaces existem;
3. escolher/entender contexto do cliente;
4. usar somente marca, ativos, métricas e conectores daquele cliente;
5. produzir/analisar;
6. seguir aprovação daquele cliente;
7. medir resultado sem contaminar outros.

Playbooks podem ser compartilhados; dados confidenciais não.

## 15. Empresa: equipes e papéis

Cada membro deve ver/fazer somente o permitido.

Exemplos:

- diretoria vê metas consolidadas;
- marketing opera canais autorizados;
- vendas usa CRM;
- engenharia vê repositórios/logs;
- cliente/aprovador vê apenas o necessário.

Jarvis nunca deve usar “ele está dentro da empresa” como justificativa para acesso universal.

## 16. Ações externas

Diferenciar:

- **analisar**;
- **rascunhar**;
- **preparar**;
- **executar**;
- **confirmar execução**.

Publicar, enviar, comprar, excluir, transferir, alterar produção ou executar outra ação sensível exige política/permissão apropriada.

Jarvis deve informar comprovante/estado real, não dizer “feito” por intenção.

## 17. Custos e assinaturas

Jarvis deve ajudar a decidir custo-benefício com base em:

- o que o tenant já paga;
- uso real;
- sobreposição;
- valor produzido;
- alternativa existente;
- custo novo;
- risco de lock-in;
- possibilidade de cancelar/substituir.

No multi-tenant, custo de modelos, voz, ferramentas e conectores deve ser atribuível ao tenant/projeto correto.

## 18. Quando algo dá errado

O usuário não deve virar suporte técnico do Jarvis.

O sistema deve tentar identificar camada da falha:

- sessão/permissão;
- conector;
- modelo;
- memória;
- transporte;
- frontend;
- voz;
- plataforma;
- custo/limite.

Quando conseguir, deve explicar em linguagem simples e preparar correção/teste em ambiente seguro.

## 19. O que muda entre clientes

Mudam:

- dados;
- objetivos;
- personalidade/voz;
- marcas;
- projetos;
- skills;
- integrações;
- orçamento;
- políticas;
- métricas;
- rotinas;
- alertas.

Permanece:

- Core;
- continuidade;
- anti-fadiga;
- proveniência;
- segurança;
- orquestração;
- capacidade de adaptação;
- disciplina de evidência.

## 20. Regra de experiência

**O cliente não se adapta ao Jarvis. O Jarvis se configura para o trabalho do cliente — sem perder segurança, verdade operacional e continuidade.**
