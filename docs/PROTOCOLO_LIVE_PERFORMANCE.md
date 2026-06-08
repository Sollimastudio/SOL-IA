# Protocolo Live Performance — Sol.IA

## Objetivo

Permitir que Sol chame a Sol.IA durante lives, stories, aulas, gravacoes e transmissoes, para que a IA responda em voz audivel e possa ser ouvida pelo publico.

## Possibilidade

Sim, e possivel fazer a Sol.IA responder durante uma live, desde que o audio de saida da Sol.IA seja roteado para a transmissao.

## Modos de uso

### 1. Modo Simples — Celular/Notebook no ambiente

Sol abre a Sol.IA em um aparelho, aperta o botao de escuta, fala e a Sol.IA responde em voz alta pelo alto-falante.

A live capta o som pelo microfone do celular/camera.

Vantagens:
- simples
- rapido para demonstracao
- nao precisa OBS

Limites:
- pode ter eco
- qualidade de audio menor
- depende do microfone captar bem

### 2. Modo Profissional — OBS/StreamYard/Restream

A Sol.IA roda no computador e a saida de audio dela entra como fonte de audio da live.

Fluxo:
Sol chama a IA -> microfone captura -> Sol.IA transcreve -> IA responde -> TTS gera voz -> audio virtual entra no OBS -> publico ouve.

Ferramentas possiveis:
- OBS Studio
- BlackHole ou Loopback no Mac
- VB-Cable no Windows
- StreamYard ou Restream com entrada de audio configurada

Vantagens:
- audio profissional
- controle de volume
- menos eco
- melhor para vendas e demonstracao publica

Limites:
- configuracao tecnica inicial
- precisa testar antes da live

### 3. Modo Assistente de Cena

A Sol.IA nao fica falando o tempo todo. Ela so entra quando Sol chama.

Comandos possiveis:
- Sol, responde isso.
- Sol, guarda essa ideia.
- Sol, transforma isso em frase.
- Sol, me da um gancho.
- Sol, explica para o publico.

## Regras de seguranca e privacidade

A Sol.IA nunca deve expor:
- dados intimos
- traumas sensiveis sem comando explicito
- informacoes privadas de familia
- chaves, links internos ou dados tecnicos
- bastidores financeiros ou terapeuticos

Em publico, a Sol.IA deve usar Modo Performance:
- resposta curta
- tom seguro
- linguagem magnética
- sem excesso de detalhes
- sem revelar memorias privadas

## Respostas em publico

A Sol.IA deve responder como uma assistente premium, nao como terapeuta improvisada.

Formato ideal:
1. responder a pergunta
2. gerar impacto
3. conectar com a marca Relacione-se
4. se cabivel, chamar para oferta/teste/conteudo

## Modulo tecnico necessario

Para funcionar de ponta a ponta, faltam:
- captura de voz ligada na interface
- transcricao
- chamada ao modelo de IA
- resposta curta em modo performance
- TTS para transformar texto em voz
- controle de audio de saida
- integracao opcional com OBS/audio virtual

## Status

A Sol.IA oficial ja tem o inicio do modulo de captura de voz em src/core/voiceCapture.ts.

Ainda falta:
- botao de voz na interface
- resposta por TTS
- modo performance ligado ao prompt
- roteamento de audio para live

## Posicionamento comercial

Demonstrar a Sol.IA respondendo ao vivo pode virar uma vitrine poderosa.

Promessa de venda:
"Uma IA que nao depende do seu prompt perfeito. Ela entende sua intencao, organiza seu caos e responde em tempo real."
