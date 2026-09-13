// TEST ONLY. Production uses the repository's normal Vite configuration.
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { fileURLToPath } from 'node:url';
const here = path => fileURLToPath(new URL(path, import.meta.url));
export default defineConfig({
  root: here('../../'),
  plugins: [react()],
  resolve: { alias: [
    { find: /^(?:.*\/)?core\/budgetPolicy(?:\.ts)?$/, replacement: here('./budget-policy.mock.ts') },
    { find: /^(?:.*\/)?services\/authService(?:\.ts)?$/, replacement: here('./auth-service.mock.ts') },
    { find: /^(?:.*\/)?services\/supabaseClient(?:\.ts)?$/, replacement: here('./supabase-client.mock.ts') }
  ] },
  server: { host: '127.0.0.1', port: 4179, strictPort: true }
});
