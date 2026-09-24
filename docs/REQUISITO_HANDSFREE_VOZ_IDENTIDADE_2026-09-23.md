# Requisito congelado — Jarvis hands-free, voz natural e identidade de locutor

Data: 23/09/2026  
Dona do requisito: Sol  
Repositório canônico: `Sollimastudio/SOL-IA`

## Objetivo

O Jarvis deve ser acionável à distância no iPhone e funcionar como assessor por voz natural, não como formulário falado.

A experiência-alvo é:

`“Jarvis, tá aí?” → iPhone aciona o app nativo → sessão privada existente é reaproveitada → Gemini Live abre → Jarvis responde em voz nativa → permanece ouvindo e aceitando interrupções → consulta memória/projetos quando necessário → encerra somente por comando/ação explícita ou condição de segurança.`

## Web e nativo têm papéis diferentes

### Web

O web app continua sendo painel, configuração, chat e prova rápida.

- Primeiro uso pode exigir login e autorização de microfone.
- Navegadores podem exigir gesto do usuário para iniciar captura/áudio.
- O botão principal de microfone deve abrir Gemini Live.
- A síntese local do navegador/aparelho NÃO é a voz principal; é contingência manual.
- O web app não promete wake word confiável com tela bloqueada.

### iPhone nativo

É o caminho principal para hands-free.

- Login por código deve ser configuração inicial; sessão persistida no Keychain é reutilizada enquanto válida.
- O Atalho Vocal “Jarvis, tá aí?” é a porta de ativação à distância.
- Depois de Microfone autorizado uma vez, o app não deve pedir seleção de motor/voz a cada ativação.
- Gemini 3.8 Live é o motor de voz padrão atual.
- A voz escolhida fica persistida localmente.
- Enquanto uma sessão de áudio já estiver ativa, `playAndRecord` + `UIBackgroundModes=audio` permitem continuidade em background/tela bloqueada dentro das regras do iOS.
- O sistema não promete iniciar microfone secretamente a partir de um app completamente frio/background se o iOS impedir.

## Voz natural

Critério obrigatório:

- áudio de resposta vem do Gemini Live, não de `AVSpeechSynthesizer` / `speechSynthesis` por padrão;
- aceita interrupção/barge-in;
- mantém sessão contínua;
- não exige “Jarvis” a cada turno;
- escolha de voz Gemini é real e persistida;
- nenhuma troca silenciosa para voz robótica caso Gemini falhe.

## Inteligência

`Modelo: none` não é resposta inteligente e não pode ser tratado como sucesso normal.

- Gemini 3.8 Flash é o cérebro de texto/contingência preferencial enquanto a chave Gemini estiver presente e o uso estiver permitido.
- Gemini Live pode usar `consult_jarvis` para recuperar contexto privado do Jarvis Core sem chamar um segundo modelo.
- Captura-only existe como airbag: salva fala quando nenhum modelo respondeu, mas deve se identificar claramente como contingência.

## Ambiente

Quando a sessão hands-free estiver ativa, o Jarvis pode ouvir o ambiente autorizado para manter o contexto da conversa.

Regras:

- ambiente não equivale automaticamente a memória;
- fala de terceiros não vira fato sobre a Sol;
- salvar conversa ambiente exige regra/consentimento explícito;
- microfone ativo deve ser visível no estado do app/sistema;
- encerramento deve interromper captura imediatamente.

## Identidade da Sol

Transcrição NÃO é reconhecimento de locutor.

O módulo real de Speaker ID / voiceprint já foi implementado em código no app nativo usando FluidAudio/CoreML local. O perfil da Sol é extraído no próprio iPhone e salvo no Keychain; não é enviado ao Gemini. **Isto ainda não autoriza chamar a capacidade de operacional:** faltam build Xcode e prova com a voz real da Sol e vozes de terceiros.

O comportamento-alvo — agora também contrato da implementação — é:

1. áudio chega;
2. speaker verifier classifica `sol`, `guest` ou `unknown` com confiança;
3. somente fala atribuída à Sol pode alimentar aprendizagem pessoal automática elegível;
4. convidado nunca herda identidade/permissões da Sol;
5. voz nunca é autenticação única para ação sensível.

## Outra pessoa chamando o Jarvis

Com Speaker ID operacional:

- se a Sol chamar, conversa normal;
- se outra pessoa chamar, o Jarvis não abre Cofre nem memória privada;
- ele pergunta à Sol, em canal apropriado: “Alguém quer falar comigo. Você autoriza?”;
- autorização cria contexto de convidado temporário;
- convidado não escreve memória como Sol;
- ao terminar, contexto temporário é descartado ou salvo somente conforme consentimento.

Enquanto o Speaker ID não estiver cadastrado, estiver incerto ou ainda não tiver sido validado fisicamente, a interface deve dizer **LOCUTOR NÃO VERIFICADO** (ou estado equivalente) e nunca fingir que sabe quem falou. Quando o verificador local classifica `guest`, o Cofre permanece bloqueado mesmo se a Sol autorizar uma conversa genérica.

## Aprender o jeito de falar da Sol

O objetivo não é só reconhecer timbre.

O Jarvis deve aprender, de exemplos atribuídos à Sol:

- vocabulário e expressões;
- forma de organizar pensamento;
- interrupções e retomadas;
- sarcasmo/humor;
- ritmo de fala;
- diferença entre voz privada, pública, editorial e comercial.

Aprendizagem deve ser versionada e corrigível. Fala de terceiros não entra nesse perfil.

A implementação nativa atual cria um perfil **agregado e local** somente a partir de transcrições recebidas enquanto o voiceprint está classificado como `sol`. O módulo contabiliza tamanho médio dos turnos, marcadores recorrentes, retomadas/autocorreções e frequência de pedidos diretos. Ele não mantém um histórico bruto das frases nesse perfil. O resumo é incorporado às instruções da sessão seguinte para ajudar o Jarvis a acompanhar a cadência da Sol sem caricaturá-la.

## Autoevolução / “Jarvis se programa”

Objetivo aceito: autodiagnóstico e autorreparo supervisionado.

Fluxo:

`detectar anomalia → registrar evidência → reproduzir → patch em branch → testes → Preview → comparação → promoção/rollback`

O Jarvis pode preparar correção sozinho. Não pode, sem gate adequado:

- gastar dinheiro;
- publicar externamente;
- alterar segurança;
- apagar dados;
- promover mudança arriscada à produção.

Sinais que o autodiagnóstico deve detectar:

- `modelUsed=none/capture-only` recorrente;
- Gemini Live indisponível;
- TTS local usado quando Live deveria estar ativo;
- falha de token efêmero;
- sessão que pede login repetidamente;
- perda de microfone/background;
- mudança/depreciação de modelo/API.

## Critérios de aceite físico

A capacidade hands-free só vira OPERACIONAL depois de prova no iPhone real:

- [ ] login feito uma vez e recuperado do Keychain;
- [ ] Microfone autorizado uma vez;
- [ ] “Jarvis, tá aí?” aciona sem tocar na tela;
- [ ] Gemini Live responde com voz nativa escolhida;
- [ ] segunda fala não exige repetir “Jarvis”;
- [ ] interrupção funciona;
- [ ] Jarvis consulta contexto privado quando necessário;
- [ ] `Modelo: none` não aparece no fluxo normal;
- [ ] background/tela bloqueada testados com sessão já ativa;
- [ ] “encerrar” fecha microfone;
- [ ] comportamento após ligação/alarme/interrupção de áudio é conhecido;
- [ ] Speaker ID testado separadamente antes de qualquer alegação de reconhecimento da Sol.

## Estado em 23/09/2026

Implementado em código:

- Gemini Live web com token efêmero;
- Gemini/OpenAI seletor web;
- Gemini é default;
- rota principal de microfone web redirecionada para Gemini Live;
- Gemini 3.8 Flash como caminho inteligente de chat quando habilitado;
- app nativo com Atalho Vocal/App Intent;
- sessão nativa em Keychain;
- background audio declarado;
- cliente Gemini Live nativo adicionado;
- Jarvis Core read-only disponível para `consult_jarvis`;
- health endpoint expõe estado sem segredos;
- testes de contrato hands-free.
- voiceprint local com FluidAudio/CoreML e armazenamento no Keychain;
- classificação `sol / guest / unknown` fail-closed;
- bloqueio de `consult_jarvis` para qualquer locutor não verificado como Sol;
- pedido de autorização da Sol quando outra voz é detectada.

Ainda não comprovado:

- build Xcode deste novo delta;
- instalação física deste novo delta;
- wake físico após atualização;
- background/tela bloqueada desta versão;
- build Xcode com FluidAudio/Swift Package;
- cadastro do voiceprint real da Sol no iPhone;
- medição e ajuste dos thresholds com Sol + vozes de terceiros;
- autorização de convidados baseada no Speaker ID validado.

**Regra:** não declarar reconhecimento da voz da Sol enquanto Speaker ID não existir e não for provado.
