# Checkpoint — Speaker ID local, convidado e aprendizado de fala — 24/09/2026

## Base

- Repositório canônico: `Sollimastudio/SOL-IA`
- Base deste delta: `main@2c1cda6ef9298b10f1200a97610ccfaa32861128`
- Branch: `work/speaker-id-local-fluid-20260924`
- Preview Vercel do delta completo: READY
- O Preview valida contratos Node/TypeScript/Vite; **não compila Swift nem prova o iPhone físico**.

## Implementado em código

### Speaker ID local

- Swift Package FluidAudio adicionado ao projeto nativo.
- Modelos CoreML são preparados localmente no iPhone.
- Cadastro da Sol: aproximadamente 8 segundos de fala, somente ela.
- O app extrai embedding de locutor local e o guarda no Keychain do próprio aparelho.
- Nenhum voiceprint é enviado ao Gemini.
- Classificação atual: `sol`, `guest`, `unknown`, `not_enrolled`.
- Thresholds iniciais são conservadores e só podem ser calibrados após teste real:
  - <= 0.35: candidato Sol;
  - >= 0.55: candidato guest;
  - faixa intermediária: unknown.

### Privacidade / convidado

- `consult_jarvis` falha fechado para qualquer locutor que não esteja classificado como `sol`.
- Outra voz mantém o Cofre bloqueado.
- Jarvis pede autorização da Sol para uma conversa genérica de convidado.
- Mesmo autorizado, convidado não recebe acesso à memória privada.
- Voz continua não sendo autenticação única para ações sensíveis.

### Aprendizado do jeito de falar

- Somente turnos recebidos enquanto o voiceprint está `.sol` alimentam o perfil.
- O módulo não armazena histórico bruto de frases.
- Guarda estatísticas agregadas: tamanho médio dos turnos, marcadores recorrentes, retomadas/autocorreções e frequência de pedidos diretos.
- O resumo entra nas instruções de sessões posteriores para acompanhar melhor a cadência da Sol.
- Há opção de zerar esse aprendizado local.

### Voz e ativação

- Gemini 3.8 Live continua como voz principal.
- TTS local permanece contingência, não default.
- Atalho Vocal/App Intent é o caminho de ativação à distância.
- Login continua reaproveitado pelo Keychain enquanto a sessão for renovável.
- Background audio continua configurado para sessões já iniciadas legitimamente.

## O que NÃO está comprovado

- Resolução/compilação do Swift Package FluidAudio pelo Xcode deste projeto.
- Build real do novo target nativo.
- Instalação dessa revisão no iPhone da Sol.
- Download/preparação dos modelos CoreML no aparelho.
- Precisão real do voiceprint da Sol.
- Taxas de falso positivo/falso negativo.
- Resistência a gravação/clone de voz.
- Wake word com tela bloqueada nesta revisão.
- Background real nesta revisão.
- Autorização de convidado em ambiente com duas pessoas reais.

## Próxima prova física obrigatória

1. Gerar projeto com XcodeGen e compilar sem assinatura.
2. Instalar no iPhone.
3. Confirmar sessão Keychain e permissão de Microfone.
4. Cadastrar voiceprint.
5. Testar Sol perto/longe, terceiro, sobreposição e reprodução de áudio.
6. Calibrar thresholds somente a partir desses resultados.
7. Testar “Jarvis, tá aí?” + Gemini Live + memória privada apenas para Sol.
8. Testar guest: pedido de autorização e Cofre bloqueado.
9. Testar tela bloqueada/background com sessão ativa.
10. Registrar evidência e só então mudar `speakerVerificationOperational` / `guestAuthorizationOperational` para true.

## Regra de continuidade

Não voltar a confundir:
- transcrição com identidade de locutor;
- código implementado com prova física;
- autorização de convidado com acesso ao Cofre;
- voiceprint com senha/autenticação única.
