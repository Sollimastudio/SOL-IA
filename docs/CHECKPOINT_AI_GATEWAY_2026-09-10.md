# Checkpoint — AI Gateway / piloto Jarvis — 2026-09-10

- Conta piloto no Supabase confirmada com `can_use_ai = true`.
- Limite de consumo do piloto permanece em 40 chamadas por dia via `reserve_solia_jarvis_turn()`.
- Vercel AI Gateway confirmado na equipe; cartão já aparece como verificado e a equipe já possui API keys.
- Não copiar nem expor API keys no navegador, chat ou repositório.
- Preferir autenticação OIDC da Vercel para o runtime da Preview.
- Este commit existe também para forçar uma nova Preview da branch após a confirmação do AI Gateway.
- PR #6 permanece em rascunho; não promover para produção automaticamente.
