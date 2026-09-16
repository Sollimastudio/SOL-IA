# Jarvis / Sol.IA — Modo de uso

> **Manual do usuário.** Este documento descreve como interagir com o Jarvis no dia a dia e diferencia claramente o que já funciona do que ainda depende de prova física ou integração externa.

## 1. Regra principal

Você não precisa aprender prompts, escolher agentes nem memorizar ferramentas. Fale com o Jarvis como falaria com um assessor que conhece seus projetos.

Exemplos simples:

- “Continue de onde paramos no Reposicione-se.”
- “Tive uma ideia. Guarda como hipótese, não como decisão.”
- “Isso mudou: agora a decisão correta é esta.”
- “Encontre nos meus materiais tudo que fala sobre fuga identitária.”
- “Transforme isso em roteiro de vídeo.”
- “O que ficou pendente deste projeto?”
- “Analise o que estou mostrando.”

O sistema deve resolver internamente qual memória, fonte, especialista ou ferramenta é necessária.

## 2. Conversa por texto

Na aba **CONVERSAR**, digite normalmente. Em modo privado, o sistema pode usar contexto e memória privados conforme as permissões ativas.

Use linguagem natural. Não é necessário escrever comandos técnicos.

### Quando quiser apenas explorar

Diga explicitamente:

> “Estou pensando em voz alta. Não trate isso como decisão.”

Isso ajuda o sistema a classificar a fala como exploração, não posição consolidada.

### Quando quiser consolidar algo

Use frases como:

> “Decisão: vamos seguir por este caminho.”

ou

> “Guarde isso como preferência.”

### Quando algo mudou

Diga:

> “Corrija a versão anterior. A posição atual é…”

O comportamento esperado é preservar histórico e considerar a versão nova como vigente, sem apagar a antiga.

## 3. Memória e continuidade

O Jarvis foi projetado para evitar que você precise repetir todo o contexto.

Ele separa:

- fala bruta;
- estado temporário;
- exploração;
- decisão;
- preferência;
- correção;
- fonte importada;
- resposta da própria IA.

### Comandos úteis

- “O que você lembra sobre este projeto?”
- “Qual foi a última decisão?”
- “O que mudou desde a última vez?”
- “Quais galhos estão abertos?”
- “Qual é a raiz deste assunto?”
- “Continue só do ponto novo, sem me repetir tudo.”

O sistema não deve transformar resposta da IA em fato sobre você nem material importado em memória pessoal automaticamente.

## 4. Conhecimento e documentos

A aba **CONHECIMENTO** é a biblioteca de fontes versionadas do Jarvis.

Ela serve para livros, mapas, documentos de projeto, materiais de negócio e outras fontes importadas.

Ao pedir uma análise, você pode dizer:

> “Use apenas minhas fontes do Reposicione-se.”

ou

> “Compare esta ideia com os documentos da trilogia.”

A biblioteca preserva origem e versão. Uma fonte pode estar importada sem estar validada como verdade factual.

## 5. Cofre

O **COFRE** guarda registros privados estruturados. Ele não é a mesma coisa que histórico visual do chat.

O objetivo é preservar informação importante de forma recuperável mesmo quando uma conversa termina.

Se houver falha de IA, o sistema pode registrar uma fala privada para não perder o conteúdo, mas deve informar com clareza quando houve apenas captura e não análise.

## 6. Voz — web atual

O web app possui reconhecimento de voz em primeiro plano e resposta falada local.

Na versão web, o microfone ainda precisa ser armado manualmente. Depois de autorizado, a frase de ativação é:

> **“Jarvis, tá aí?”**

Após a ativação, a sessão deve permanecer engajada até comando de encerramento; não é necessário repetir “Jarvis” em cada frase.

A resposta inicial prevista é:

> “Tô aqui. Pode falar.”

### Importante

A experiência web não é considerada solução definitiva de mãos-livres. Navegadores no iPhone têm limitações de microfone/background. O cliente nativo iOS foi criado justamente para resolver essa camada.

## 7. Voz — cliente nativo iPhone

O cliente nativo está implementado no branch atual, mas ainda precisa ser compilado no Xcode e instalado no aparelho real antes de ser considerado operacional.

Fluxo previsto:

1. configuração única no iPhone;
2. frase “Jarvis, tá aí?” associada à ação `Iniciar conversa Jarvis`;
3. Jarvis abre/aciona a sessão;
4. responde “Tô aqui. Pode falar.”;
5. você continua conversando normalmente;
6. Jarvis consulta contexto privado quando autenticado;
7. usa cérebro local Apple quando disponível;
8. fala a resposta;
9. volta a ouvir;
10. “encerrar” fecha a sessão.

O login nativo usa código por e-mail e guarda a sessão no Keychain. Chaves privadas de provedores de IA não devem entrar no iPhone.

## 8. Voz do Jarvis

A voz do assistente é diferente da voz pessoal da usuária.

O perfil atual se chama **Veludo** e busca uma voz masculina pt-BR, grave moderada e de cadência calma. No web app, a qualidade depende das vozes instaladas no aparelho.

A voz pessoal da usuária, quando houver tecnologia aprovada para isso, é reservada para criação de conteúdo mediante pedido explícito. Ela não deve ser usada como voz padrão do Jarvis nem como autenticação.

## 9. Câmera e videochamada

O web app possui câmera local e consegue capturar um quadro sob comando para análise.

Exemplos:

- “Jarvis, olha isso.”
- “O que você vê aqui?”
- “Analise este objeto/documento que estou mostrando.”

### Estado atual

Isso ainda não é visão contínua em streaming. O Jarvis analisa quadros quando solicitado. Uma chamada multimodal contínua, com interpretação permanente do vídeo, é evolução planejada.

## 10. Modo ambiente

O modo ambiente foi desenhado para capturar trechos temporários de uma conversa autorizada sem jogar automaticamente fala de terceiros no Cofre.

Comandos previstos/atuais no web app:

- “Jarvis, analisa a conversa.”
- “Jarvis, guarda a conversa.”
- “Jarvis, limpa a conversa.”

Guardar exige pedido explícito. Análise temporária não deve virar memória pessoal automaticamente.

## 11. Modo Performance

O **MODO PERFORMANCE** existe para situações em que o contexto privado não deve ser exposto.

Regra: o modo público não pode acessar silenciosamente o Cofre privado.

Use quando estiver produzindo algo que pode ser exibido, apresentado ou compartilhado sem carregar memória íntima para o contexto.

## 12. Live — visão de uso

O modo Live é requisito oficial, mas ainda não está operacional de ponta a ponta.

A experiência final prevê dois canais:

### “Jarvis, comigo” — orientação privada

Jarvis acompanha a situação e envia instruções curtas apenas para você, preferencialmente pelo fone.

Exemplos:

- “A pergunta central é outra; volte para X.”
- “Peça a fonte antes de responder.”
- “Há muitas perguntas repetindo o mesmo ponto.”
- “Esse dado precisa ser conferido.”

### “Jarvis, entra” — participação pública

Jarvis fala para a audiência como coapresentador autorizado.

### “Jarvis, volta comigo”

A próxima saída volta ao canal privado.

Esses comandos representam a experiência desejada; a mixagem pública/privada no mesmo iPhone e o acesso a chats de plataformas ainda precisam de prova real por plataforma.

## 13. Conteúdo e redes sociais

O objetivo é o Jarvis aprender com conteúdo e métricas das contas autorizadas.

Ele deverá distinguir:

- performance de conteúdo;
- retenção;
- temas;
- ganchos;
- duração;
- CTA;
- horário;
- resultado comercial;
- perguntas recorrentes do público.

Atualmente, integrações sociais completas ainda não estão conectadas ao Jarvis. Não presuma que Instagram, TikTok, Facebook ou YouTube estejam sendo monitorados só porque existe arquitetura para isso.

## 14. Comandos de controle recomendados

Use frases simples:

- “Continue.”
- “Pare.”
- “Encerrar.”
- “Não salve isso.”
- “Guarde isso.”
- “Isso é decisão.”
- “Isso é só hipótese.”
- “Corrija a versão anterior.”
- “Mostre só o que mudou.”
- “Volte para a raiz.”
- “Estacione esse assunto.”
- “Retome o galho X.”
- “Quero resposta curta.”
- “Quero análise profunda.”

## 15. O que fazer quando algo falhar

Não tente resolver tecnicamente sozinha.

Se o Jarvis não responder:

1. observe o status exibido;
2. não peça vários códigos de login em sequência;
3. não repita a mesma ação dez vezes;
4. registre o que aconteceu ou envie print;
5. o sistema de desenvolvimento deve localizar qual camada falhou: login, memória, modelo, microfone, câmera, conector ou plataforma.

O produto deve evoluir para mostrar isso em autodiagnóstico, em vez de exigir interpretação técnica da usuária.

## 16. Privacidade e autorização

- Microfone e câmera devem ter estado visível.
- Voz não é senha única para ação sensível.
- Fala de terceiros não vira memória automaticamente.
- Modo público não acessa Cofre privado.
- Publicação, gasto, exclusão e ações externas exigem política de autorização.
- Credenciais privadas ficam no servidor/Keychain apropriado, nunca em frontend público.

## 17. Regra de experiência

Se usar o Jarvis começar a exigir que você administre prompts, agentes, branches, chaves, APIs ou relatórios para tarefas normais, a experiência está errada.

**Seu papel é falar, decidir, corrigir e autorizar. A complexidade técnica pertence ao sistema.**
