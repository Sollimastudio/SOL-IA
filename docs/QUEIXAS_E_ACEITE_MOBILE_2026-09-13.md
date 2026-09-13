# Jarvis no celular — queixas, evidências e critérios de entrega

13/09/2026. Canônico: `Sollimastudio/SOL-IA`, PR #6 (draft). Não é declaração de produto pronto.
Preservar `main`, proteção de acesso, RLS e limites de consumo. Complementa a continuidade e as arquiteturas Anti-Fadiga/Cérebro Crescente.

## Evidência real

- Preview observado: commit `9ca10a9dc49feaf8fb792bf9aec5b813c32dcb56`, deployment `dpl_J8giiVxbaX61hR6mFMHfZi2kEASD`.
- Logs de 13/09, UTC: POST `/api/jarvis-chat` e provedor retornaram 200 às 15:55:33 e 15:57:57. Comprova geração nesses envios, não qualidade, memória ou disponibilidade contínua.
- Às 16:00:03 e 16:00:42, POST retornou 503 com `pilot_not_verified`, antes de chamar modelo/gravar. Credencial de provedor continuava presente.
- Screenshot: `COFRE AUTENTICADO` enquanto o servidor recusava validação piloto. Indicador local prometia mais do que sabia.
- Consulta agregada restrita ao piloto e ao marcador fictício `TESTE-JARVIS-1309`: **zero memórias correspondentes**. Duas tentativas de IA consumidas no dia; uma conta piloto autorizada. Não ler conteúdo pessoal amplo para diagnosticar.
- Uma sessão criada em 10/09 foi renovada em 13/09 às 15:53:40 UTC. Não prova qual sessão originou o screenshot; não se pode concluir que toda reabertura exige OTP.
- Causa remota específica (Auth, consulta piloto, timeout, token recusado) não foi registrada pelo código anterior. Não chamar hipótese de causa comprovada.

### Avanço real depois da correção — não repetir o mesmo teste por falta de continuidade

- Commit `499d942dd204445a01874da606d0a7cb9d1867c5`, Preview `dpl_BJotf35jzdmAkdTtWcVn1zzmHHNU`.
- Às 16:20:58 UTC: envio real aceito, Auth 200/piloto 200/provedor 200; exatamente uma fala do projeto fictício registrada às 16:20:59.990442 UTC, com texto preservado.
- Às 16:25:52 UTC: pergunta “No projeto TESTE-JARVIS-1309, qual é a próxima tarefa?”; API e provedor 200; Auth/piloto 200, uma tentativa cada. Screenshot seguinte mostra resposta correta “revisar uma capa azul”, sem esse detalhe na pergunta atual.
- Consulta agregada limitada ao marcador: uma declaração original e uma pergunta de recuperação; último evento 16:25:55.053643 UTC. Não foram consultadas memórias pessoais amplas.
- Primeiro teste de recordação respondido corretamente. O screenshot não certifica, sozinho, reload efetivo, histórico vazio no request ou IDs das fontes usadas. Não encerra retenção por 24 h, outro dispositivo, acervo antigo, restauração ou Q1/Q3. Não exigir repetição do mesmo teste agora: prioridade mudou para acesso pela tela inicial.

## Queixas e aceite

| ID / prioridade | Experiência desejada | Situação atual | Aceite verificável |
| --- | --- | --- | --- |
| Q1 / P0 | Entrar uma vez, continuar conectada | SDK já persiste/renova; Preview tem barreira Vercel separada. Token da tela podia ficar desatualizado. | Mesmo endereço e navegador confiável: reabrir após 30 min e 24 h, renovar token e enviar sem OTP. Logout/revogação continuam funcionando. Segundo dispositivo sem misturar contas. |
| Q2 / P0 | Confiar que a fala foi salva | Falha inicial corrigida; declaração gravada uma vez e primeira resposta de recordação correta, evidências acima. Continuidade completa ainda aberta. | ID confirmado, exatamente uma gravação; reload, nova conversa e outro dispositivo recuperam o detalhe. Interrupção distingue pendente, confirmada e desconhecida, sem duplicação. |
| Q3 / P0 | Memória minuciosa e Perfil DNA | Captura de fala bruta; busca lexical nas últimas 50; histórico da tela limitado. Respostas sem histórico durável completo. | Detalhes antigos além dos 50 registros; fonte/data/versão; distinguir fatos, preferências, hipóteses e ficção; corrigir/exportar/excluir/pausar; isolamento entre usuários. |
| Q4 / P1 | Chamar por voz sem tocar, com tela bloqueada | Somente sessão autorizada em primeiro plano. Página oculta desliga microfone. | iPhone físico bloqueado por 15 min, 20 chamadas: acertos, falsos acionamentos, latência, bateria e offline. Emulador/botão não encerram este requisito. |
| Q5 / P0 | Assessor útil, atento, crítico e não burocrático | Modelo confundiu marcador informado com fato que exigia fonte. | Cumprir redação com marcador fictício; retomar decisão correta; crítica fundamentada com alternativa; reconhecer lacunas sem inventar. Avaliar respostas reais, não só presença de instrução no prompt. |
| Q6 / P0 | Ícone na tela inicial, sem procurar link na conversa | Manifesto já existia, mas faltavam entrada visível e PNG Apple. Esta rodada acrescenta guia na entrada e na conversa, ícones e instalação nativa quando disponível. Instalação física pendente. | Encontrar a opção sem abrir Central; instalar no iPhone, fechar e reabrir pelo ícone no endereço correto. Não salvar token/código/share link no manifesto. Não remover proteção. |
| Q7 / P0 | Assistente assume continuidade e pendências | Requisitos agora registrados neste arquivo. Gerenciador durável de tarefas/retomada dentro do Jarvis ainda não implementado. | Novo pedido/print vira item ligado ao projeto, com origem, estado, próxima ação e evidência. Após reload/nova conversa, retomar sem pedir à Sol que reconstrua a lista. Não declarar trabalho autônomo que não foi executado. |
| Q8 / P1 | Resposta direta e visualmente legível | Screenshot da recordação acerta o detalhe, mas traz asteriscos Markdown crus e sugestões longas não pedidas. | Responder primeiro à pergunta em uma frase; só expandir quando útil/pedido. Renderização segura de Markdown, sem HTML arbitrário. Testes de links, XSS e leitura móvel antes de entrega. |

## Como trabalhar com a Sol — requisitos explícitos, não diagnóstico

Fonte: pedidos e screenshots compartilhados nesta conversa em 13/09/2026. Não inferir condição clínica nem incorporar o projeto fictício à biografia.

- Ela encontra sites, ideias e problemas durante o uso e envia os pedidos conforme aparecem. Capturar o novo galho e manter o objetivo principal; não exigir formulário ou repetição da história.
- Ela quer reduzir a carga de lembrar links, tarefas, queixas e instruções já dadas. O assistente deve manter o registro, reconciliar duplicatas e retomar do último estado verificável.
- Pedir uma única ação humana por vez quando necessária. Não transformar toda entrega em “me lembre depois de lembrar”. Não agendar lembretes não solicitados para compensar falta de continuidade.
- Aprender preferências com material compartilhado/autorizado, com origem e possibilidade de correção. “Me observe” não autoriza vigiar todos os sites/apps nem captar áudio ambiente sem ativação.
- Proatividade útil: organizar, ensinar quando necessário, criticar com fundamento e sugerir uma alternativa concreta; não concordar automaticamente nem dar menus extensos sem necessidade.
- “Me clone” é uma direção de personalização de estilo e contexto, não promessa de identidade humana reproduzida. Voz/avatar continuam separados, sujeitos a consentimento e validação.

Este registro orienta a implementação; não equivale a gravar automaticamente essas preferências no Perfil DNA da conta, nem prova que o modelo já as segue. A camada durável de continuidade permanece Q7 aberta.

## Entrega delimitada: acesso pela tela inicial

- Entrada visível “Colocar Jarvis na tela inicial” antes do login e no topo da conversa; pode ser expandida sem apagar rascunho ou pedir código.
- iPhone/iPad: instruções para Compartilhar → Adicionar à Tela de Início → Abrir como App da Web (se disponível) → Adicionar; Safari como alternativa quando a opção falta no navegador embutido.
- Navegadores compatíveis: botão nativo somente após `beforeinstallprompt`; nunca prompt automático. Cancelamento/erro preservam conversa. Aceitar pedido não é tratado como instalação concluída: aguardar `appinstalled` ou abertura standalone.
- Manifesto mantém `id`, `start_url` e `scope` em `/`, na mesma origem; PNGs 192/512 e Apple 180. Nenhum parâmetro de autenticação ou share token entra no atalho por código.
- Sem service worker/cache de dados privados, migração, permissão de microfone, mudança de sessão, alteração de proteção ou promoção a produção.
- iOS pode separar armazenamento do navegador e web app: cookies podem ser copiados ao instalar, mas localStorage não. O Supabase atual usa persistência no navegador; primeiro login dentro do ícone pode ser necessário. Não transportar tokens por URL para contornar isso.
- Instalar o ícone resolve encontrabilidade; sessão persistente e acesso permanente à hospedagem são aceites distintos. Instalação física e reabertura pelo ícone ainda exigem evidência.

Fontes: [Apple — transformar site em app](https://support.apple.com/pt-br/guide/iphone/iphea86e5236/26/ios/26), [WebKit 17.2 — armazenamento ao instalar](https://webkit.org/blog/14787/webkit-features-in-safari-17-2/), [MDN — instalação por gesto explícito](https://developer.mozilla.org/en-US/docs/Web/API/Window/beforeinstallprompt_event).

## Correção delimitada desta rodada

- Sessão atual pelo SDK antes de cada envio. Só **401 + `session_invalid` + `stage=access` + `persisted=false`** permite uma renovação e uma repetição. Sem replay em 403/429/503, HTML da hospedagem, falha de rede ou gravação ambígua.
- Identidade conferida antes/depois da renovação; cancelamento e troca privado/público respeitados. Nunca levar contexto para outra conta.
- Distinguir sessão ausente/recusada, Auth indisponível, consulta piloto indisponível e conta não autorizada. Logs só status/contagens, sem token, e-mail, fala ou corpo de erro.
- Uma repetição apenas para GET de verificação em transporte ou 502/503/504, com timeout/cancelamento. Não repetir quota, memória ou provedor. Sem retry de 403/429.
- Indicador mostra sessão local até acesso aceito pelo servidor. Falha antes de gravar restaura rascunho e exclui a tentativa frustrada do próximo contexto. Rascunho ainda não sobrevive a reload/fechamento.
- Gravação: `true` com ID confirmado, `false` sem tentativa/recusa explícita, `null` quando confirmação foi perdida/inválida após tentativa. Modelo e interface não declaram perda quando resultado é desconhecido.
- Prompt distingue texto atual de supostos fatos recuperados e pede crítica útil. Obediência real ainda precisa ser avaliada.
- Lockfile inclui OIDC já declarado; sem atualização geral de versões.

## Acesso permanente não é share link de Preview

Há duas camadas: proteção Vercel e sessão Supabase. Não confundir login da hospedagem com logout do Jarvis. Não rotacionar share links durante o teste: invalida o anterior e agrava a confusão.
Para uso diário: origem fixa, mesmo navegador, política de dispositivo confiável e teste das duas camadas. Publicação estável exige gates do piloto e decisão sobre exposição. Não desligar proteção nem promover `main` nesta rodada. Não aumentar validade do JWT para mascarar falha; usar renovação oficial e respeitar saída/revogação.

## Próxima fatia de memória detalhada

1. Conversas/eventos privados com IDs estáveis, dono autenticado, data, origem, versão e estados. ID antes da geração; idempotência por conta+ID, não só hash de texto parecido.
2. Com consentimento, persistir fala e resposta, modelo e uso retornado; confirmar só o reconhecido pelo banco. Recuperar pelo ID após queda, sem nova cobrança. URL continua privada, sujeita a RLS.
3. Registro bruto separado do índice estruturado. Perfil DNA consolida preferências, projetos, decisões e correções com fonte. Inferência não vira fato; ficção não vira biografia; resposta da IA não vira declaração da Sol.
4. Buscar por relevância em todo o acervo autorizado. Testar detalhes exatos e conflitos; resumo não substitui fonte minuciosa.
5. Aprender discretamente com material compartilhado/autorizado, sem confirmar cada detalhe ordinário. Pedir esclarecimento para contradição relevante e autorização para ação externa. Não inferir permissão para microfone ambiente permanente, terceiros, importação de contas ou publicação.
6. Pausar, corrigir, ver origem, exportar e excluir. Definir retenção; testar backup/restauração antes de prometer ausência de perda.

Esta rodada NÃO aplica essa migração/backfill nem muda políticas reais. Testar migração aditiva e RLS em banco descartável antes de autorização para aplicar ao piloto.

## Voz tipo Alexa: objetivo preservado, rota a validar

- Web atual depende de permissão/página visível. Instalar atalho não prova escuta bloqueada.
- Investigar integração nativa por App Intents/Siri/Shortcuts para chamar ação Jarvis fora da tela. Caminho oficial, **não** palavra de ativação própria já entregue; ações privadas podem exigir desbloqueio.
- Dizer apenas “Jarvis” no ambiente exige prova de capacidade nativa permitida ou avaliação de dispositivo dedicado, captura mínima, indicador e desligamento. Sem comprar hardware ou prometer suporte universal antes do protótipo.
- Não usar áudio silencioso/abuso de background para contornar restrições. Testar bloqueio, bateria, privacidade e recuperação de falhas.

Fontes oficiais consultadas: [sessões Supabase](https://supabase.com/docs/guides/auth/sessions), [renovação no navegador](https://supabase.com/docs/reference/javascript/auth-startautorefresh), [refreshSession](https://supabase.com/docs/reference/javascript/auth-refreshsession), [App Intents](https://developer.apple.com/documentation/appintents), [Apple: ações fora do app](https://developer.apple.com/videos/play/wwdc2024/10210/).
Changelog Supabase revisado: alterações de self-hosted/SAML e endpoint OAuth não explicam este fluxo hospedado de e-mail+JWT. Não trocar variáveis por palpite.

## Próximo passo humano — uma coisa por vez

O envio e a primeira recordação do marcador já têm evidência acima. Agora: adicionar o Jarvis à tela inicial a partir da página que já está aberta. Não pedir logout nem repetir OTP para esse ato. Depois, confirmar a abertura pelo ícone; não chamar isso de entregue antes da evidência física.
Exclusão de material fictício exige decisão explícita. Não incorporá-lo como fato no Perfil DNA. Q1/Q2/Q3 continuam com os limites registrados; o assistente mantém o acompanhamento sem transferir à Sol o dever de reconstruí-lo.
