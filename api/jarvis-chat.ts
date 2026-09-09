import { createJarvisHandler } from '../server/jarvis-chat.mjs';
import { routeCapability } from '../src/core/capabilityRouter.js';

// Existing router reused server-side. No API key is imported by the browser.
export default {
  fetch: createJarvisHandler({ env: process.env, routeInput: routeCapability })
};
