/** Never return/log the provider body: it may contain request data, keys or tenant identifiers. */
export async function classifyProviderError(response) {
  let type = '', message = '';
  const reader = response.clone().body?.getReader();
  if (reader) {
    try {
      const chunks = []; let size = 0;
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        size += value.byteLength;
        if (size > 16384) { void reader.cancel(); throw new Error('oversize'); }
        chunks.push(value);
      }
      const bytes = new Uint8Array(size); let offset = 0;
      for (const chunk of chunks) { bytes.set(chunk, offset); offset += chunk.length; }
      const data = JSON.parse(new TextDecoder().decode(bytes));
      type = String(data?.error?.type ?? data?.type ?? data?.error?.code ?? '');
      message = typeof data?.error?.message === 'string' ? data.error.message : typeof data?.error === 'string' ? data.error : '';
    } catch { /* Classify using status only; do not leak raw data. */ }
    finally { reader.releaseLock(); }
  }
  if (response.status === 402 || type === 'quota_for_entity_exceeded') return 'budget_or_credit';
  if (type === 'customer_verification_required' || /verify.{0,40}(card|customer)|card.{0,30}verif/i.test(message)) return 'card_verification';
  if (/restricted access to this (model|provider)|allowlist|allow.list|team.{0,25}restrict/i.test(message)) return 'team_policy';
  if (/free[ -]?tier|free credits|paid.{0,15}(tier|account)/i.test(message)) return 'free_tier_model';
  if (response.status === 401) return 'provider_authentication';
  if (response.status === 429) return 'provider_rate_limit';
  if (type === 'no_providers_available') return 'no_providers_available';
  if (response.status === 403) return 'provider_forbidden';
  if (response.status === 404) return 'model_unavailable';
  return 'provider_unavailable';
}
export function providerErrorMessage(category) {
  const messages = {
    budget_or_credit: 'O Gateway informou falta de crédito ou limite de gasto. Nenhuma compra foi feita. Seu login continua válido.',
    card_verification: 'O Gateway ainda exige verificação do cartão da equipe. Não é um problema com seu código de login.',
    team_policy: 'Uma política da equipe bloqueou o modelo ou provedor. O Jarvis não contornou essa proteção.',
    free_tier_model: 'O Gateway informou que este modelo não é elegível aos créditos gratuitos da equipe. A seleção do modelo precisa ser corrigida; seu login continua válido.',
    provider_authentication: 'O Gateway recusou a credencial do servidor. Não saia da conta: a correção é técnica, não um novo login.',
    provider_rate_limit: 'O Gateway pediu uma pausa por excesso de solicitações. Não foi enviada outra tentativa automática. Seu login continua válido.',
    no_providers_available: 'O Gateway não disponibilizou um provedor para o modelo selecionado. A causa ainda precisa ser confirmada; não solicite outro código.',
    provider_forbidden: 'O Gateway recusou esta geração. Não foi possível determinar a razão específica. Seu login continua válido.',
    model_unavailable: 'O Gateway não encontrou o modelo configurado. Nenhum modelo alternativo foi usado sem revisão.'
  };
  return messages[category] || 'O provedor de IA está indisponível. Seu login continua válido; nenhuma resposta foi inventada.';
}
