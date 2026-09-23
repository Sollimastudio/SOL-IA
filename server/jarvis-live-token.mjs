const DEFAULT_SUPABASE_URL = 'https://rkkpbmzrucaghrojujvb.supabase.co';
const DEFAULT_SUPABASE_PUBLISHABLE_KEY = 'sb_publishable_XhsUjBPVRtC-0DBfMNDQTA_FaK8XFj8';
const LIVE_MODEL = 'gpt-live-1';
const OPENAI_LIVE_URL = 'https://api.openai.com/v1/live/sessions';
const LEGACY_CLIENT_SECRET_URL = 'https://ai-gateway.vercel.sh/v1/realtime/client-secrets';
const LIVE_VOICES = new Set([
  'marin', 'alloy', 'ash', 'ballad', 'beacon', 'bossa', 'cedar', 'cinder', 'coral', 'delta', 'echo',
  'gleam', 'meridian', 'quartz', 'ripple', 'sage', 'shimmer', 'stone', 'tempo', 'verse', 'vesper', 'willow'
]);

const reply = (status, payload) => Response.json(payload, {
  status,
  headers: {
    'Cache-Control': 'private, no-store',
    'Pragma': 'no-cache',
    'X-Content-Type-Options': 'nosniff'
  }
});

function first(value, fallback = '') {
  return typeof value === 'string' && value.trim() ? value.trim() : fallback;
}

async function defaultOidcResolver() {
  const { getVercelOidcToken } = await import('@vercel/oidc');
  return getVercelOidcToken();
}

export async function resolveLiveGatewayCredential(env = {}, oidcResolver = defaultOidcResolver) {
  const configured = first(env.AI_GATEWAY_API_KEY || env.VERCEL_OIDC_TOKEN);
  if (configured) return configured;
  try {
    return first(await oidcResolver());
  } catch {
    return '';
  }
}

export function resolveOpenAIProjectKey(env = {}) {
  return first(env.OPENAI_API_KEY || env.OPENAI_PROJECT_API_KEY);
}

async function safeJson(response) {
  try { return await response.json(); } catch { return null; }
}

async function fetchWithDeadline(fetchImpl, url, init, requestSignal, timeoutMs = 8000) {
  return fetchImpl(url, {
    ...init,
    cache: 'no-store',
    redirect: 'error',
    signal: AbortSignal.any([requestSignal, AbortSignal.timeout(timeoutMs)])
  });
}

async function readLiveRequest(request) {
  if (!request.headers.get('content-type')?.toLowerCase().startsWith('application/json')) return null;
  let body;
  try { body = await request.json(); } catch { return null; }
  if (!body || typeof body !== 'object' || Array.isArray(body)) return null;
  const sdp = typeof body.sdp === 'string' ? body.sdp.trim() : '';
  if (!sdp) return null;
  if (sdp.length > 120000) throw new Error('sdp_too_large');
  const voice = LIVE_VOICES.has(body.voice) ? body.voice : 'marin';
  const instructions = typeof body.instructions === 'string' ? body.instructions.trim().slice(0, 8000) : '';
  return { sdp, voice, instructions };
}

async function stableSafetyIdentifier(userId) {
  const bytes = new TextEncoder().encode(`jarvis-live:${userId}`);
  const digest = await crypto.subtle.digest('SHA-256', bytes);
  return Array.from(new Uint8Array(digest), byte => byte.toString(16).padStart(2, '0')).join('');
}

function openAILiveError(status) {
  if (status === 401 || status === 403) {
    return { code: 'openai_live_not_authorized', message: 'O GPT‑Live ainda não está autorizado nesta chave de projeto da OpenAI.' };
  }
  if (status === 429) {
    return { code: 'openai_live_rate_limited', message: 'O GPT‑Live atingiu um limite temporário da conta. Aguarde um pouco e tente novamente.' };
  }
  return { code: 'openai_live_failed', message: 'A OpenAI não conseguiu criar a sessão de voz agora.' };
}

export function createJarvisLiveTokenHandler({
  env = process.env,
  fetchImpl = globalThis.fetch,
  oidcResolver = defaultOidcResolver
} = {}) {
  return async function handle(request) {
    if (request.method !== 'POST') return reply(405, { ok: false, error: 'Use POST.' });

    const authorization = request.headers.get('authorization') || '';
    if (!/^Bearer [^\s]+$/.test(authorization)) {
      return reply(401, { ok: false, errorCode: 'session_missing', error: 'Entre na sua conta antes de iniciar a voz ao vivo.' });
    }

    const supabaseUrl = first(env.SUPABASE_URL || env.VITE_SUPABASE_URL, DEFAULT_SUPABASE_URL);
    const supabaseKey = first(
      env.SUPABASE_PUBLISHABLE_KEY || env.VITE_SUPABASE_PUBLISHABLE_KEY ||
      env.SUPABASE_ANON_KEY || env.VITE_SUPABASE_ANON_KEY,
      DEFAULT_SUPABASE_PUBLISHABLE_KEY
    );

    let base;
    try {
      const url = new URL(supabaseUrl);
      if (url.protocol !== 'https:' || url.username || url.password || url.search || url.hash) throw new Error('bad_url');
      base = url.origin;
    } catch {
      return reply(503, { ok: false, errorCode: 'supabase_config_invalid', error: 'A conexão segura do Jarvis não está configurada.' });
    }

    const authHeaders = { apikey: supabaseKey, Authorization: authorization, 'Content-Type': 'application/json' };
    let user;
    try {
      const auth = await fetchWithDeadline(fetchImpl, `${base}/auth/v1/user`, { method: 'GET', headers: authHeaders }, request.signal, 5000);
      if (!auth.ok) {
        return reply(auth.status === 401 ? 401 : 503, {
          ok: false,
          errorCode: auth.status === 401 ? 'session_invalid' : 'auth_unavailable',
          error: auth.status === 401 ? 'Sua sessão precisa ser renovada.' : 'Não consegui verificar sua sessão agora.'
        });
      }
      user = await safeJson(auth);
      if (typeof user?.id !== 'string' || !user.id) throw new Error('invalid_user');
    } catch {
      if (request.signal.aborted) return reply(499, { ok: false, errorCode: 'request_cancelled', error: 'A abertura da conversa foi cancelada.' });
      return reply(503, { ok: false, errorCode: 'auth_unavailable', error: 'Não consegui verificar sua sessão agora.' });
    }

    let pilot;
    try {
      const params = new URLSearchParams({
        owner_id: `eq.${user.id}`,
        select: 'owner_id,can_use_ai,can_use_realtime',
        limit: '1'
      });
      const access = await fetchWithDeadline(fetchImpl, `${base}/rest/v1/solia_pilot_users?${params}`, {
        method: 'GET', headers: authHeaders
      }, request.signal, 5000);
      if (!access.ok) throw new Error('pilot_lookup');
      const rows = await safeJson(access);
      pilot = Array.isArray(rows) ? rows[0] : null;
    } catch {
      return reply(503, { ok: false, errorCode: 'pilot_unavailable', error: 'A autorização do modo ao vivo não pôde ser verificada.' });
    }

    if (pilot?.owner_id !== user.id || pilot.can_use_ai !== true || pilot.can_use_realtime !== true) {
      return reply(403, { ok: false, errorCode: 'realtime_not_authorized', error: 'O modo GPT‑Live não está habilitado para esta conta.' });
    }

    let liveRequest;
    try { liveRequest = await readLiveRequest(request); }
    catch { return reply(413, { ok: false, errorCode: 'live_offer_too_large', error: 'A negociação de áudio ficou grande demais para iniciar.' }); }

    if (liveRequest) {
      const openAIKey = resolveOpenAIProjectKey(env);
      if (!openAIKey) {
        return reply(503, {
          ok: false,
          errorCode: 'openai_project_key_missing',
          error: 'GPT‑Live está pronto no Jarvis, mas falta configurar a chave de projeto da OpenAI no servidor.'
        });
      }

      let response;
      try {
        response = await fetchWithDeadline(fetchImpl, OPENAI_LIVE_URL, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${openAIKey}`,
            'Content-Type': 'application/json',
            'OpenAI-Safety-Identifier': await stableSafetyIdentifier(user.id)
          },
          body: JSON.stringify({
            session: {
              model: LIVE_MODEL,
              store: false,
              delegation: { type: 'client' },
              audio: { output: { voice: liveRequest.voice } },
              instructions: liveRequest.instructions
            },
            transport: { type: 'webrtc', sdp: liveRequest.sdp }
          })
        }, request.signal, 15000);
      } catch {
        return reply(502, { ok: false, errorCode: 'openai_live_unavailable', error: 'A conexão com o GPT‑Live não respondeu a tempo.' });
      }

      if (!response.ok) {
        const problem = openAILiveError(response.status);
        console.info('[JARVIS_LIVE_SAFE]', JSON.stringify({ stage: 'create_webrtc_session', ok: false, status: response.status }));
        return reply(502, { ok: false, errorCode: problem.code, error: problem.message, providerStatus: response.status });
      }

      const created = await safeJson(response);
      const sessionId = first(created?.session?.id);
      const answerSdp = first(created?.transport?.sdp);
      if (!sessionId || !answerSdp) {
        return reply(502, { ok: false, errorCode: 'openai_live_invalid_response', error: 'A OpenAI devolveu uma sessão de voz incompleta.' });
      }

      console.info('[JARVIS_LIVE_SAFE]', JSON.stringify({ stage: 'create_webrtc_session', ok: true, model: LIVE_MODEL }));
      return reply(201, {
        ok: true,
        model: LIVE_MODEL,
        session: { id: sessionId },
        transport: { type: 'webrtc', sdp: answerSdp },
        pricing: { usdPerSessionHour: 3, usdPerMinute: 0.05 }
      });
    }

    // Compatibility path for older clients and synthetic tests only.
    const gatewayCredential = await resolveLiveGatewayCredential(env, oidcResolver);
    if (!gatewayCredential) {
      return reply(503, { ok: false, errorCode: 'gateway_credential_missing', error: 'A conexão segura com o provedor de voz ainda não está disponível.' });
    }

    let minted;
    try {
      const response = await fetchWithDeadline(fetchImpl, LEGACY_CLIENT_SECRET_URL, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${gatewayCredential}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ model: 'openai/gpt-live-1', routeKind: 'live' })
      }, request.signal, 10000);
      if (!response.ok) {
        console.info('[JARVIS_LIVE_SAFE]', JSON.stringify({ stage: 'mint_legacy_token', ok: false, status: response.status }));
        return reply(502, { ok: false, errorCode: 'live_token_failed', error: 'A integração antiga de voz não conseguiu abrir a sessão.' });
      }
      minted = await safeJson(response);
    } catch {
      return reply(502, { ok: false, errorCode: 'live_token_unavailable', error: 'A conexão de voz não respondeu a tempo.' });
    }

    const token = first(minted?.token);
    const expiresAt = Number(minted?.expiresAt);
    if (!token || !Number.isFinite(expiresAt) || expiresAt * 1000 <= Date.now()) {
      return reply(502, { ok: false, errorCode: 'live_token_invalid', error: 'O provedor devolveu uma autorização de voz inválida.' });
    }

    return reply(200, {
      ok: true,
      token,
      expiresAt,
      model: LIVE_MODEL,
      pricing: { usdPerSessionHour: 3, usdPerMinute: 0.05 }
    });
  };
}

export const jarvisLiveModel = LIVE_MODEL;
