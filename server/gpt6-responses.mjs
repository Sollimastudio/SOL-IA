import { resolveGpt6Experiment } from './gpt6-experiment.mjs';

export const GPT6_RESPONSES_ENDPOINT = 'https://ai-gateway.vercel.sh/v1/responses';
const EFFORTS = new Set(['none','low','medium','high','xhigh','max']);

function safeText(value, max) {
  return typeof value === 'string' ? value.trim().slice(0, max) : '';
}

function safeNumber(value) {
  return typeof value === 'number' && Number.isFinite(value) ? value : null;
}

export function extractResponsesText(payload) {
  if (typeof payload?.output_text === 'string' && payload.output_text.trim()) return payload.output_text.trim();
  const parts = [];
  for (const item of Array.isArray(payload?.output) ? payload.output : []) {
    for (const content of Array.isArray(item?.content) ? item.content : []) {
      if (typeof content?.text === 'string' && content.text.trim()) parts.push(content.text.trim());
      else if (typeof content?.output_text === 'string' && content.output_text.trim()) parts.push(content.output_text.trim());
    }
  }
  return parts.join('\n').trim();
}

export function normalizeResponsesUsage(payload) {
  const usage = payload?.usage && typeof payload.usage === 'object' ? payload.usage : {};
  return {
    inputTokens: safeNumber(usage.input_tokens ?? usage.inputTokens),
    outputTokens: safeNumber(usage.output_tokens ?? usage.outputTokens),
    totalTokens: safeNumber(usage.total_tokens ?? usage.totalTokens),
    gatewayCostUsd: safeNumber(payload?.providerMetadata?.gateway?.cost)
  };
}

export async function runGpt6ResponsesProbe({
  env = {},
  gatewayCredential = '',
  mode = 'default',
  input = '',
  instructions = '',
  reasoningEffort = 'none',
  maxOutputTokens = 900,
  fetchImpl = globalThis.fetch,
  signal
} = {}) {
  const experiment = resolveGpt6Experiment(env);
  if (!experiment.activationAllowed) {
    return { ok: false, executed: false, reason: experiment.reason, model: mode === 'complex' ? experiment.complexModel : experiment.defaultModel };
  }

  const credential = safeText(gatewayCredential, 8192);
  if (!credential) return { ok: false, executed: false, reason: 'gateway_credential_missing', model: mode === 'complex' ? experiment.complexModel : experiment.defaultModel };

  const prompt = safeText(input, 24000);
  if (!prompt) return { ok: false, executed: false, reason: 'input_required', model: mode === 'complex' ? experiment.complexModel : experiment.defaultModel };

  const effort = EFFORTS.has(reasoningEffort) ? reasoningEffort : 'none';
  const maxTokens = Math.max(128, Math.min(Number(maxOutputTokens) || 900, 4000));
  const model = mode === 'complex' ? experiment.complexModel : experiment.defaultModel;
  const started = Date.now();

  let response;
  try {
    response = await fetchImpl(GPT6_RESPONSES_ENDPOINT, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${credential}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model,
        input: prompt,
        ...(safeText(instructions, 12000) ? { instructions: safeText(instructions, 12000) } : {}),
        reasoning: { effort },
        max_output_tokens: maxTokens
      }),
      cache: 'no-store',
      redirect: 'error',
      signal: AbortSignal.any([signal ?? new AbortController().signal, AbortSignal.timeout(30000)])
    });
  } catch {
    return { ok: false, executed: true, reason: 'gateway_transport', model, latencyMs: Date.now() - started };
  }

  const latencyMs = Date.now() - started;
  let payload = null;
  try { payload = await response.json(); } catch { /* fail closed below */ }

  if (!response.ok) {
    return {
      ok: false,
      executed: true,
      reason: response.status === 402 ? 'gateway_budget_exceeded' : response.status === 429 ? 'gateway_rate_limited' : 'gateway_rejected',
      status: response.status,
      model,
      latencyMs,
      gatewayRequestId: response.headers.get('x-request-id') || response.headers.get('x-vercel-id') || null
    };
  }

  const text = extractResponsesText(payload);
  if (!text) {
    return { ok: false, executed: true, reason: 'empty_response', status: response.status, model, latencyMs, usage: normalizeResponsesUsage(payload) };
  }

  return {
    ok: true,
    executed: true,
    model,
    text,
    latencyMs,
    usage: normalizeResponsesUsage(payload),
    gatewayRequestId: response.headers.get('x-request-id') || response.headers.get('x-vercel-id') || null
  };
}
