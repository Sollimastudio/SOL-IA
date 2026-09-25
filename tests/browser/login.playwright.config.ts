import { defineConfig } from '@playwright/test';
import { fileURLToPath } from 'node:url';
export default defineConfig({
  testDir: '.', testMatch: ['login.spec.ts', 'chat.spec.ts', 'install.spec.ts', 'capture.spec.ts', 'jarvis-mobile-boot.spec.ts'], timeout: 20000,
  fullyParallel: true, workers: 2, retries: 0,
  outputDir: '../../test-results/login', reporter: 'list',
  use: { baseURL: 'http://127.0.0.1:4179', trace: 'retain-on-failure' },
  projects: [
    { name: 'desktop', use: { browserName: 'chromium', viewport: { width: 1280, height: 800 } } },
    { name: 'webkit-mobile', use: { browserName: 'webkit', viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true } },
    { name: 'mobile-layout', use: { browserName: 'chromium', viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true } }
  ],
  webServer: {
    cwd: fileURLToPath(new URL('../../', import.meta.url)),
    command: 'npx vite --config tests/browser/login.vite.config.mjs',
    url: 'http://127.0.0.1:4179', reuseExistingServer: false, timeout: 30000
  }
});
