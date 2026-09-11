# Reparo verificável — Gateway e celular

## Estado inicial
Branch work/jarvis-neural-conversa-segura-20260908, PR #6. Base da rodada 2366f998e218eef924ff90a004c0007c5325eb7d.
A última tentativa registrada recebeu três 403/no_providers_available, com identidade, autorização e credencial OIDC presentes. Essa categoria isolada não prova a causa específica de uma conta.

## Evidência nova
Em 2026-09-11 ~02:14 UTC o workflow Jarvis repair evidence (34553859100) coletou somente as fontes públicas https://ai-gateway.vercel.sh/v1/models e https://vercel.com/ai-gateway/models?freeTier=true. O HTML contém a elegibilidade em aria-label, omitida na extração textual simples.
- openai/gpt-5.6-sol: Free Tier: No.
- openai/gpt-5.6-luna: Free Tier: No.
- google/gemini-3.6-flash: Free Tier: No.
- alibaba/qwen3.8-flash: Free Tier: Yes; No Training on Prompt Data: Yes; Zero Data Retention: Yes.
O catálogo JSON confirmou o slug, controle de reasoning toggle e preços de US$0,16/M entrada e US$0,47/M saída. Isto não confirma saldo, regras adicionais da equipe ou resposta real da conta.

## Alteração de configuração
Apenas o modelo da conta-piloto autorizada da Sol foi alterado de openai/gpt-5.6-sol para alibaba/qwen3.8-flash, com comparação do valor anterior. can_use_ai foi preservado. Nenhuma compra de créditos, cartão ou alteração de RLS. A função reserve_solia_jarvis_turn segue atômica, com teto de 40 reservas por dia UTC.
Reversão: trocar o modelo somente após verificar acesso real do substituto. Não prometer GPT enquanto outro modelo atender.

## Correções do pacote
- Um modelo explicitamente selecionado por solicitação; retiradas três tentativas especulativas. Uma reserva equivale a uma chamada de geração enviada pelo app ao Gateway. Retentativas internas do provedor não são controladas por esta quota.
- Classificação segura e limitada em tamanho para crédito, cartão, free tier, política, autorização, rate limit e indisponibilidade; nenhum corpo de erro secreto vai para UI/logs.
- Resposta identifica modelUsed. Avisos do sistema não são apresentados como conteúdo gerado nem incluídos como fala do assistente no histórico.
- Sair de uma conta usa scope local, preservando as sessões de outros aparelhos.
- Troca para outra aba interrompe microfone/áudio, não aborta deliberadamente o pedido de texto. Troca de identidade/modo, encerramento explícito e desmontagem continuam cancelando respostas antigas.
- Espera de rede limitada a 90 s e áudio a 60 s para não deixar a tela travada indefinidamente.
- Primeiro clique em Iniciar voz é o consentimento explícito; sem escuta automática em segundo plano. Dependência do reconhecimento do navegador e possível processamento remoto estão declarados.
- Reenvio de OTP tem pausa de 60 s e mantém Já tenho um código. Não promete remover limites definidos pelo Supabase.
- Manifesto online para atalho de tela inicial; mesmo domínio, sem service worker e sem cache de conversas privadas.

## Verificação
Testes Node e navegador com autenticação/provedor SINTÉTICOS; Chromium e WebKit móvel. Registrar resultados reais de CI após execução, não assumir aprovação.
Nenhum teste local simulado prova áudio físico em iPhone, consumo real de Gateway, permanência indefinida da sessão nem publicação em App Store.
A proteção de Preview da Vercel ainda exige acesso autorizado. O conector de fetch protegido retornou 302 para SSO; não se contornou a proteção e não se obteve a sessão da usuária. Sem uma resposta 200 real não chamar o incidente de resolvido ponta a ponta.

## Continuação
Validar geração real no mesmo endereço; se houver recusa residual, usar errorCode, sem pedir novo login. Expandir voz premium/autoatualização supervisionada depois da conversa básica confiável. Não retirar proteção nem alterar main sem validação/aprovação adequada.
