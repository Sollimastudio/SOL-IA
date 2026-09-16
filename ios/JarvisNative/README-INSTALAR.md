# Jarvis nativo no iPhone — instalação e autorização da prova

Esta pasta é a camada nativa do Jarvis. Ela não substitui o backend, o Supabase nem a PWA.

## O que esta prova precisa demonstrar

1. O app abre no iPhone e permite o acesso privado por código de e-mail uma única vez.
2. O diagnóstico mostra o estado de Microfone, Reconhecimento pt-BR, Cérebro local Apple, Sessão privada e Memória privada.
3. A ação de sistema **Iniciar conversa Jarvis** aparece no iPhone.
4. Depois de cadastrar o Atalho Vocal **Jarvis, tá aí?**, a frase aciona o app sem tocar na tela.
5. Jarvis diz **Tô aqui. Pode falar.**, escuta a próxima fala, recupera contexto privado, responde com o modelo local quando disponível e volta a ouvir.
6. **encerrar** finaliza a sessão.
7. Tela bloqueada/background é um teste separado; só passa a ser considerado operacional depois de prova física.

## Estado antes de mexer no iPhone

O código do app nativo, a autenticação, Keychain, áudio `playAndRecord`, reconhecimento pt-BR, App Intent, contexto privado read-only, cérebro local Apple quando disponível e diagnóstico já existem no projeto.

A etapa abaixo é deliberadamente física. O sistema não deve fingir que o iPhone foi autorizado, assinado ou instalado sem a confirmação real do Mac/iPhone.

---

## Etapa A — preparar o Mac

1. Abra o Xcode pelo menos uma vez.
2. Aceite termos/licenças e deixe o Xcode concluir a instalação dos componentes solicitados.
3. Na pasta `ios/JarvisNative`, execute `PREPARAR-JARVIS.command`.
4. O script:
   - verifica Xcode;
   - instala/solicita XcodeGen quando necessário;
   - gera `JarvisNative.xcodeproj`;
   - compila uma prova para o SDK do iPhone Simulator sem assinatura;
   - só abre o Xcode se essa compilação passar.
5. Se o script falhar, **não tente instalar ainda**. Use `/tmp/jarvis-native-build.log` para corrigir o erro antes da assinatura.

Nenhuma chave privada de IA é criada ou colocada no app por esse processo.

---

## Etapa B — conectar e autorizar o iPhone no Mac/Xcode

1. Conecte o iPhone ao Mac com cabo.
2. Desbloqueie o iPhone.
3. Se aparecer **Confiar Neste Computador?**, toque em **Confiar** e informe o código do iPhone.
4. No Xcode, abra o Device Hub/Devices and Simulators e confirme que o iPhone aparece como dispositivo disponível/pareado. Se aparecer **Pair**, conclua o pareamento.
5. No Xcode, abra **Settings > Accounts / Apple Accounts** e confirme que sua Apple Account está adicionada.
6. Abra o projeto `JarvisNative.xcodeproj`.
7. Selecione o target **JarvisNative** e abra **Signing & Capabilities**.
8. Deixe **Automatically manage signing** habilitado.
9. Em **Team**, selecione sua equipe/Apple Account.
10. Na barra superior do Xcode, escolha o **seu iPhone físico** como destino de execução, não um Simulator.

Com assinatura automática, o Xcode registra o dispositivo e cria o perfil de desenvolvimento necessário quando a conta e o aparelho permitem.

---

## Etapa C — ativar Modo Desenvolvedor no iPhone

A Apple exige **Developer Mode / Modo Desenvolvedor** para executar no aparelho um app instalado localmente pelo Xcode.

1. Primeiro inicie o pareamento/tentativa de execução pelo Xcode. Em alguns aparelhos, a opção Modo Desenvolvedor só aparece depois disso.
2. No iPhone, vá a **Ajustes > Privacidade e Segurança > Modo Desenvolvedor**.
3. Ative **Modo Desenvolvedor**.
4. Confirme **Reiniciar**.
5. Depois que o iPhone reiniciar e for desbloqueado, confirme novamente **Ativar** e informe o código do aparelho quando solicitado.

Se a opção ainda não aparecer, volte ao Xcode com o iPhone conectado e confirme o pareamento/seleção do aparelho.

---

## Etapa D — assinar, instalar e abrir o Jarvis

1. Volte ao Xcode.
2. Confirme:
   - target `JarvisNative`;
   - seu iPhone como destino;
   - sua Team em **Signing & Capabilities**;
   - assinatura automática sem erro vermelho.
3. Clique em **Run ▶**.
4. Aguarde o Xcode compilar, assinar e instalar o **Jarvis** no iPhone.
5. Abra o Jarvis pelo próprio Xcode ou pelo ícone que aparecer no iPhone.
6. Se o iPhone apresentar alguma solicitação adicional de confiança/verificação do app de desenvolvimento, siga a mensagem do próprio iOS. Mantenha o iPhone conectado à internet durante a primeira verificação do certificado.

**Não confundir:** esta instalação nativa é diferente do antigo ícone/PWA adicionado pelo Safari. Os dois podem coexistir durante a prova, mas o teste de mãos-livres deve usar o app nativo instalado pelo Xcode.

---

## Etapa E — permissões do Jarvis no iPhone

Na primeira execução:

1. Autorize **Microfone** quando o iOS pedir.
2. Autorize **Reconhecimento de Fala** quando o iOS pedir.
3. Entre com o mesmo e-mail autorizado no Jarvis.
4. Informe o código recebido por e-mail.
5. Execute **Diagnóstico deste iPhone**.

O diagnóstico deve verificar separadamente:

- Microfone;
- Reconhecimento pt-BR;
- Cérebro local Apple, quando compatível;
- Sessão privada;
- Memória/contexto privado.

Não trate item indisponível como item aprovado.

---

## Etapa F — cadastrar “Jarvis, tá aí?” no Atalho Vocal

Depois que o app estiver instalado e a ação de sistema existir:

1. Abra **Ajustes > Acessibilidade > Atalhos Vocais**.
2. Adicione um novo Atalho Vocal.
3. Use exatamente a frase:

   **Jarvis, tá aí?**

4. Associe a frase à ação **Iniciar Jarvis** ou **Iniciar conversa Jarvis**.
5. Conclua o treinamento da frase se o iOS solicitar.

### Prova mínima

Sem tocar na tela:

1. diga **Jarvis, tá aí?**;
2. o Jarvis deve abrir/acionar a sessão;
3. deve responder **Tô aqui. Pode falar.**;
4. fale uma pergunta normal sem repetir “Jarvis”;
5. ele deve ouvir, responder e voltar à escuta;
6. diga **encerrar**;
7. a sessão deve terminar.

---

## Etapa G — testes separados depois da prova mínima

Somente depois da prova acima:

- testar com AirPods/fone;
- testar interrupção/barge-in;
- testar tela bloqueada;
- testar background;
- medir latência;
- validar reconexão;
- validar GPT-Live separadamente da rota local;
- depois avançar para orientação privada em live e separação de áudio público/privado.

Esses itens não devem ser declarados operacionais antes do teste real.

---

## Regra de segurança

- nenhuma chave privada de IA fica no iPhone;
- sessão privada fica no Keychain;
- voz não é senha única para ação sensível;
- fala de terceiros não vira memória pessoal automaticamente;
- o modo público não acessa silenciosamente o Cofre;
- qualquer publicação, gasto, exclusão ou outra ação sensível continua sujeita à política de autorização.
