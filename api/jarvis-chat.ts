import { createJarvisHandler } from '../server/jarvis-chat.mjs';
import { withAntiFatigue } from '../server/anti-fatigue-handler.mjs';
import { routeCapability } from '../src/core/capabilityRouter.js';

// Existing router reused server-side. No API key is imported by the browser.
const secureChat = createJarvisHandler({ env: process.env, routeInput: routeCapability });

export default {
  fetch: withAntiFatigue(secureChat)
};
