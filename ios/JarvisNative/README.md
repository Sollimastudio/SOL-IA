# Jarvis Native iPhone Shell

Objetivo: manter o Jarvis web/backend atual e adicionar uma camada nativa iOS para ativação por voz, microfone contínuo e áudio em segundo plano.

## Ativação sem tocar na tela

O app expõe a ação `Iniciar conversa Jarvis` ao sistema pelo App Intents. No iPhone, configure uma única vez em Ajustes > Acessibilidade > Atalhos Vocais: escolha essa ação e ensine a frase `Jarvis, tá aí?`.

Depois disso, o iPhone reconhece a frase pelo recurso nativo de Atalhos Vocais e aciona o app. O Jarvis entra em sessão engajada, responde `Tô aqui. Pode falar.` e continua ouvindo até `encerrar`, sem exigir repetir o nome em cada frase.

## Segurança

Nenhuma chave de provedor entra no app iOS. A sessão continua passando pelo Jarvis web autenticado e pelo backend existente. A permissão de microfone e reconhecimento de fala é concedida pelo usuário no iPhone.

## Build

O projeto usa XcodeGen para evitar versionar arquivos `.xcodeproj` frágeis. No Mac:

1. Instale XcodeGen se ainda não existir.
2. Rode `cd ios/JarvisNative && xcodegen`.
3. Abra `JarvisNative.xcodeproj` no Xcode.
4. Selecione a equipe Apple em Signing & Capabilities.
5. Instale no iPhone e conceda Microfone e Reconhecimento de Fala uma única vez.
6. Configure o Atalho Vocal `Jarvis, tá aí?` para a ação `Iniciar conversa Jarvis`.

O comportamento com aparelho bloqueado deve ser validado no iPhone real; ações que exigirem desbloqueio seguem as regras de segurança do iOS. Quando uma sessão de áudio já está ativa, o app usa `playAndRecord` e background audio para poder continuar a conversa com a tela bloqueada.
