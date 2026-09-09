export function withAntiFatigue(
  baseHandler: (request: Request) => Promise<Response>
): (request: Request) => Promise<Response>;
