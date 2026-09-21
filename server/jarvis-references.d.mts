export function createReferencesHandler(options?: { env?: Record<string, string | undefined>; fetchImpl?: typeof fetch }): (request: Request) => Promise<Response>;
