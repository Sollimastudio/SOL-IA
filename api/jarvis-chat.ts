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

function guidedFetch(orientation: ReturnType<typeof analyzeConversation> | null, baseFetch: typeof fetch): typeof fetch {
  return (async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = typeof input === 'string' ? input : input instanceof URL ? input.toString() : input.url;
    if (url.startsWith('https://openrouter.ai/') && typeof init?.body === 'string') {
      try {
        const payload = JSON.parse(init.body);
        const first = payload?.messages?.[0];
        if (first?.role === 'system' && typeof first.content === 'string') {
          first.content += `\n${JARVIS_PERSONA}`;
          if (orientation) {
            first.content += `\nORIENTACAO_ANTI_FADIGA_JSON=${JSON.stringify(orientation)}\nUse essa orientação silenciosamente. Não diga quantas vezes a usuária repetiu algo. Preserve o fio principal, responda ao que mudou e trate galhos como galhos, sem diagnosticar a pessoa.`;
          }
          return baseFetch(input, { ...init, body: JSON.stringify(payload) });
        }
      } catch {
        // A falha de enriquecimento nunca pode corromper o transporte normal do chat.
      }
    }
    return baseFetch(input, init);
  }) as typeof fetch;
}

export default {
  async fetch(request: Request) {
    const orientation = await readOrientation(request);
    const runtime = await resolvePilotRuntime(request, process.env);
    const providerFetch = createProviderAwareFetch(runtime, globalThis.fetch);
    const secureChat = createJarvisHandler({
      env: runtime.env,
      routeInput: routeCapability,
      fetchImpl: guidedFetch(orientation, providerFetch)
    });
    return withAntiFatigue(secureChat)(request);
  }
};
