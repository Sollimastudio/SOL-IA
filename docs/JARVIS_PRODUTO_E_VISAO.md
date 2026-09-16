# Jarvis / Sol.IA — Produto, propósito e visão

> **Documento de produto.** Define por que o Jarvis existe, o problema que resolve, como deve se comportar e o que não deve se tornar.

## 1. O que é o Jarvis

Jarvis é a porta única de interação da Sol.IA: um **assistente pessoal e operacional com memória, continuidade, voz, visão, conhecimento privado, ferramentas e especialistas coordenados nos bastidores**.

Ele não é apenas um chatbot, não é um modelo de IA isolado e não é uma coleção de telas. O produto é a camada que conhece o estado do trabalho, recupera o contexto necessário, escolhe a capacidade adequada, executa ou propõe a próxima ação e continua depois sem obrigar a usuária a reconstruir tudo.

A experiência desejada é simples:

> **A usuária fala com Jarvis. Jarvis lida com a complexidade.**

Por trás dessa conversa podem existir modelos locais, modelos externos, banco de dados, arquivos, automações, conectores, ferramentas de código, pesquisa, redes sociais e especialistas. A usuária não deve precisar escolher manualmente qual agente, API ou sistema usar para uma tarefa comum.

## 2. Por que foi criado

O Jarvis foi criado para resolver um problema maior do que “obter respostas de IA”: **preservar continuidade cognitiva e operacional em uma vida e uma empresa com muitos projetos, ideias, ramificações, versões, decisões e fontes**.

O sistema deve reduzir a carga de:

- repetir contexto;
- lembrar onde um projeto parou;
- localizar a versão certa de uma decisão;
- separar ideia de decisão;
- organizar pensamentos ramificados sem destruir a espontaneidade;
- lembrar pendências sem transformar a pessoa em gerente do próprio assistente;
- alternar entre escrita, negócio, pesquisa, conteúdo, tecnologia, rotina e comunicação sem “resetar” a inteligência;
- acompanhar evolução de ferramentas e modelos sem reconstruir o produto a cada novidade;
- coordenar uma operação individual com qualidade de equipe.

A motivação central é **continuidade com autonomia**: o sistema deve ampliar a capacidade da usuária sem substituir seu julgamento ou tornar sua operação dependente de uma única empresa de IA.

## 3. Princípios de produto

### 3.1 Porta única

A interface principal é Jarvis. Especialistas existem como capacidades internas, não como personagens que exigem gerenciamento constante.

### 3.2 Anti-fadiga

Quando a usuária repete, muda de assunto, abre galhos ou retorna a um tema antigo, o Jarvis deve identificar o delta e preservar o fio. Repetição é sinal interno; não é motivo para bronca.

### 3.3 Estado não é identidade

Uma fala momentânea, hipótese, exploração ou estado transitório não deve virar automaticamente característica permanente da pessoa. O sistema separa fato relatado, decisão, preferência, correção, hipótese, sugestão de IA e material importado.

### 3.4 Memória corrigível

Memória não é um bloco imutável. Correções criam versões; a versão anterior permanece no histórico e deixa de ser recuperada como posição vigente quando é explicitamente substituída.

### 3.5 Fonte e proveniência

Documento importado não vira fato pessoal. Resposta da IA não vira decisão da usuária. Informação externa deve preservar origem quando isso importa para a tarefa.

### 3.6 Usuária como autoridade final

O Jarvis pode pesquisar, argumentar, alertar, comparar e propor. Decisões sensíveis, publicação, gasto, exclusão de dados e ações irreversíveis seguem políticas de autorização.

### 3.7 Modelos substituíveis

Jarvis não deve ser sinônimo de um único GPT, Astra, Gemini, Claude, modelo local ou fornecedor. O produto mantém memória, identidade operacional e ferramentas próprias; modelos são motores substituíveis por capacidade, custo, qualidade e latência.

### 3.8 Evolução verificável

“Evolutivo” significa detectar oportunidades, testar, comparar, versionar e promover melhorias por evidência. Não significa editar produção sozinho ou transformar toda novidade em dependência.

### 3.9 Verdade operacional

O sistema não pode afirmar que salvou, publicou, conectou, enviou ou executou algo sem confirmação. Estado desconhecido deve continuar sendo desconhecido.

### 3.10 Complexidade escondida

A engenharia fica nos bastidores. O produto deve pedir intervenção técnica da usuária apenas quando uma plataforma exige fisicamente autorização, login, biometria, assinatura de aplicativo ou outra ação que não pode ser delegada.

## 4. O que o Jarvis deve ser capaz de fazer

A visão completa inclui:

- conversar por texto e voz;
- ser chamado por voz em cliente nativo compatível;
- manter conversa contínua sem repetir a palavra de ativação a cada frase;
- lembrar decisões, correções, projetos e pendências;
- consultar biblioteca de livros, documentos, fontes e projetos;
- entender imagens e, progressivamente, vídeo/câmera em tempo real;
- operar como assessor durante lives, entrevistas e apresentações;
- ler comentários de plataformas quando APIs e permissões permitirem;
- orientar privadamente por fone ou participar publicamente com voz própria;
- acompanhar conteúdo e métricas das contas autorizadas;
- aprender padrões de resultado sem confundir correlação com causalidade;
- trabalhar com GitHub, Drive, Vercel, Supabase, automações e outros conectores autorizados;
- acompanhar evolução de IA, APIs e plataformas através de radar técnico;
- detectar falhas do próprio sistema e preparar correções em ambiente isolado;
- transformar pedidos de evolução em tarefas de engenharia rastreáveis;
- futuramente funcionar em arquitetura multiusuário com isolamento de dados.

## 5. Modos de presença

### Conversa privada

Usa memória e contexto privados. É o modo normal para trabalho, planejamento, criação e continuidade.

### Performance

Contexto público isolado do cofre privado. Serve para situações em que a saída pode ser compartilhada ou apresentada sem expor memória pessoal.

### Voz mãos-livres

Objetivo do cliente nativo iOS: a frase **“Jarvis, tá aí?”** aciona a sessão; Jarvis responde “Tô aqui. Pode falar.” e mantém a conversa até comando de encerramento. A implementação existe no branch atual, mas a prova física no iPhone ainda é obrigatória antes de classificar a experiência como operacional.

### Videochamada / visão

O web app já possui câmera e análise de quadro sob comando. Visão contínua em streaming e experiência equivalente a uma chamada multimodal completa ainda são evolução de produto.

### Live — orientação privada

Jarvis acompanha áudio/contexto/chat permitido e entrega orientação curta somente para a usuária, idealmente por fone. Esse canal não pode vazar para a mixagem pública.

### Live — participante público

Jarvis pode, no futuro, receber autorização para falar para a audiência como coapresentador. A arquitetura deve separar fisicamente/logicament​e áudio privado e público. O requisito está aceito; a prova no mesmo iPhone ainda não foi concluída.

## 6. Inteligência crescente

O Jarvis deve melhorar por:

- correções explícitas;
- decisões consolidadas;
- exemplos aprovados/rejeitados;
- resultados observados;
- novos conectores autorizados;
- benchmarks de modelos;
- testes de regressão;
- evolução de SDKs e APIs;
- Capability Radar.

O radar atual monitora um conjunto inicial de fontes oficiais de OpenAI, Meta, TikTok, Vercel e Supabase. A visão é ampliar esse radar globalmente, mas o estado atual não deve ser descrito como “monitoramento de tudo que existe em IA”.

## 7. O que o Jarvis não é

- Não é a assinatura pessoal do ChatGPT embutida em outro aplicativo.
- Não é um clone do Astra ou de qualquer modelo proprietário.
- Não é uma IA que pode ignorar regras do iOS, Meta, TikTok, Google ou outras plataformas.
- Não é um sistema que publica ou gasta silenciosamente.
- Não é um diagnóstico clínico ou um substituto de profissionais regulamentados.
- Não é um agente que deve editar produção sozinho sem gates.
- Não é um repositório de dados sem organização: memória precisa de tipo, fonte, versão e política.
- Não deve depender de a usuária reexplicar sua visão a cada nova conversa.

## 8. Arquitetura de propriedade

O ativo estratégico do Jarvis não é um modelo específico. É a camada que permanece quando o modelo muda:

- memória estruturada;
- continuidade;
- Perfil DNA corrigível;
- estado dos projetos;
- biblioteca e proveniência;
- políticas de segurança;
- roteamento de modelos e ferramentas;
- integrações;
- modos de voz/live;
- testes e histórico de evolução.

Isso permite usar modelos externos, locais ou open-weight sem entregar a identidade operacional do produto a um único fornecedor.

## 9. Visão comercial

A arquitetura é planejada para poder evoluir de assistente pessoal para produto multiusuário. Nesse cenário, cada cliente deve possuir:

- identidade e memória próprias;
- dados isolados;
- permissões próprias;
- conectores próprios;
- preferências e voz próprias;
- custos mensuráveis;
- exportação e recuperação independentes.

A configuração pessoal da Sol não deve ser clonada para clientes. O que pode ser produto é a **metodologia de continuidade, orquestração, segurança e adaptação**.

## 10. Critério de sucesso

O Jarvis cumpre sua proposta quando a usuária pode falar livremente durante dias ou meses e o sistema ainda sabe:

- qual era a raiz do assunto;
- quais galhos continuam abertos;
- o que mudou;
- o que já foi decidido;
- qual versão está vigente;
- quais fontes sustentam a resposta;
- o que está pendente;
- qual é a próxima ação útil;
- o que pode executar sozinho e o que precisa de autorização.

**O objetivo final não é ter mais uma IA para administrar. É ter uma inteligência que ajude a administrar o restante.**
