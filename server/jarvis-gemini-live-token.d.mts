export const jarvisGeminiLiveModel: string;
export function resolveGeminiApiKey(env?: Record<string, string | undefined>): string;
export function createJarvisGeminiLiveTokenHandler(options?: {
  env?: Record<string, string | undefined>;
  fetchImpl?: typeof fetch;
}): (request: Request) => Promise<Response>;
