import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createProviderAwareFetch, resolvePilotRuntime } from '../server/pilot-runtime.mjs';

const owner = '11111111-1111-4111-8111-111111111111';
const request = (token = '') => new Request('https://preview.invalid/api/jarvis-chat', {
  method: 'POST', headers: token ? { Authorization: `Bearer ${token}` } : {}
});

function fakeFetch({ canUseAi = false, model = 'openai/gpt-5.6-sol', member = true } = {}) {
  return async (url) => {
    const value = String(url);
    if (value.includes('/auth/v1/user')) return Response.json({ id: owner });
    if (value.includes('/rest/v1/solia_pilot_users')) return Response.json(member ? [{ owner_id: owner, can_use_ai: canUseAi, model }] : []);
    throw new Error(`unexpected ${value}`);
  };
}

test('fallback public Supabase config is available without Vercel env vars', async () => {
  const runtime = await resolvePilotRuntime(request(), {}, fakeFetch());
  assert.match(runtime.env.SUPABASE_URL, /^https:\/\/rkkpbmzrucaghrojujvb\.supabase\.co$/);
  assert.match(runtime.env.SUPABASE_ANON_KEY, /^sb_publishable_/);
  assert.equal(runtime.env.JARVIS_KNOWLEDGE_ENABLED, 'true');
  assert.equal(runtime.env.JARVIS_CHAT_ENABLED, 'false');
  assert.equal(runtime.useGateway, false);
});

test('authenticated pilot membership replaces a manual user-id allowlist', async () => {
  const runtime = await resolvePilotRuntime(request('session'), {}, fakeFetch({ model: 'openai/test-model' }));
  assert.equal(runtime.env.JARVIS_ALLOWED_USER_IDS, owner);
  assert.equal(runtime.env.JARVIS_MODEL, 'openai/test-model');
  assert.equal(runtime.env.JARVIS_CHAT_ENABLED, 'false');
});

test('AI stays disabled for an authenticated non-member', async () => {
  const runtime = await resolvePilotRuntime(request('session'), { VERCEL_OIDC_TOKEN: 'oidc-test' }, fakeFetch({ member: false, canUseAi: true }));
  assert.notEqual(runtime.env.JARVIS_ALLOWED_USER_IDS, owner);
  assert.equal(runtime.env.JARVIS_CHAT_ENABLED, 'false');
});

test('Vercel OIDC activates Gateway only after database approval', async () => {
  const runtime = await resolvePilotRuntime(request('session'), { VERCEL_OIDC_TOKEN: 'oidc-test' }, fakeFetch({ canUseAi: true }));
  assert.equal(runtime.env.JARVIS_ALLOWED_USER_IDS, owner);
  assert.equal(runtime.env.JARVIS_CHAT_ENABLED, 'true');
  assert.equal(runtime.useGateway, true);
  assert.equal(runtime.gatewayCredential, 'oidc-test');
});

test('explicit OpenRouter configuration wins over Gateway OIDC', async () => {
  const runtime = await resolvePilotRuntime(request('session'), { OPENROUTER_API_KEY: 'or-test', VERCEL_OIDC_TOKEN: 'oidc-test' }, fakeFetch({ canUseAi: true }));
  assert.equal(runtime.useGateway, false);
  assert.equal(runtime.env.OPENROUTER_API_KEY, 'or-test');
});

test('provider-aware transport rewrites only the model provider call', async () => {
  const seen = [];
  const baseFetch = async (url, init = {}) => { seen.push({ url: String(url), headers: new Headers(init.headers || {}) }); return Response.json({ ok: true }); };
  const providerFetch = createProviderAwareFetch({ useGateway: true, gatewayCredential: 'oidc-secret' }, baseFetch);
  await providerFetch('https://openrouter.ai/api/v1/chat/completions', { headers: { Authorization: 'Bearer placeholder' } });
  await providerFetch('https://example.supabase.co/auth/v1/user', { headers: {} });
  assert.equal(seen[0].url, 'https://ai-gateway.vercel.sh/v1/chat/completions');
  assert.equal(seen[0].headers.get('authorization'), 'Bearer oidc-secret');
  assert.equal(seen[1].url, 'https://example.supabase.co/auth/v1/user');
});
