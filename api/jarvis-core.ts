import { createJarvisCoreHandler } from '../server/jarvis-core.mjs';

export default {
  async fetch(request: Request) {
    const handle = createJarvisCoreHandler({ env: process.env, fetchImpl: globalThis.fetch });
    return handle(request);
  }
};
