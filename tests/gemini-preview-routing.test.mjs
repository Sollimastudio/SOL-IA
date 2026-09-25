import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const config = JSON.parse(fs.readFileSync('vercel.json', 'utf8'));
const preview = 'sol-ia-i5wy-git-work-fix-gemini-live-782643-sol-limas-projects.vercel.app';
const legacy = 'sol-ia-i5wy-git-work-jarvis-neural-co-13a334-sol-limas-projects.vercel.app';

function hostMatches(condition, host) {
  assert.equal(condition.type, 'host');
  const value = condition.value;
  return typeof value === 'string' ? host === value : host.startsWith(value.pre) && host.endsWith(value.suf);
}
function redirects(host) {
  return config.redirects.filter(rule => rule.has.every(c => hostMatches(c, host)) &&
    rule.missing.every(c => !hostMatches(c, host)));
}

test('Gemini validation branch must execute its own deployment, not the legacy voice code', () => {
  assert.deepEqual(redirects(preview), []);
});

test('preview exception preserves production, legacy redirect and security headers', () => {
  assert.deepEqual(redirects('sol-ia-i5wy.vercel.app'), []);
  assert.deepEqual(redirects(legacy), []);
  const oldRoute = redirects('sol-ia-i5wy-another-deploy-sol-limas-projects.vercel.app');
  assert.equal(oldRoute.length, 1);
  assert.equal(oldRoute[0].destination, `https://${legacy}/:path*`);
  assert.equal(oldRoute[0].permanent, false);
  const headers = Object.fromEntries(config.headers[0].headers.map(h => [h.key, h.value]));
  assert.equal(headers['X-Frame-Options'], 'DENY');
  assert.equal(headers['X-Content-Type-Options'], 'nosniff');
  assert.equal(headers['Permissions-Policy'], 'camera=(self), microphone=(self), geolocation=(), payment=(), usb=()');
});
