import { createKnowledgeHandler } from '../server/jarvis-knowledge.mjs';
import { resolvePilotRuntime } from '../server/pilot-runtime.mjs';

export default {
  async fetch(request: Request) {
    const runtime = await resolvePilotRuntime(request, process.env);
    return createKnowledgeHandler({ env: runtime.env })(request);
  }
};
