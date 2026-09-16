import { classifyProviderError } from '../server/provider-errors.mjs';
import { meteredAiBlockResponse } from '../server/budget-policy.mjs';
import { analyzeConversation } from '../server/anti-fatigue.mjs';
import { withAntiFatigue } from '../server/anti-fatigue-handler.mjs';
import { createJarvisHandler } from '../server/jarvis-chat.mjs';
import { createProviderAwareFetch, resolvePilotRuntime, runtimeBlockResponse } from '../server/pilot-runtime.mjs';
import { applyZeroCostRuntime, verifyZeroCostGatewayModel } from '../server/zero-cost-ai.mjs';
import { normalizeContinuityCues } from '../server/continuity-cues.mjs';
import { routeCapability } from '../src/core/capabilityRouter.js';
import { SOL_PRESENCE_PROFILE } from '../core/presence-profile.mjs';
import { AUDIENCE_INTELLIGENCE_DIRECTIVE } from '../core/audience-intelligence.mjs';
import { GROWTH_INTELLIGENCE_DIRECTIVE } from '../core/growth-intelligence.mjs';
import { classifyContinuity, continuitySystemText, loadAssistantHistoryPacket, loadContinuityPacket, loadProfilePacket, persistContinuityFromResponse, readConversationEnvelope } from '../server/continuity-runtime.mjs';

const JARVIS_PERSONA = [
  'ESTILO_JARVIS: fale como um assessor executivo extremamente inteligente, seguro, elegante e humano.',
  'Use humor rápido e sarcasmo leve quando combinar com a situação, sem humilhar, infantilizar ou ser grosseiro.',
  'Seja direto, perspicaz e caloroso; evite tom burocrático, elogios vazios e frases feitas.',
  'A personalidade deve soar masculina e sofisticada no texto, mas nunca alegue ter uma voz, identidade humana ou emoção que o sistema não possua.'
].join(' ');

async function liveDelegationAuthorized(request: Request, runtime: Awaited<ReturnType<typeof resolvePilotRuntime>>) {
  if (request.headers.get('x-jarvis-live-delegation') !== '1') return false;
  const authorization = request.headers.get('authorization') || '';
  if (!/^Bearer [^\s]+$/.test(authorization)) return false;
  const supabaseUrl = runtime.env.SUPABASE_URL || runtime.env.VITE_SUPABASE_URL;
  const supabaseKey = runtime.env.SUPABASE_PUBLISHABLE_KEY || runtime.env.VITE_SUPABASE_PUBLISHABLE_KEY ||
    runtime.env.SUPABASE_ANON_KEY || runtime.env.VITE_SUPABASE_ANON_KEY;
  if (!supabaseUrl || !supabaseKey) return false;

  const headers = { apikey: supabaseKey, Authorization: authorization, 'Content-Type': 'application/json' };
  const call = (url: string) => fetch(url, {
    method: 'GET', headers, cache: 'no-store', redirect: 'error',
    signal: AbortSignal.any([request.signal, AbortSignal.timeout(5000)])
  });
  try {
    const auth = await call(`${supabaseUrl}/auth/v1/user`);
    if (!auth.ok) return false;
    const user = await auth.json();
    if (typeof user?.id !== 'string' || !user.id) return false;
    const params = new URLSearchParams({
      owner_id: `eq.${user.id}`,
      select: 'owner_id,can_use_ai,can_use_realtime',
      limit: '1'
    });
    const access = await call(`${supabaseUrl}/rest/v1/solia_pilot_users?${params}`);
    if (!access.ok) return false;
    const rows = await access.json();
    const row = Array.isArray(rows) ? rows[0] : null;
    return row?.owner_id === user.id && row.can_use_ai === true && row.can_use_realtime === true;
  } catch {
    return false;
  }
}

function guidedFetch(orientation: ReturnType<typeof analyzeConversation> | null, continuityText: string, baseFetch: typeof fetch): typeof fetch {
  return (async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = typeof input === 'string' ? input : input instanceof URL ? input.toString() : input.url;
    if (!url.startsWith('https://openrouter.ai/')) return baseFetch(input, init);
    let nextInit = init;
    if (typeof init?.body === 'string') {
      try {
        const payload = JSON.parse(init.body);
        const first = payload?.messages?.[0];
        if (first?.role === 'system' && typeof first.content === 'string') {
          first.content += `\n${JARVIS_PERSONA}\n${SOL_PRESENCE_PROFILE}\n${AUDIENCE_INTELLIGENCE_DIRECTIVE}\n${GROWTH_INTELLIGENCE_DIRECTIVE}`;
          if (orientation) first.content += `\nORIENTACAO_ANTI_FADIGA_JSON=${JSON.stringify(orientation)}\nEste é um indício lexical falível, não uma classificação confirmada. Preserve o fio principal e responda ao que mudou.`;
          if (continuityText) first.content += `\n${continuityText}`;
          nextInit = { ...init, body: JSON.stringify(payload) };
        }
      } catch { /* enrichment must never break chat transport */ }
    }
    try {
      const response = await baseFetch(input, nextInit);
      console.info('[JARVIS_PROVIDER_SAFE]', JSON.stringify({ stage:'chat_completion', status:response.status, ok:response.ok, category:response.ok ? null : await classifyProviderError(response) }));
      return response;
    } catch {
      console.info('[JARVIS_PROVIDER_SAFE]', JSON.stringify({ stage:'chat_completion_transport', status:null, ok:false, category:'transport' }));
      throw new Error('provider_transport');
    }
  }) as typeof fetch;
}

export default {
  async fetch(request: Request) {
    const envelope = await readConversationEnvelope(request);
    const orientation = envelope?.mode === 'private' ? analyzeConversation(envelope.history, envelope.message) : null;
    let runtime = await resolvePilotRuntime(request, process.env);
    const liveDelegation = await liveDelegationAuthorized(request, runtime);

    // Regular chat keeps the zero-cost gate. Only an authenticated pilot row with
    // can_use_realtime=true may bypass that gate for a GPT-Live delegated task.
    if (liveDelegation) {
      runtime = {
        ...runtime,
        env: {
          ...runtime.env,
          JARVIS_METERED_AI_ENABLED: 'true',
          JARVIS_CHAT_ENABLED: 'true'
        }
      };
    } else if (process.env.JARVIS_METERED_AI_ENABLED !== 'true') {
      const zeroCost = await verifyZeroCostGatewayModel(globalThis.fetch);
      runtime = applyZeroCostRuntime(runtime, zeroCost);
      const budgetBlock = meteredAiBlockResponse(runtime.env);
      if (budgetBlock) return budgetBlock;
    }

    const chatFlagEnabled = runtime.env.JARVIS_CHAT_ENABLED === 'true';
    const blockReason = runtime.diagnostics.readinessReason === 'ready' && !chatFlagEnabled ? 'chat_flag_disabled' : runtime.diagnostics.readinessReason;
    const runtimeDiagnostics = runtime.diagnostics as typeof runtime.diagnostics & {
      zeroCostModelVerified?: boolean;
      zeroCostModel?: string | null;
    };

    console.info('[JARVIS_RUNTIME_SAFE]', JSON.stringify({
      authStatus: runtimeDiagnostics.authStatus, pilotStatus: runtimeDiagnostics.pilotStatus,
      authAttempts: runtimeDiagnostics.authAttempts, pilotAttempts: runtimeDiagnostics.pilotAttempts,
      pilotVerified: runtimeDiagnostics.pilotVerified, canUseAi: runtimeDiagnostics.canUseAi,
      providerCredentialPresent: runtimeDiagnostics.providerCredentialPresent,
      gatewayCredentialPresent: runtimeDiagnostics.gatewayCredentialPresent,
      gatewayCredentialSource: runtimeDiagnostics.gatewayCredentialSource,
      explicitOpenRouterPresent: runtimeDiagnostics.explicitOpenRouterPresent,
      zeroCostModelVerified: runtimeDiagnostics.zeroCostModelVerified === true,
      zeroCostModel: runtimeDiagnostics.zeroCostModel ?? null,
      liveDelegation,
      chatFlagEnabled, blockReason
    }));

    const blocked = runtimeBlockResponse(runtime);
    if (blocked) return blocked;

    const [packet, profilePacket, assistantHistory] = envelope?.mode === 'private'
      ? await Promise.all([
          loadContinuityPacket({ request, env: runtime.env, envelope, fetchImpl: globalThis.fetch }),
          loadProfilePacket({ request, env: runtime.env, envelope, fetchImpl: globalThis.fetch }),
          loadAssistantHistoryPacket({ request, env: runtime.env, envelope, fetchImpl: globalThis.fetch })
        ])
      : [[], [], []];
    const classification = envelope?.mode === 'private'
      ? classifyContinuity(normalizeContinuityCues(envelope.message), packet, orientation)
      : null;
    const continuityText = continuitySystemText(packet, classification, profilePacket, assistantHistory);

    const providerFetch = createProviderAwareFetch(runtime, globalThis.fetch);
    const secureChat = createJarvisHandler({
      env: runtime.env,
      routeInput: routeCapability,
      fetchImpl: guidedFetch(orientation, continuityText, providerFetch)
    });
    const response = await withAntiFatigue(secureChat)(request);
    return persistContinuityFromResponse({ request, env: runtime.env, envelope, classification, response, fetchImpl: globalThis.fetch });
  }
};
