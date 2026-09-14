const CATALOG_URL = 'https://ai-gateway.vercel.sh/v1/models';
export const ZERO_COST_MODEL = 'inclusionai/ling-3.0-flash-vl-free';

function numericPrice(value) {
  if (typeof value === 'number') return Number.isFinite(value) ? value : NaN;
  if (typeof value !== 'string') return NaN;
  const normalized = value.trim().toLowerCase();
  if (normalized === 'free') return 0;
  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : NaN;
}

export function modelIsZeroCost(model) {
  if (!model || typeof model !== 'object' || model.id !== ZERO_COST_MODEL) return false;
  const pricing = model.pricing && typeof model.pricing === 'object' ? model.pricing : {};
  return numericPrice(pricing.input) === 0 && numericPrice(pricing.output) === 0;
}

export async function verifyZeroCostGatewayModel(fetchImpl = globalThis.fetch) {
  try {
    const response = await fetchImpl(CATALOG_URL, {
      method: 'GET', cache: 'no-store', redirect: 'error',
      signal: AbortSignal.timeout(5000)
    });
    if (!response.ok) return { ok: false, reason: 'catalog_unavailable', model: null };
    const payload = await response.json();
    const models = Array.isArray(payload?.data) ? payload.data : Array.isArray(payload?.models) ? payload.models : [];
    const model = models.find(item => item?.id === ZERO_COST_MODEL) ?? null;
    if (!model) return { ok: false, reason: 'free_model_missing', model: null };
    if (!modelIsZeroCost(model)) return { ok: false, reason: 'free_model_not_zero_cost', model: null };
    return { ok: true, reason: 'verified_zero_cost', model: ZERO_COST_MODEL };
  } catch {
    return { ok: false, reason: 'catalog_unavailable', model: null };
  }
}

export function applyZeroCostRuntime(runtime, verification) {
  if (!runtime || !verification?.ok || verification.model !== ZERO_COST_MODEL || !runtime.useGateway || !runtime.gatewayCredential) {
    return runtime;
  }
  return {
    ...runtime,
    env: {
      ...runtime.env,
      JARVIS_ZERO_COST_VERIFIED: 'true',
      JARVIS_MODEL: ZERO_COST_MODEL,
      JARVIS_CHAT_ENABLED: 'true'
    },
    diagnostics: {
      ...runtime.diagnostics,
      zeroCostModelVerified: true,
      zeroCostModel: ZERO_COST_MODEL
    }
  };
}
