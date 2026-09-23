export const jarvisLiveModel: string;

export function resolveLiveGatewayCredential(
  env?: Record<string, string | undefined>,
  oidcResolver?: () => Promise<string>
): Promise<string>;

export function resolveOpenAIProjectKey(
  env?: Record<string, string | undefined>
): string;

export function createJarvisLiveTokenHandler(options?: {
  env?: Record<string, string | undefined>;
  fetchImpl?: typeof fetch;
  oidcResolver?: () => Promise<string>;
}): (request: Request) => Promise<Response>;
