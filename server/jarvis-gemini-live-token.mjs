const DEFAULT_SUPABASE_URL = 'https://rkkpbmzrucaghrojujvb.supabase.co';
const DEFAULT_SUPABASE_PUBLISHABLE_KEY = 'sb_publishable_XhsUjBPVRtC-0DBfMNDQTA_FaK8XFj8';
const GEMINI_LIVE_MODEL = 'gemini-3.8-live';
const AUTH_TOKEN_URL = 'https://generativelanguage.googleapis.com/v1beta/auth_tokens';

// Never log provider text, metadata, request headers or bodies: Google can echo
// credentials in an error. Keep only known technical classifications/field names.
function providerDiagnostic(payload, httpStatus) {
  const error = payload?.error;
  const knownStatuses = ['INVALID_ARGUMENT', 'UNAUTHENTICATED', 'PERMISSION_DENIED',
    'RESOURCE_EXHAUSTED', 'NOT_FOUND', 'FAILED_PRECONDITION', 'INTERNAL', 'UNAVAILABLE'];
  const providerCode = knownStatuses.includes(error?.status) ? error.status : 'UNKNOWN';
  const message = typeof error?.message === 'string' ? error.message.slice(0, 8000) : '';
  const details = Array.isArray(error?.details) ? error.details.slice(0, 20) : [];
  const reasons = details.map(item => item?.reason);
  let cause = 'provider_rejected';
  if (httpStatus === 429 || providerCode === 'RESOURCE_EXHAUSTED') cause = 'quota_exhausted';
  else if (reasons.includes('API_KEY_INVALID') || /api key not valid|invalid api key/i.test(message)) cause = 'api_key_invalid';
  else if (httpStatus === 401 || httpStatus === 403 || reasons.some(reason =>
    ['API_KEY_SERVICE_BLOCKED', 'API_KEY_HTTP_REFERRER_BLOCKED', 'API_KEY_IP_ADDRESS_BLOCKED', 'SERVICE_DISABLED'].includes(reason))) cause = 'credential_not_authorized';
  else if (/unknown name|unknown field|cannot find field/i.test(message)) cause = 'unknown_field';
  else if (/model.{0,120}(not found|not supported|not available)/i.test(message)) cause = 'model_unavailable';
  else if (providerCode === 'INVALID_ARGUMENT') cause = 'invalid_argument';
  const knownFields = ['liveConnectConstraints', 'bidiGenerateContentSetup', 'responseModalities',
    'generationConfig', 'sessionResumption', 'expireTime', 'newSessionExpireTime', 'fieldMask'];
  const violations = details.flatMap(item => Array.isArray(item?.fieldViolations) ? item.fieldViolations.slice(0, 20) : []);
  const fields = knownFields.filter(field => message.includes(field) || violations.some(item =>
    typeof item?.field === 'string' && item.field.split(/[.\[\]]/).includes(field)));
  return { providerCode, cause, fields };
}

const reply = (status, payload) => Response.json(payload, {
  status,
  headers: {
    'Cache-Control': 'private, no-store',
    'Pragma': 'no-cache',
    'X-Content-Type-Options': 'nosniff'
  }
});

const first = (value, fallback = '') =>
  typeof value === 'string' && value.trim() ? value.trim() : fallback;

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

export function resolveGeminiApiKey(env = {}) {
  return first(env.GEMINI_API_KEY || env.GOOGLE_GEMINI_API_KEY);
}

export function createJarvisGeminiLiveTokenHandler({
  env = process.env,
  fetchImpl = globalThis.fetch,
  logger = console
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

    const headers = { apikey: supabaseKey, Authorization: authorization, 'Content-Type': 'application/json' };
    let user;
    try {
      const auth = await fetchWithDeadline(fetchImpl, `${base}/auth/v1/user`, { method: 'GET', headers }, request.signal, 5000);
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
        method: 'GET', headers
      }, request.signal, 5000);
      if (!access.ok) throw new Error('pilot_lookup');
      const rows = await safeJson(access);
      pilot = Array.isArray(rows) ? rows[0] : null;
    } catch {
      return reply(503, { ok: false, errorCode: 'pilot_unavailable', error: 'A autorização do modo ao vivo não pôde ser verificada.' });
    }

    if (pilot?.owner_id !== user.id || pilot.can_use_ai !== true || pilot.can_use_realtime !== true) {
      return reply(403, { ok: false, errorCode: 'realtime_not_authorized', error: 'O modo de voz ao vivo não está habilitado para esta conta.' });
    }

    const apiKey = resolveGeminiApiKey(env);
    if (!apiKey) {
      return reply(503, {
        ok: false,
        errorCode: 'gemini_api_key_missing',
        error: 'Gemini Live está preparado no Jarvis, mas falta cadastrar GEMINI_API_KEY na Vercel.'
      });
    }

    const now = Date.now();
    const expireTime = new Date(now + 30 * 60 * 1000).toISOString();
    const newSessionExpireTime = new Date(now + 60 * 1000).toISOString();

    let response;
    try {
      response = await fetchWithDeadline(fetchImpl, AUTH_TOKEN_URL, {
        method: 'POST',
        headers: {
          'x-goog-api-key': apiKey,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          uses: 1,
          expireTime,
          newSessionExpireTime,
          // Raw REST AuthToken schema. The SDK converts liveConnectConstraints
          // into this shape before POSTing; fetch does not perform that conversion.
          bidiGenerateContentSetup: {
            model: `models/${GEMINI_LIVE_MODEL}`,
            generationConfig: {
              responseModalities: ['AUDIO']
            }
          },
          // Lock exactly the existing model/AUDIO restrictions. Without a mask,
          // Google ignores the client's voice, instructions, transcription/tools.
          fieldMask: 'model,generationConfig.responseModalities'
        })
      }, request.signal, 10000);
    } catch {
      return reply(502, { ok: false, errorCode: 'gemini_token_unavailable', error: 'O Google não respondeu a tempo para abrir a voz ao vivo.' });
    }

    if (!response.ok) {
      const diagnostic = providerDiagnostic(await safeJson(response), response.status);
      logger.info('[JARVIS_GEMINI_LIVE_SAFE]', JSON.stringify({
        stage: 'mint_ephemeral_token', ok: false, status: response.status,
        model: GEMINI_LIVE_MODEL, apiVersion: 'v1beta', ...diagnostic
      }));
      const keyRejected = ['api_key_invalid', 'credential_not_authorized'].includes(diagnostic.cause);
      const errorCode = diagnostic.cause === 'quota_exhausted' ? 'gemini_quota_limited'
        : keyRejected ? 'gemini_key_not_authorized'
          : 'gemini_token_failed';
      const error = diagnostic.cause === 'quota_exhausted'
        ? 'A cota atual da API Gemini atingiu o limite. Aguarde a renovação da cota ou revise o plano.'
        : keyRejected
          ? 'A chave Gemini não foi autorizada para criar a sessão Live.'
          : 'Não consegui criar a autorização temporária do Gemini Live.';
      return reply(502, { ok: false, errorCode, error, providerStatus: response.status });
    }

    const token = await safeJson(response);
    const value = first(token?.name);
    if (!value) {
      return reply(502, { ok: false, errorCode: 'gemini_token_invalid', error: 'O Google devolveu uma autorização temporária inválida.' });
    }

    logger.info('[JARVIS_GEMINI_LIVE_SAFE]', JSON.stringify({ stage: 'mint_ephemeral_token', ok: true, model: GEMINI_LIVE_MODEL }));
    return reply(200, {
      ok: true,
      provider: 'gemini',
      token: value,
      model: GEMINI_LIVE_MODEL,
      expiresAt: expireTime,
      newSessionExpiresAt: newSessionExpireTime
    });
  };
}

export const jarvisGeminiLiveModel = GEMINI_LIVE_MODEL;
