export function resolvePilotRuntime(request: Request, baseEnv?: Record<string, string | undefined>, fetchImpl?: typeof fetch): Promise<{
  env: Record<string, string | undefined>;
  useGateway: boolean;
  gatewayCredential: string;
}>;
export function createProviderAwareFetch(runtime: { useGateway: boolean; gatewayCredential: string }, fetchImpl?: typeof fetch): typeof fetch;
export const pilotPublicConfig: Readonly<{
  supabaseUrl: string;
  supabasePublishableKey: string;
  defaultModel: string;
}>;
