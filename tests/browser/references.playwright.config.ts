import { defineConfig } from '@playwright/test';
import { fileURLToPath } from 'node:url';
export default defineConfig({
  testDir:'.',testMatch:'references.spec.ts',timeout:30000,workers:1,retries:0,reporter:'list',outputDir:'../../test-results/references',
  use:{baseURL:'http://127.0.0.1:4179',trace:'retain-on-failure'},
  projects:[{name:'desktop',use:{browserName:'chromium',viewport:{width:1280,height:900}}},{name:'mobile-layout',use:{browserName:'chromium',viewport:{width:390,height:844},isMobile:true,hasTouch:true}}],
  webServer:{cwd:fileURLToPath(new URL('../../',import.meta.url)),command:'npx vite --config tests/browser/login.vite.config.mjs',url:'http://127.0.0.1:4179',reuseExistingServer:process.env.REFERENCE_BROWSER_REUSE==='1',timeout:30000}
});
