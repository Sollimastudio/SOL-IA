import { classifyProviderError } from '../server/provider-errors.mjs';
import { meteredAiBlockResponse } from '../server/budget-policy.mjs';
import { analyzeConversation } from '../server/anti-fatigue.mjs';
import { withAntiFatigue } from '../server/anti-fatigue-handler.mjs';
import { createJarvisHandler } from '../server/jarvis-chat.mjs';
import { createProviderAwareFetch, resolvePilotRuntime, runtimeBlockResponse } from '../server/pilot-runtime.mjs';
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
    const budgetBlock = meteredAiBlockResponse(process.env);
    if (budgetBlock) return budgetBlock;

    const envelope = await readConversationEnvelope(request);
    const orientation = envelope?.mode === 'private' ? analyzeConversation(envelope.history, envelope.message) : null;
    const runtime = await resolvePilotRuntime(request, process.env);
    const chatFlagEnabled = runtime.env.JARVIS_CHAT_ENABLED === 'true';
    const blockReason = runtime.diagnostics.readinessReason === 'ready' && !chatFlagEnabled ? 'chat_flag_disabled' : runtime.diagnostics.readinessReason;

    console.info('[JARVIS_RUNTIME_SAFE]', JSON.stringify({
      authStatus: runtime.diagnostics.authStatus, pilotStatus: runtime.diagnostics.pilotStatus,
      authAttempts: runtime.diagnostics.authAttempts, pilotAttempts: runtime.diagnostics.pilotAttempts,
      pilotVerified: runtime.diagnostics.pilotVerified, canUseAi: runtime.diagnostics.canUseAi,
      providerCredentialPresent: runtime.diagnostics.providerCredentialPresent,
      gatewayCredentialPresent: runtime.diagnostics.gatewayCredentialPresent,
      gatewayCredentialSource: runtime.diagnostics.gatewayCredentialSource,
      explicitOpenRouterPresent: runtime.diagnostics.explicitOpenRouterPresent,
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
      ? classifyContinuity(envelope.message, packet, orientation)
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
