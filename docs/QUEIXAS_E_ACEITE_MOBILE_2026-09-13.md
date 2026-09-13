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

## Queixas e aceite

| ID / prioridade | Experiência desejada | Situação atual | Aceite verificável |
| --- | --- | --- | --- |
| Q1 / P0 | Entrar uma vez, continuar conectada | SDK já persiste/renova; Preview tem barreira Vercel separada. Token da tela podia ficar desatualizado. | Mesmo endereço e navegador confiável: reabrir após 30 min e 24 h, renovar token e enviar sem OTP. Logout/revogação continuam funcionando. Segundo dispositivo sem misturar contas. |
| Q2 / P0 | Confiar que a fala foi salva | Teste real falhou; indicador e confirmação eram imprecisos. | ID confirmado, exatamente uma gravação; reload, nova conversa e outro dispositivo recuperam o detalhe. Interrupção distingue pendente, confirmada e desconhecida, sem duplicação. |
| Q3 / P0 | Memória minuciosa e Perfil DNA | Captura de fala bruta; busca lexical nas últimas 50; histórico da tela limitado. Respostas sem histórico durável completo. | Detalhes antigos além dos 50 registros; fonte/data/versão; distinguir fatos, preferências, hipóteses e ficção; corrigir/exportar/excluir/pausar; isolamento entre usuários. |
| Q4 / P1 | Chamar por voz sem tocar, com tela bloqueada | Somente sessão autorizada em primeiro plano. Página oculta desliga microfone. | iPhone físico bloqueado por 15 min, 20 chamadas: acertos, falsos acionamentos, latência, bateria e offline. Emulador/botão não encerram este requisito. |
| Q5 / P0 | Assessor útil, atento, crítico e não burocrático | Modelo confundiu marcador informado com fato que exigia fonte. | Cumprir redação com marcador fictício; retomar decisão correta; crítica fundamentada com alternativa; reconhecer lacunas sem inventar. Avaliar respostas reais, não só presença de instrução no prompt. |

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

## Próximo teste real após Preview atualizado

Sem sair e sem novo OTP: reenviar teste fictício com gravação autorizada. Correlacionar horário e mensagem com status de Auth/piloto. Se acesso falhar, parar nessa fronteira.
Se houver ID confirmado, consultar somente esse registro/marcador. Então nova conversa, reload e pergunta sobre capa azul. Exclusão de material de teste exige decisão explícita; não incorporá-lo como fato no Perfil DNA.
200 de IA não encerra Q1/Q2/Q3: exigir recuperação e reabertura por tempo real.
