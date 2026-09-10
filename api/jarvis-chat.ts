import { analyzeConversation } from '../server/anti-fatigue.mjs';
import { withAntiFatigue } from '../server/anti-fatigue-handler.mjs';
import { createJarvisHandler } from '../server/jarvis-chat.mjs';
import { createProviderAwareFetch, resolvePilotRuntime } from '../server/pilot-runtime.mjs';
import { routeCapability } from '../src/core/capabilityRouter.js';

const JARVIS_PERSONA = [
  'ESTILO_JARVIS: fale como um assessor executivo extremamente inteligente, seguro, elegante e humano.',
  'Use humor rápido e sarcasmo leve quando combinar com a situação, sem humilhar, infantilizar ou ser grosseiro.',
  'Seja direto, perspicaz e caloroso; evite tom burocrático, elogios vazios e frases feitas.',
  'A personalidade deve soar masculina e sofisticada no texto, mas nunca alegue ter uma voz, identidade humana ou emoção que o sistema não possua.'
].join(' ');

const readinessMessages: Record<string, string> = {
  pilot_not_verified: 'Sua sessão chegou ao servidor, mas a conta piloto não pôde ser confirmada. Não peça outro código; a autenticação precisa ser revisada no servidor.',
  ai_not_authorized: 'Sua conta está autenticada, mas a autorização de IA ainda não foi reconhecida pelo servidor.',
  provider_credential_missing: 'Sua conta está autorizada, mas o servidor ainda não recebeu uma credencial válida do AI Gateway. Nenhuma chamada de IA foi realizada.',
  chat_flag_disabled: 'Sua conta e o provedor estão prontos, mas uma configuração antiga da Vercel ainda mantém o chat desligado.'
};

async function readOrientation(request: Request) {
  try {
    const clone = request.clone();
    if (clone.method !== 'POST' || !clone.headers.get('content-type')?.toLowerCase().startsWith('application/json')) return null;
    const body = await clone.json();
    if (body?.mode === 'public' || typeof body?.message !== 'string' || !Array.isArray(body?.history)) return null;
    return analyzeConversation(body.history, body.message);
  } catch {
    return null;
  }
}

async function safeProviderCategory(response: Response): Promise<string | null> {
  if (response.ok) return null;
  try {
    const data = await response.clone().json();
    const type = typeof data?.error?.type === 'string' ? data.error.type : typeof data?.type === 'string' ? data.type : '';
    const message = typeof data?.error?.message === 'string' ? data.error.message : typeof data?.error === 'string' ? data.error : '';
    if (type === 'quota_for_entity_exceeded' || response.status === 402) return 'budget_or_credit';
    if (/restricted access to this model/i.test(message)) return 'model_restricted';
    if (/restricted access to this provider/i.test(message)) return 'provider_restricted';
    if (type === 'no_providers_available') return 'no_providers_available';
    if (response.status === 403) return 'forbidden';
    if (response.status === 401) return 'provider_authentication';
    if (response.status === 429) return 'provider_rate_limit';
  } catch {
    // Provider body is intentionally not logged. Only safe categories are returned.
  }
  return null;
}

function guidedFetch(orientation: ReturnType<typeof analyzeConversation> | null, baseFetch: typeof fetch): typeof fetch {
  return (async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = typeof input === 'string' ? input : input instanceof URL ? input.toString() : input.url;
    if (!url.startsWith('https://openrouter.ai/')) return baseFetch(input, init);

    let nextInit = init;
    if (typeof init?.body === 'string') {
      try {
        const payload = JSON.parse(init.body);
        const first = payload?.messages?.[0];
        if (first?.role === 'system' && typeof first.content === 'string') {
          first.content += `\n${JARVIS_PERSONA}`;
          if (orientation) {
            first.content += `\nORIENTACAO_ANTI_FADIGA_JSON=${JSON.stringify(orientation)}\nUse essa orientação silenciosamente. Não diga quantas vezes a usuária repetiu algo. Preserve o fio principal, responda ao que mudou e trate galhos como galhos, sem diagnosticar a pessoa.`;
          }
          nextInit = { ...init, body: JSON.stringify(payload) };
        }
      } catch {
        // A falha de enriquecimento nunca pode corromper o transporte normal do chat.
      }
    }

    try {
      const response = await baseFetch(input, nextInit);
      console.info('[JARVIS_PROVIDER_SAFE]', JSON.stringify({
        stage: 'chat_completion',
        status: response.status,
        ok: response.ok,
        category: await safeProviderCategory(response)
      }));
      return response;
    } catch {
      console.info('[JARVIS_PROVIDER_SAFE]', JSON.stringify({
        stage: 'chat_completion_transport',
        status: null,
        ok: false,
        category: 'transport'
      }));
      throw new Error('provider_transport');
    }
  }) as typeof fetch;
}

export default {
  async fetch(request: Request) {
    const orientation = await readOrientation(request);
    const runtime = await resolvePilotRuntime(request, process.env);
    const chatFlagEnabled = runtime.env.JARVIS_CHAT_ENABLED === 'true';
    const blockReason = runtime.diagnostics.readinessReason === 'ready' && !chatFlagEnabled
      ? 'chat_flag_disabled'
      : runtime.diagnostics.readinessReason;

    console.info('[JARVIS_RUNTIME_SAFE]', JSON.stringify({
      pilotVerified: runtime.diagnostics.pilotVerified,
      canUseAi: runtime.diagnostics.canUseAi,
      providerCredentialPresent: runtime.diagnostics.providerCredentialPresent,
      gatewayCredentialPresent: runtime.diagnostics.gatewayCredentialPresent,
      gatewayCredentialSource: runtime.diagnostics.gatewayCredentialSource,
      explicitOpenRouterPresent: runtime.diagnostics.explicitOpenRouterPresent,
      chatFlagEnabled,
      blockReason
    }));

    if (blockReason !== 'ready') {
      return Response.json({ ok: false, error: readinessMessages[blockReason] ?? 'Ativação incompleta no servidor.' }, {
        status: 503,
        headers: { 'Cache-Control': 'private, no-store', 'X-Content-Type-Options': 'nosniff' }
      });
    }

    const providerFetch = createProviderAwareFetch(runtime, globalThis.fetch);
    const secureChat = createJarvisHandler({
      env: runtime.env,
      routeInput: routeCapability,
      fetchImpl: guidedFetch(orientation, providerFetch)
    });
    return withAntiFatigue(secureChat)(request);
  }
};
