const DEFAULT_SUPABASE_URL = 'https://rkkpbmzrucaghrojujvb.supabase.co';
const DEFAULT_SUPABASE_PUBLISHABLE_KEY = 'sb_publishable_XhsUjBPVRtC-0DBfMNDQTA_FaK8XFj8';
const DEFAULT_MODEL = 'openai/gpt-5.6-sol';
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

  if (/^Bearer [^\s]+$/.test(authorization)) {
    try {
      const authHeaders = { apikey: supabaseKey, Authorization: authorization, 'Content-Type': 'application/json' };
      const userResponse = await fetchImpl(`${supabaseUrl}/auth/v1/user`, {
        headers: authHeaders, cache: 'no-store', redirect: 'error', signal: AbortSignal.timeout(8000)
      });
      if (userResponse.ok) {
        const user = await userResponse.json();
        if (typeof user?.id === 'string') {
          const params = new URLSearchParams({ owner_id: `eq.${user.id}`, select: 'owner_id,can_use_ai,model', limit: '1' });
          const membership = await fetchImpl(`${supabaseUrl}/rest/v1/solia_pilot_users?${params}`, {
            headers: authHeaders, cache: 'no-store', redirect: 'error', signal: AbortSignal.timeout(8000)
          });
          if (membership.ok) {
            const rows = await membership.json();
            const row = Array.isArray(rows) ? rows[0] : null;
            if (row?.owner_id === user.id) {
              allowedUser = user.id;
              canUseAi = row.can_use_ai === true;
              if (typeof row.model === 'string' && row.model.trim()) model = row.model.trim();
            }
          }
        }
      }
    } catch {
      // Inner handlers remain fail-closed and return the final user-facing status.
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
  const readinessReason = !pilotVerified
    ? 'pilot_not_verified'
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
