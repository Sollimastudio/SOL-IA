import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

const buildId = process.env.VERCEL_GIT_COMMIT_SHA || process.env.GITHUB_SHA || 'local';

export default defineConfig({
  plugins: [react()],
  define: {
    __JARVIS_BUILD__: JSON.stringify(buildId)
  }
});
