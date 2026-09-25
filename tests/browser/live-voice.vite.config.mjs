// TEST ONLY. Production uses vite.config.ts and the real clients/authentication.
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { fileURLToPath } from 'node:url';
const here = path => fileURLToPath(new URL(path, import.meta.url));
export default defineConfig({
  root: here('../../'), plugins: [react()],
  resolve: { alias: [
    { find: /^(?:.*\/)core\/geminiLiveClient\.mjs$/, replacement: here('./live-voice.adapters.ts') },
    { find: /^(?:.*\/)services\/authService$/, replacement: here('./live-voice.adapters.ts') }
  ] },
  server: { host: '127.0.0.1', port: 4183, strictPort: true, allowedHosts: ['terminal.local'] }
});
