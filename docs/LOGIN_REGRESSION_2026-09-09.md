# Entrada do Jarvis — correção do login invisível

## Problema observado pela Sol

O link da prévia mostrava “entre para continuar”, mas não oferecia um caminho de login. No código anterior, App e JarvisConversation pediam entrada enquanto AuthPanel retirava o formulário quando VITE_SECURE_MEMORY_ENABLED não era true ou a conexão não estava configurada. O status READY da Vercel não validava o acesso.

## Correção delimitada

- Visitante sem sessão recebe uma única tela de acesso, não o chat desabilitado e vários painéis.
- Se a configuração permitir, campo visível “Seu e-mail” e botão “Enviar link de acesso”. Login por link, sem senha.
- Se não permitir, texto claro “Acesso ainda não liberado” e “Não falta nenhuma ação sua nesta tela”. Nenhuma instrução para caçar um formulário inexistente.
- Sessão inicial é resolvida antes de apresentar a entrada. Eventos novos de login/logout continuam prevalecendo sobre respostas iniciais atrasadas.
- Falha de rede ao pedir acesso não deixa o botão travado nem limpa o e-mail. Proteção contra duplo envio durante uma solicitação.
- Nenhuma mudança em authService, supabaseClient, RLS, allowlist, flags, chaves ou tabelas.

## Testes

Workflow jarvis-login-ui.yml: 4 cenários em Chromium desktop e viewport móvel, total 8 testes. Monta App e AuthPanel reais usando transportes sintéticos isolados pelo arquivo de configuração Vite de teste. Não injeta um login de teste no aplicativo distribuído. Bloqueia requisições externas no navegador; não envia e-mails. Verifica formulário visível, bloqueio honesto, ausência de chat sem sessão, falha/retry e layout estreito. Screenshots geradas no artifact jarvis-login-browser.

Consultar checks do commit antes de declarar aprovação. Configuração de teste não comprova Supabase real, entrega do e-mail, provedor de IA, Safari ou uso no iPhone físico.

## Bloqueio operacional

Ainda é necessário verificar/liberar a configuração real de Auth e as proteções do banco por uma conexão autorizada. Nesta rodada o conector Vercel permitiu consultar projeto/implantações, mas não expôs edição das variáveis; foi localizada uma integração Supabase disponível e sugerida à Sol. Não solicitar senha, service_role ou chaves em texto no chat. Não habilitar o cofre sem validar isolamento. Não anunciar conversa pronta com base somente em compilação ou acesso à prévia.

Continuação: docs/CONTINUIDADE_JARVIS.md e PR #6 na mesma branch de trabalho; main preservada.
