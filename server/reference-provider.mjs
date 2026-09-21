import { ReferenceError, generationMessages } from '../core/reference-series.mjs';
import { resolvePilotRuntime, createProviderAwareFetch } from './pilot-runtime.mjs';
import { applyZeroCostRuntime, verifyZeroCostGatewayModel } from './zero-cost-ai.mjs';
import { meteredAiBlockResponse } from './budget-policy.mjs';
import { createHmac, createHash } from 'node:crypto';

export function configuredEndpoint(value) {
  const url = new URL(value);
  if (url.protocol !== 'https:' || url.username || url.password || url.search || url.hash) throw new ReferenceError('invalid_configuration', 'O endereço do conector precisa de configuração válida.', 503);
  return url.href;
}
export async function createReferenceGenerator(request, env, fetchImpl = fetch) {
  let runtime = await resolvePilotRuntime(request, env, fetchImpl);
  if (!runtime.diagnostics.pilotVerified || !runtime.diagnostics.canUseAi) throw new ReferenceError('ai_not_authorized', 'Esta conta ainda não tem geração autorizada.', 403);
  if (env.JARVIS_METERED_AI_ENABLED !== 'true') runtime = applyZeroCostRuntime(runtime, await verifyZeroCostGatewayModel(fetchImpl));
  if (meteredAiBlockResponse(runtime.env)) throw new ReferenceError('ai_budget_paused', 'A geração aguarda um modelo de custo zero verificado ou a autorização de orçamento já prevista no Jarvis.', 403);
  if (!runtime.diagnostics.providerCredentialPresent) throw new ReferenceError('provider_unavailable', 'A conexão de IA deste ambiente ainda não está configurada.', 503);
  const providerFetch = createProviderAwareFetch(runtime, fetchImpl);
  return async ({ state, step, signal }) => {
    const base = runtime.env.SUPABASE_URL;
    const headers = { apikey: runtime.env.SUPABASE_ANON_KEY, Authorization: request.headers.get('authorization'), 'Content-Type': 'application/json' };
    const quota = await fetchImpl(`${base}/rest/v1/rpc/reserve_solia_jarvis_turn`, { method: 'POST', headers, body: '{}', redirect: 'error', signal: AbortSignal.timeout(8000) });
    if (!quota.ok || await quota.json() !== true) throw new ReferenceError('quota_unavailable', 'O limite de geração não pôde ser reservado; nenhuma chamada de modelo foi iniciada.', 429);
    // Only the private author's source library, never customer history. Missing context stays explicit.
    let authorContext = [];
    if (runtime.env.JARVIS_KNOWLEDGE_ENABLED === 'true') {
      const result = await fetchImpl(`${base}/rest/v1/rpc/search_solia_knowledge`, { method: 'POST', headers, body: JSON.stringify({ p_query: state.brief.objective.slice(0, 500) }), redirect: 'error', signal: AbortSignal.timeout(8000) });
      if (result.ok) {
        const rows = await result.json();
        authorContext = Array.isArray(rows) ? rows.filter(r => r.owner_id === runtime.tenantContext?.userId).slice(0, 6).map(r => ({ title: r.title, excerpt: String(r.excerpt || r.content || '').slice(0, 1800), basis: 'author_library_unverified' })) : [];
      }
    }
    let response;
    try {
      response = await providerFetch('https://openrouter.ai/api/v1/chat/completions', { method: 'POST', redirect: 'error',
        headers: { Authorization: `Bearer ${runtime.env.OPENROUTER_API_KEY}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ model: runtime.env.JARVIS_MODEL, max_tokens: 3200, response_format: { type: 'json_object' }, messages: generationMessages(state, step, [], authorContext) }),
        signal: AbortSignal.any([signal || request.signal, AbortSignal.timeout(45000)]) });
    } catch { throw new ReferenceError('provider_outcome_unknown', 'O provedor não confirmou o resultado. A geração não será repetida automaticamente.', 502); }
    if (!response.ok) throw new ReferenceError('provider_rejected', 'O provedor recusou esta geração; os episódios anteriores continuam salvos.', 502);
    let payload; try { payload = await response.json(); } catch { throw new ReferenceError('provider_outcome_unknown', 'O provedor respondeu sem um resultado legível. Confira antes de repetir.', 502); }
    let value; try { value = JSON.parse(payload.choices?.[0]?.message?.content); } catch { throw new ReferenceError('invalid_generation', 'A resposta precisa de revisão: formato de roteiro inválido.', 502); }
    return { value, model: runtime.env.JARVIS_MODEL, usage: payload.usage };
  };
}
export function mediaAdapterFromEnv(env, fetchImpl = fetch) {
  if (!env.JARVIS_MEDIA_ADAPTER_URL || !env.JARVIS_MEDIA_ADAPTER_TOKEN) return undefined;
  const url = configuredEndpoint(env.JARVIS_MEDIA_ADAPTER_URL);
  return async ({ url: sourceUrl, kind, signal }) => {
    const response = await fetchImpl(url, { method: 'POST', redirect: 'error', headers: { Authorization: `Bearer ${env.JARVIS_MEDIA_ADAPTER_TOKEN}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ url: sourceUrl, kind, maxCharacters: 45000, allowPaid: false }), signal: AbortSignal.any([signal, AbortSignal.timeout(45000)]) });
    if (!response.ok) return { status: 'blocked', code: `adapter_http_${response.status}` };
    const reader = response.body?.getReader(); if (!reader) throw new Error('adapter_empty');
    const chunks = []; let size = 0;
    try { for (;;) { const { value, done } = await reader.read(); if (done) break; size += value.length; if (size > 100000) { await reader.cancel(); throw new Error('adapter_limit'); } chunks.push(value); } } finally { reader.releaseLock(); }
    return JSON.parse(Buffer.concat(chunks).toString('utf8'));
  };
}
export function lucidaDeliveryFromEnv(env, fetchImpl = fetch) {
  if (!env.JARVIS_LUCIDA_INGEST_URL || !env.JARVIS_LUCIDA_BRIDGE_SECRET) return undefined;
  const url = configuredEndpoint(env.JARVIS_LUCIDA_INGEST_URL);
  return async bundle => {
    const body = JSON.stringify(bundle), timestamp = String(Date.now()), digest = createHash('sha256').update(body).digest('hex');
    const signature = createHmac('sha256', env.JARVIS_LUCIDA_BRIDGE_SECRET).update(`${timestamp}.${body}`).digest('hex');
    const response = await fetchImpl(url, { method: 'POST', redirect: 'error', headers: { 'Content-Type': 'application/json', 'X-Jarvis-Timestamp': timestamp, 'X-Jarvis-Signature': signature }, body, signal: AbortSignal.timeout(15000) });
    if (!response.ok) throw new ReferenceError('bridge_rejected', 'A LÚCIDA não aceitou o pacote nesta tentativa.', 502);
    const result = await response.json();
    if (result.digest !== digest) throw new ReferenceError('receipt_mismatch', 'O comprovante não corresponde ao conteúdo enviado.', 502);
    return result;
  };
}

export async function readAudienceReport(env, fetchImpl = fetch) {
  if (!env.JARVIS_LUCIDA_INSIGHTS_URL || !env.JARVIS_LUCIDA_INSIGHTS_SECRET) throw new ReferenceError('insights_not_configured', 'A conexão com os relatórios consentidos da LÚCIDA ainda não está configurada.', 503);
  const body = JSON.stringify({ action: 'last_completed_week' }), timestamp = String(Date.now());
  const signature = createHmac('sha256', env.JARVIS_LUCIDA_INSIGHTS_SECRET).update(`${timestamp}.${body}`).digest('hex');
  const r = await fetchImpl(configuredEndpoint(env.JARVIS_LUCIDA_INSIGHTS_URL), { method: 'POST', headers: { 'Content-Type': 'application/json', 'X-Jarvis-Timestamp': timestamp, 'X-Jarvis-Signature': signature }, body, redirect: 'error', signal: AbortSignal.timeout(10000) });
  if (!r.ok) throw new ReferenceError('insights_unavailable', 'O relatório agregado não pôde ser consultado.', 503);
  const value = await r.json();
  if (!Array.isArray(value.themes) || value.minimumPeople !== 5) throw new ReferenceError('invalid_insight_report', 'O relatório não passou pela conferência.', 502);
  // Field allowlist: a mistaken downstream response cannot forward raw customer narratives.
  return { period: value.period, minimumPeople: 5, themes: value.themes.slice(0, 7).filter(t => t.people >= 5).map(t => ({ topic: String(t.topic).slice(0, 60), people: t.people, responses: t.responses, proposal: String(t.proposal).slice(0, 500) })), revenue: null, conversions: null,
    limitations: ['Somente temas agregados consentidos; grupos pequenos omitidos.', 'Sem comprovação de compras ou receita.'] };
}
