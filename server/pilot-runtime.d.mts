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
    pilotVerified: boolean;
    canUseAi: boolean;
    providerCredentialPresent: boolean;
    gatewayCredentialPresent: boolean;
    gatewayCredentialSource: 'env' | 'oidc_helper' | 'none';
    explicitOpenRouterPresent: boolean;
    readinessReason: 'pilot_not_verified' | 'ai_not_authorized' | 'provider_credential_missing' | 'ready';
  };
}>;
export function createProviderAwareFetch(runtime: { useGateway: boolean; gatewayCredential: string }, fetchImpl?: typeof fetch): typeof fetch;
export const pilotPublicConfig: Readonly<{
  supabaseUrl: string;
  supabasePublishableKey: string;
  defaultModel: string;
}>;
