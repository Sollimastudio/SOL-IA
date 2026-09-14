import { createJarvisHandler } from '../server/jarvis-chat.mjs';
import { resolvePilotRuntime, runtimeBlockResponse } from '../server/pilot-runtime.mjs';
import { normalizeContinuityCues } from '../server/continuity-cues.mjs';
import { classifyContinuity, loadContinuityPacket, persistContinuityFromResponse, readConversationEnvelope } from '../server/continuity-runtime.mjs';

export default {
  async fetch(request: Request) {
    const envelope = await readConversationEnvelope(request);
    const runtime = await resolvePilotRuntime(request, process.env, globalThis.fetch, undefined, { resolveProvider: false });
    // Capture uses existing authenticated vault permission, independent of AI allowance/credentials.
    if (!runtime.diagnostics.pilotVerified || request.signal.aborted) return runtimeBlockResponse(runtime)!;
    const packet = envelope?.mode === 'private'
      ? await loadContinuityPacket({ request, env: runtime.env, envelope, fetchImpl: globalThis.fetch })
      : [];
    const classification = envelope?.mode === 'private'
      ? classifyContinuity(normalizeContinuityCues(envelope.message), packet, null)
      : null;
    const response = await createJarvisHandler({ env: runtime.env, captureOnly: true })(request);
    return persistContinuityFromResponse({ request, env: runtime.env, envelope, classification, response, fetchImpl: globalThis.fetch });
  }
};
