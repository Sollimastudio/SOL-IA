import { createJarvisLiveTokenHandler } from '../server/jarvis-live-token.mjs';

const handler = createJarvisLiveTokenHandler({ env: process.env });

export default {
  async fetch(request: Request) {
    return handler(request);
  }
};
