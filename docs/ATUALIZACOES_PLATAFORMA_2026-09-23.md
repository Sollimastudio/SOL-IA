# Atualizações de plataforma — 23/09/2026

## Objetivo

Registrar o que pode ser incorporado ao Jarvis a partir das mudanças oficiais observadas em OpenAI, Vercel e Supabase, sem mudar produção, estratégia editorial ou orçamento automaticamente.

## OpenAI / GPT-6

- Novos candidatos de Gateway registrados: `openai/gpt-6-luna` para tarefas de alto volume e `openai/gpt-6-sol` para tarefas complexas.
- Nenhum deles é ativado automaticamente.
- A ativação experimental exige **duas travas explícitas**: `JARVIS_GPT6_EXPERIMENT_ENABLED=true` e `JARVIS_METERED_AI_ENABLED=true`.
- O modo custo-zero continua tendo precedência e bloqueia o experimento pago.
- O transporte recomendado para uma avaliação futura é Responses API, não uma troca cega do Chat Completions atual.
- `gpt-live-1` permanece separado para voz em tempo real e não foi substituído.

## Capability Radar

O radar passa a observar também:
- changelog oficial da API OpenAI;
- depreciações OpenAI;
- pricing OpenAI;
- status operacional do Supabase;
- fontes já existentes de Meta/Instagram/Facebook, TikTok, Vercel e Supabase.

O relatório agora separa:
1. mudança bruta de página;
2. sinal potencialmente material por janelas em torno de termos de modelo/API/preço/segurança/distribuição;
3. fonte indisponível.

Nada é promovido ou alterado automaticamente. O resultado é apenas um gatilho de revisão humana.

## Vercel

- O projeto já usa AI Gateway para a camada de voz e pode usar o Gateway no chat sem expor chave no cliente.
- As novas métricas de duração faturável/CPU por deployment devem entrar na observabilidade quando o conector/API usado pelo Jarvis expuser esses campos.
- Sandbox Drives ficam registrados como candidato para workspace temporário/persistente de agentes. Não substituem Supabase, memória canônica ou banco. Não foram ativados porque o recurso é beta e tem cobrança por uso.

## Supabase

Estado observado do projeto do Jarvis: saudável em `us-west-2`.

A revisão dos Advisors encontrou:
- tabelas com RLS e sem políticas que também não concedem SELECT a `anon`/`authenticated`: tratadas como bloqueadas, não como exposição;
- objetos legados com grants GraphQL amplos: requerem hardening separado depois de conferir dependências;
- `messages` contém dados e possui políticas de propriedade por `auth.uid()`;
- tabelas legadas vazias com SELECT público merecem remoção/revogação planejada, não mudança impulsiva;
- funções `SECURITY DEFINER` expostas a usuários autenticados exigem auditoria de cada corpo antes de qualquer revogação, para não quebrar RPCs do Jarvis.

Nenhum DDL foi aplicado em produção nesta rodada.

## Meta / TikTok

Nenhuma mudança oficial material observada nesta rodada justifica alterar estratégia de distribuição. O radar continua acompanhando e deve permanecer silencioso sem mudança material.

## Próximo gate técnico

Antes de usar GPT-6 em uma conversa real:
1. criar adaptador Responses API isolado;
2. registrar tokens/latência/custo por tarefa;
3. comparar Luna/Sol com o modelo atual em fixtures e conversas não sensíveis;
4. aplicar limite de gasto;
5. só então pedir promoção do experimento.

Produção, banco e estratégia continuam sem alteração automática.
