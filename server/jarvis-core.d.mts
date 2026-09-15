export const JARVIS_CORE_VERSION: string;
export function createJarvisCoreHandler(options?: {
  env?: Record<string, string | undefined>;
  fetchImpl?: typeof fetch;
}): (request: Request) => Promise<Response>;
