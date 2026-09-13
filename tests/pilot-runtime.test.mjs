import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createProviderAwareFetch, resolvePilotRuntime, runtimeBlockResponse } from '../server/pilot-runtime.mjs';

const owner = '11111111-1111-4111-8111-111111111111';
const request = (token = '') => new Request('https://preview.invalid/api/jarvis-chat', {
  method: 'POST', headers: token ? { Authorization: `Bearer ${token}` } : {}
});
const noOidc = async () => '';

test('pre-write response distinguishes access failures and allows refresh only for invalid session', async () => {
  for (const [reason, status] of [['session_missing', 401], ['session_invalid', 401], ['auth_unavailable', 503], ['pilot_unavailable', 503], ['pilot_not_authorized', 403], ['ai_not_authorized', 403], ['provider_credential_missing', 503]]) {
    const response = runtimeBlockResponse({ env: {}, diagnostics: { readinessReason: reason } });
    assert.equal(response.status, status);
    const data = await response.json();
    assert.equal(data.errorCode, reason); assert.equal(data.stage, 'access'); assert.equal(data.persisted, false);
  }
  assert.equal(runtimeBlockResponse({ env: { JARVIS_CHAT_ENABLED: 'true' }, diagnostics: { readinessReason: 'ready' } }), null);
  assert.equal((await runtimeBlockResponse({ env: { JARVIS_CHAT_ENABLED: 'false' }, diagnostics: { readinessReason: 'ready' } }).json()).errorCode, 'chat_flag_disabled');
});

test('rate limits and forbidden access are not retried or treated as expired sessions', async () => {
  for (const status of [403, 429]) {
    let calls = 0;
    const runtime = await resolvePilotRuntime(request('private-token'), {}, async () => { calls++; return Response.json({}, { status }); }, noOidc);
    assert.equal(calls, 1); assert.equal(runtime.diagnostics.readinessReason, 'auth_unavailable');
    assert.equal(runtime.diagnostics.authStatus, status);
  }
});

test('malformed Auth or membership data cannot enable AI', async () => {
  for (const authData of [{}, { id: '' }]) {
    const runtime = await resolvePilotRuntime(request('session'), {}, async () => Response.json(authData), noOidc);
    assert.equal(runtime.diagnostics.readinessReason, 'auth_unavailable');
  }
  for (const pilotData of [{}, [{ owner_id: 'other-owner', can_use_ai: true }]]) {
    const runtime = await resolvePilotRuntime(request('session'), { VERCEL_OIDC_TOKEN: 'oidc-test' }, async url => Response.json(String(url).includes('/auth/') ? { id: owner } : pilotData), noOidc);
    assert.equal(runtime.diagnostics.pilotVerified, false);
    assert.equal(runtime.env.JARVIS_CHAT_ENABLED, 'false');
  }
});

test('cancelled verification does not retry or enable a model call', async () => {
  const controller = new AbortController(); let calls = 0;
  const req = new Request('https://preview.invalid/api/jarvis-chat', { headers: { Authorization: 'Bearer synthetic' }, signal: controller.signal });
  const runtime = await resolvePilotRuntime(req, {}, async () => { calls++; controller.abort(); throw new Error('cancelled'); }, noOidc);
  assert.equal(calls, 1); assert.equal(runtime.diagnostics.readinessReason, 'request_cancelled');
  assert.equal(runtime.env.JARVIS_CHAT_ENABLED, 'false');
});

test('expired session is distinct from unavailable Auth and from missing pilot', async () => {
  const invalid = await resolvePilotRuntime(request('private-token'), {}, async () => Response.json({}, { status: 401 }), noOidc);
  assert.equal(invalid.diagnostics.readinessReason, 'session_invalid');
  assert.equal(invalid.diagnostics.authStatus, 401);
  assert.equal(invalid.diagnostics.authAttempts, 1);
  const unavailable = await resolvePilotRuntime(request('private-token'), {}, async () => { throw new Error('private upstream details'); }, noOidc);
  assert.equal(unavailable.diagnostics.readinessReason, 'auth_unavailable');
  assert.equal(unavailable.diagnostics.authAttempts, 2);
  assert.doesNotMatch(JSON.stringify(unavailable.diagnostics), /private-token|private upstream details/);
  const missing = await resolvePilotRuntime(request('session'), {}, fakeFetch({ member: false }), noOidc);
  assert.equal(missing.diagnostics.readinessReason, 'pilot_not_authorized');
});

test('one transient read retry recovers membership without bypassing approval', async () => {
  let reads = 0;
  const runtime = await resolvePilotRuntime(request('session'), { VERCEL_OIDC_TOKEN: 'oidc-test' }, async (url) => {
    if (String(url).includes('/auth/')) return Response.json({ id: owner });
    reads++;
    return reads === 1 ? Response.json({}, { status: 503 }) : Response.json([{ owner_id: owner, can_use_ai: true }]);
  }, noOidc);
  assert.equal(runtime.diagnostics.readinessReason, 'ready');
  assert.equal(runtime.diagnostics.pilotAttempts, 2);
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
  const runtime = await resolvePilotRuntime(request(), {}, fakeFetch(), noOidc);
  assert.match(runtime.env.SUPABASE_URL, /^https:\/\/rkkpbmzrucaghrojujvb\.supabase\.co$/);
  assert.match(runtime.env.SUPABASE_ANON_KEY, /^sb_publishable_/);
  assert.equal(runtime.env.JARVIS_KNOWLEDGE_ENABLED, 'true');
  assert.equal(runtime.env.JARVIS_CHAT_ENABLED, 'false');
  assert.equal(runtime.useGateway, false);
  assert.equal(runtime.diagnostics.gatewayCredentialSource, 'none');
});

test('authenticated pilot membership replaces a manual user-id allowlist', async () => {
  const runtime = await resolvePilotRuntime(request('session'), {}, fakeFetch({ model: 'openai/test-model' }), noOidc);
  assert.equal(runtime.env.JARVIS_ALLOWED_USER_IDS, owner);
  assert.equal(runtime.env.JARVIS_MODEL, 'openai/test-model');
  assert.equal(runtime.env.JARVIS_CHAT_ENABLED, 'false');
});

test('AI stays disabled for an authenticated non-member', async () => {
  const runtime = await resolvePilotRuntime(request('session'), { VERCEL_OIDC_TOKEN: 'oidc-test' }, fakeFetch({ member: false, canUseAi: true }), noOidc);
  assert.notEqual(runtime.env.JARVIS_ALLOWED_USER_IDS, owner);
  assert.equal(runtime.env.JARVIS_CHAT_ENABLED, 'false');
});

test('Vercel OIDC env activates Gateway only after database approval', async () => {
  const runtime = await resolvePilotRuntime(request('session'), { VERCEL_OIDC_TOKEN: 'oidc-test' }, fakeFetch({ canUseAi: true }), noOidc);
  assert.equal(runtime.env.JARVIS_ALLOWED_USER_IDS, owner);
  assert.equal(runtime.env.JARVIS_CHAT_ENABLED, 'true');
  assert.equal(runtime.useGateway, true);
  assert.equal(runtime.gatewayCredential, 'oidc-test');
  assert.equal(runtime.diagnostics.gatewayCredentialSource, 'env');
});

test('official Vercel OIDC helper activates Gateway when env credential is absent', async () => {
  const runtime = await resolvePilotRuntime(
    request('session'),
    {},
    fakeFetch({ canUseAi: true }),
    async () => 'oidc-from-helper'
  );
  assert.equal(runtime.env.JARVIS_ALLOWED_USER_IDS, owner);
  assert.equal(runtime.env.JARVIS_CHAT_ENABLED, 'true');
  assert.equal(runtime.useGateway, true);
  assert.equal(runtime.gatewayCredential, 'oidc-from-helper');
  assert.equal(runtime.diagnostics.providerCredentialPresent, true);
  assert.equal(runtime.diagnostics.gatewayCredentialSource, 'oidc_helper');
  assert.equal(runtime.diagnostics.readinessReason, 'ready');
});

test('explicit OpenRouter configuration wins over Gateway OIDC', async () => {
  let oidcCalls = 0;
  const runtime = await resolvePilotRuntime(
    request('session'),
    { OPENROUTER_API_KEY: 'or-test', VERCEL_OIDC_TOKEN: 'oidc-test' },
    fakeFetch({ canUseAi: true }),
    async () => { oidcCalls += 1; return 'should-not-be-used'; }
  );
  assert.equal(runtime.useGateway, false);
  assert.equal(runtime.env.OPENROUTER_API_KEY, 'or-test');
  assert.equal(oidcCalls, 0);
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
