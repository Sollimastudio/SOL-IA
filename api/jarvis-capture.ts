import { createJarvisHandler } from '../server/jarvis-chat.mjs';
import { resolvePilotRuntime, runtimeBlockResponse } from '../server/pilot-runtime.mjs';

export default {
  async fetch(request: Request) {
    const runtime = await resolvePilotRuntime(request, process.env, globalThis.fetch, undefined, { resolveProvider: false });
    // Capture uses existing authenticated vault permission, independent of AI allowance/credentials.
    if (!runtime.diagnostics.pilotVerified || request.signal.aborted) return runtimeBlockResponse(runtime)!;
    return createJarvisHandler({ env: runtime.env, captureOnly: true })(request);
  }
};
