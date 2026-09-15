# Jarvis nativo no iPhone — instalação de prova

Esta pasta é a camada nativa do Jarvis. Ela não substitui o backend, o Supabase nem a PWA.

## O que esta prova precisa demonstrar

1. O app abre no iPhone e permite o acesso privado por código de e-mail uma única vez.
2. O diagnóstico mostra o estado de Microfone, Reconhecimento pt-BR, Cérebro local Apple, Sessão privada e Memória privada.
3. A ação de sistema **Iniciar conversa Jarvis** aparece no iPhone.
4. Depois de cadastrar o Atalho Vocal **Jarvis, tá aí?**, a frase aciona o app sem tocar na tela.
5. Jarvis diz **Tô aqui. Pode falar.**, escuta a próxima fala, recupera contexto privado, responde com o modelo local quando disponível e volta a ouvir.
6. **encerrar** finaliza a sessão.

## No Mac

Use `PREPARAR-JARVIS.command`. O script apenas prepara e testa o projeto. Ele não contém nem cria chaves de IA.

A última etapa — escolher sua equipe Apple, assinar e instalar no iPhone — precisa acontecer no Xcode com o aparelho conectado. Essa etapa não pode ser feita remotamente em seu nome.

## No iPhone, depois de instalado

Conceda Microfone e Reconhecimento de Fala quando o iOS pedir. Entre com o mesmo e-mail do Jarvis e o código recebido. Rode **Diagnóstico deste iPhone**.

Depois vá a **Ajustes > Acessibilidade > Atalhos Vocais**, adicione a frase **Jarvis, tá aí?** e associe à ação **Iniciar Jarvis / Iniciar conversa Jarvis**.

O funcionamento com aparelho bloqueado deve ser comprovado no aparelho real; não trate essa condição como validada antes do teste.
