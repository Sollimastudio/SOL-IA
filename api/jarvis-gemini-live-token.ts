import { createJarvisGeminiLiveTokenHandler } from '../server/jarvis-gemini-live-token.mjs';

const handler = createJarvisGeminiLiveTokenHandler({ env: process.env });

export default {
  async fetch(request: Request) {
    return handler(request);
  }
};
