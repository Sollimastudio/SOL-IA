export function createJarvisHandler(options?: {
  env?: Record<string, string | undefined>;
  captureOnly?: boolean;
  fetchImpl?: typeof fetch;
  routeInput?: (input: string) => { primarySpecialist: string };
}): (request: Request) => Promise<Response>;
export function selectMemories(rows: Array<Record<string, unknown>>, query: string, ownerId: string): Array<Record<string, unknown>>;
