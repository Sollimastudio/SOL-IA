export function resolvePilotRuntime(
  request: Request,
  baseEnv?: Record<string, string | undefined>,
  fetchImpl?: typeof fetch,
  oidcResolver?: () => string | undefined | Promise<string | undefined>
): Promise<{
  env: Record<string, string | undefined>;
  useGateway: boolean;
  gatewayCredential: string;
  diagnostics: {
    authStatus: number | null;
    pilotStatus: number | null;
    authAttempts: number;
    pilotAttempts: number;
    pilotVerified: boolean;
    canUseAi: boolean;
    providerCredentialPresent: boolean;
    gatewayCredentialPresent: boolean;
    gatewayCredentialSource: 'env' | 'oidc_helper' | 'none';
    explicitOpenRouterPresent: boolean;
    readinessReason: 'session_missing' | 'session_invalid' | 'auth_unavailable' | 'pilot_unavailable' | 'pilot_not_authorized' | 'request_cancelled' | 'ai_not_authorized' | 'provider_credential_missing' | 'ready';
  };
}>;
export function runtimeBlockResponse(runtime: Awaited<ReturnType<typeof resolvePilotRuntime>>): Response | null;
export function createProviderAwareFetch(runtime: { useGateway: boolean; gatewayCredential: string }, fetchImpl?: typeof fetch): typeof fetch;
export const pilotPublicConfig: Readonly<{
  supabaseUrl: string;
  supabasePublishableKey: string;
  defaultModel: string;
}>;
