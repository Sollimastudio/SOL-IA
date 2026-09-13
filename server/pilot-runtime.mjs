const DEFAULT_SUPABASE_URL = 'https://rkkpbmzrucaghrojujvb.supabase.co';
const DEFAULT_SUPABASE_PUBLISHABLE_KEY = 'sb_publishable_XhsUjBPVRtC-0DBfMNDQTA_FaK8XFj8';
const DEFAULT_MODEL = 'alibaba/qwen3.8-flash';
const OPENROUTER_CHAT_URL = 'https://openrouter.ai/api/v1/chat/completions';
const VERCEL_GATEWAY_CHAT_URL = 'https://ai-gateway.vercel.sh/v1/chat/completions';

function first(value, fallback) {
  return typeof value === 'string' && value.trim() ? value.trim() : fallback;
}

async function defaultOidcResolver() {
  const { getVercelOidcToken } = await import('@vercel/oidc');
  return getVercelOidcToken();
}

async function resolveGatewayCredential(baseEnv = {}, oidcResolver = defaultOidcResolver) {
  const configured = first(baseEnv.AI_GATEWAY_API_KEY || baseEnv.VERCEL_OIDC_TOKEN, '');
  if (configured) return { credential: configured, source: 'env' };

  try {
    const oidc = await oidcResolver();
    const credential = first(oidc, '');
    return { credential, source: credential ? 'oidc_helper' : 'none' };
  } catch {
    return { credential: '', source: 'none' };
  }
}

// Retry only read-only verification, once. Never replay a quota, memory or model POST.
async function readAccessJson(url, headers, signal, fetchImpl) {
  let status = null;
  for (let attempts = 1; attempts <= 2; attempts++) {
    if (signal.aborted) return { status, attempts: attempts - 1, data: null };
    try {
      const response = await fetchImpl(url, {
        method: 'GET', headers, cache: 'no-store', redirect: 'error',
        signal: AbortSignal.any([signal, AbortSignal.timeout(4000)])
      });
      status = response.status;
      if ([502, 503, 504].includes(status) && attempts === 1) {
        await response.body?.cancel();
        continue;
      }
      if (!response.ok) return { status, attempts, data: null };
      // A malformed success is not approval. Do not log response bodies.
      let data = null;
      try { data = await response.json(); } catch { /* fail closed */ }
      return { status, attempts, data };
    } catch {
      status = null;
      if (attempts === 2 || signal.aborted) return { status, attempts, data: null };
    }
  }
}

const readinessMessages = {
  session_missing: 'Não foi encontrada uma sessão para este envio. Reabra o Jarvis no mesmo navegador antes de solicitar outro código.',
  session_invalid: 'O servidor recusou a sessão. A renovação automática pode recuperar o acesso; não é necessário pedir um código por tentativa.',
  auth_unavailable: 'Não foi possível consultar a autenticação agora. Isso não confirma que seu login expirou. Tente enviar novamente em instantes.',
  pilot_unavailable: 'A sessão foi validada, mas a consulta da conta piloto falhou. Não peça outro código; o acesso precisa ser verificado no servidor.',
  pilot_not_authorized: 'A sessão foi validada, mas nenhuma autorização piloto correspondente foi encontrada.',
  request_cancelled: 'A verificação foi interrompida antes de iniciar a conversa.',
  ai_not_authorized: 'Sua conta está autenticada, mas a autorização de IA ainda não foi reconhecida pelo servidor.',
  provider_credential_missing: 'Sua conta está autorizada, mas o servidor ainda não recebeu uma credencial válida do AI Gateway. Nenhuma chamada de IA foi realizada.',
  chat_flag_disabled: 'Sua conta e o provedor estão prontos, mas uma configuração antiga da Vercel ainda mantém o chat desligado.'
};

export function runtimeBlockResponse(runtime) {
  const reason = runtime.diagnostics.readinessReason === 'ready' && runtime.env.JARVIS_CHAT_ENABLED !== 'true'
    ? 'chat_flag_disabled' : runtime.diagnostics.readinessReason;
  if (reason === 'ready') return null;
  const status = ['session_missing', 'session_invalid'].includes(reason) ? 401
    : ['pilot_not_authorized', 'ai_not_authorized'].includes(reason) ? 403 : 503;
  return Response.json({ ok: false, errorCode: reason, stage: 'access', persisted: false,
    error: readinessMessages[reason] ?? 'Ativação incompleta no servidor.' }, {
    status, headers: { 'Cache-Control': 'private, no-store', 'X-Content-Type-Options': 'nosniff' }
  });
}

export async function resolvePilotRuntime(
  request,
  baseEnv = {},
  fetchImpl = globalThis.fetch,
  oidcResolver = defaultOidcResolver
) {
  const supabaseUrl = first(baseEnv.SUPABASE_URL || baseEnv.VITE_SUPABASE_URL, DEFAULT_SUPABASE_URL);
  const supabaseKey = first(baseEnv.SUPABASE_ANON_KEY || baseEnv.VITE_SUPABASE_ANON_KEY, DEFAULT_SUPABASE_PUBLISHABLE_KEY);
  const authorization = request.headers.get('authorization') || '';
  let allowedUser = '__pilot_not_verified__';
  let canUseAi = false;
  let model = first(baseEnv.JARVIS_MODEL, DEFAULT_MODEL);
  let accessReason = 'session_missing';
  let authStatus = null, pilotStatus = null, authAttempts = 0, pilotAttempts = 0;

  if (/^Bearer [^\s]+$/.test(authorization)) {
    const authHeaders = { apikey: supabaseKey, Authorization: authorization, 'Content-Type': 'application/json' };
    const auth = await readAccessJson(`${supabaseUrl}/auth/v1/user`, authHeaders, request.signal, fetchImpl);
    authStatus = auth.status; authAttempts = auth.attempts;
    accessReason = auth.status === 401 ? 'session_invalid' : 'auth_unavailable';
    const user = auth.data;
    if (auth.status === 200 && typeof user?.id === 'string' && user.id.length > 0) {
      const params = new URLSearchParams({ owner_id: `eq.${user.id}`, select: 'owner_id,can_use_ai,model', limit: '1' });
      const pilot = await readAccessJson(`${supabaseUrl}/rest/v1/solia_pilot_users?${params}`, authHeaders, request.signal, fetchImpl);
      pilotStatus = pilot.status; pilotAttempts = pilot.attempts;
      accessReason = pilot.status === 401 ? 'session_invalid' : 'pilot_unavailable';
      if (pilot.status === 200 && Array.isArray(pilot.data)) {
        accessReason = 'pilot_not_authorized';
        const row = pilot.data[0];
        if (row?.owner_id === user.id) {
          allowedUser = user.id;
          canUseAi = row.can_use_ai === true;
          if (typeof row.model === 'string' && row.model.trim()) model = row.model.trim();
        }
      }
    }
  }

  const explicitOpenRouter = first(baseEnv.OPENROUTER_API_KEY, '');
  const gateway = explicitOpenRouter
    ? { credential: '', source: 'none' }
    : await resolveGatewayCredential(baseEnv, oidcResolver);
  const gatewayCredential = gateway.credential;
  const useGateway = !explicitOpenRouter && Boolean(gatewayCredential);
  const providerCredential = explicitOpenRouter || gatewayCredential;
  const pilotVerified = allowedUser !== '__pilot_not_verified__';
  const providerCredentialPresent = Boolean(providerCredential);
  const readinessReason = request.signal.aborted ? 'request_cancelled' : !pilotVerified
    ? accessReason
    : !canUseAi
      ? 'ai_not_authorized'
      : !providerCredentialPresent
        ? 'provider_credential_missing'
        : 'ready';
  const chatEnabled = readinessReason === 'ready';

  return {
    env: {
      ...baseEnv,
      SUPABASE_URL: supabaseUrl,
      SUPABASE_ANON_KEY: supabaseKey,
      JARVIS_ALLOWED_USER_IDS: first(baseEnv.JARVIS_ALLOWED_USER_IDS, allowedUser),
      JARVIS_KNOWLEDGE_ENABLED: first(baseEnv.JARVIS_KNOWLEDGE_ENABLED, 'true'),
      JARVIS_MODEL: model,
      JARVIS_CHAT_ENABLED: first(baseEnv.JARVIS_CHAT_ENABLED, chatEnabled ? 'true' : 'false'),
      JARVIS_RUNTIME_REASON: readinessReason,
      OPENROUTER_API_KEY: first(baseEnv.OPENROUTER_API_KEY, providerCredential)
    },
    useGateway,
    gatewayCredential,
    diagnostics: {
      authStatus, pilotStatus, authAttempts, pilotAttempts,
      pilotVerified,
      canUseAi,
      providerCredentialPresent,
      gatewayCredentialPresent: Boolean(gatewayCredential),
      gatewayCredentialSource: gateway.source,
      explicitOpenRouterPresent: Boolean(explicitOpenRouter),
      readinessReason
    }
  };
}

export function createProviderAwareFetch(runtime, fetchImpl = globalThis.fetch) {
  return async (input, init = {}) => {
    const url = String(input);
    if (runtime.useGateway && url === OPENROUTER_CHAT_URL) {
      const headers = new Headers(init.headers || {});
      headers.set('Authorization', `Bearer ${runtime.gatewayCredential}`);
      headers.set('Content-Type', 'application/json');
      return fetchImpl(VERCEL_GATEWAY_CHAT_URL, { ...init, headers });
    }
    return fetchImpl(input, init);
  };
}

export const pilotPublicConfig = Object.freeze({
  supabaseUrl: DEFAULT_SUPABASE_URL,
  supabasePublishableKey: DEFAULT_SUPABASE_PUBLISHABLE_KEY,
  defaultModel: DEFAULT_MODEL
});
