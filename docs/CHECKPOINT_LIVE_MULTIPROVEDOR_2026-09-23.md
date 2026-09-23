# Checkpoint Jarvis — voz multiprovedor e continuidade — 23/09/2026

## Fonte de verdade

- Repositório canônico: `Sollimastudio/SOL-IA`.
- Produção: `https://sol-ia-i5wy.vercel.app`.
- Baseline de produção antes deste checkpoint: `2c5cdc259242c0e3a51f3e5f8fde559f7bf68c51`.
- Branch de consolidação: `work/consolidate-live-progress-20260923`.
- Não criar outro Jarvis nem reimplementar voz em repositório paralelo.

## Estado verificado em produção

O endpoint `/api/jarvis-runtime-health` respondeu 200 e informou, sem expor segredos:

- Gemini Live: `gemini-3.8-live`, chave de servidor presente.
- OpenAI Live: `gpt-live-1`, chave de servidor ausente.
- Gemini é o provedor padrão da UI; OpenAI permanece como opção explícita.
- Nenhum fallback de provedor deve ocorrer silenciosamente.

## Gemini Live

Implementado no Jarvis:

- broker autenticado em `/api/jarvis-gemini-live-token`;
- autenticação do usuário pelo Supabase antes de contatar o Google;
- checagem `can_use_ai` + `can_use_realtime`;
- `GEMINI_API_KEY` somente no servidor;
- troca da chave longa por token efêmero de uma sessão;
- token limitado ao modelo `gemini-3.8-live` e modalidade AUDIO;
- WebSocket cliente-servidor usando token efêmero;
- captura PCM e reprodução de áudio;
- transcrição de entrada/saída;
- function calling `consult_jarvis` para memória/contexto/bastidores;
- erro de cota 429 tratado sem retry automático;
- seletor de provedor Gemini/OpenAI na UI;
- catálogo de vozes oficiais ampliado neste checkpoint.

A disponibilidade de Free Tier é uma condição da conta/cota do Google, não uma promessa do Jarvis. No Free Tier, a política oficial de preços informa que os dados podem ser usados para melhorar produtos Google; o Jarvis não deve tratar isso como equivalente ao tier pago.

## OpenAI Live

Implementado como alternativa:

- fluxo oficial WebRTC no navegador;
- backend cria sessão em `/v1/live/sessions`;
- `OPENAI_API_KEY` permanece somente no servidor;
- produção atual informa que a chave OpenAI ainda não está configurada;
- não ativar cobrança ou migrar automaticamente para OpenAI.

## Fontes oficiais atuais

- Gemini 3.8 Live: https://ai.google.dev/gemini-api/docs/models/gemini-3.8-live
- Live API: https://ai.google.dev/gemini-api/docs/live-api
- Tokens efêmeros: https://ai.google.dev/gemini-api/docs/live-api/ephemeral-tokens
- Pricing: https://ai.google.dev/gemini-api/docs/pricing
- Rate limits: https://ai.google.dev/gemini-api/docs/rate-limits
- Changelog: https://ai.google.dev/gemini-api/docs/changelog

Essas fontes entram no Capability Radar. Mudança de página não muda estratégia automaticamente; gera sinal para revisão.

## Requisito de identidade de voz da Sol — NÃO confundir

Ainda não está concluído:

- speaker verification / voiceprint para reconhecer “provavelmente é a Sol”;
- diarização robusta de múltiplos locutores;
- autorização por voz de convidados (“Sol, alguém quer falar comigo. Você autoriza?”);
- impedir que fala de terceiros vire memória atribuída à Sol;
- aprendizagem do dialeto/jeito de falar apenas de trechos atribuídos à Sol.

Voz/voiceprint nunca será autenticação única. Login/sessão/dispositivo continuam sendo a fronteira de autorização.

## Próximos gates

1. Prova real do Gemini Live no celular da Sol: conexão, áudio bidirecional, interrupção, transcrição e encerramento.
2. Conferir cota/free tier real pela resposta do provedor, sem presumir gratuidade infinita.
3. Implementar Speaker ID/voiceprint + convidados + diarização como módulo separado.
4. Manter OpenAI disponível, mas inativo enquanto `OPENAI_API_KEY` não existir.
5. Preservar logs, SHAs, rollback e status de cada prova.

## Regra de continuidade

Toda entrega importante deve deixar: código versionado + teste/Preview + estado de produção + checkpoint documental. Requisito não comprovado continua marcado como pendente.
