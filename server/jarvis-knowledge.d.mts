export function createKnowledgeHandler(options?: {
  env?: Record<string, string | undefined>;
  fetchImpl?: typeof fetch;
}): (request: Request) => Promise<Response>;
