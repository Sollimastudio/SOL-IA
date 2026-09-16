import assert from 'node:assert/strict';
import test from 'node:test';
import { createJarvisLiveTokenHandler, jarvisLiveModel } from '../server/jarvis-live-token.mjs';

const env = {
  SUPABASE_URL: 'https://example.supabase.co',
  SUPABASE_PUBLISHABLE_KEY: 'sb_publishable_test'
};

function json(data, status = 200) {
  return Response.json(data, { status, headers: { 'Content-Type': 'application/json' } });
}

test('Live token broker rejects unauthenticated callers before provider access', async () => {
  let calls = 0;
  const handler = createJarvisLiveTokenHandler({
    env,
    fetchImpl: async () => { calls += 1; return json({}); },
    oidcResolver: async () => 'gateway-token'
  });
  const response = await handler(new Request('https://jarvis.test/api/jarvis-live-token', { method: 'POST' }));
  assert.equal(response.status, 401);
  assert.equal(calls, 0);
});

test('Live token broker mints only after Supabase pilot authorization', async () => {
  const calls = [];
  const handler = createJarvisLiveTokenHandler({
    env,
    oidcResolver: async () => 'gateway-oidc',
    fetchImpl: async (url, init = {}) => {
      calls.push({ url: String(url), init });
      if (String(url).endsWith('/auth/v1/user')) return json({ id: 'user-1' });
      if (String(url).includes('/rest/v1/solia_pilot_users?')) {
        return json([{ owner_id: 'user-1', can_use_ai: true, can_use_realtime: true }]);
      }
      if (String(url).includes('/v1/realtime/client-secrets')) {
        assert.equal(init.headers.Authorization, 'Bearer gateway-oidc');
        assert.deepEqual(JSON.parse(init.body), { model: 'openai/gpt-live-1', routeKind: 'live' });
        return json({ token: 'single-use-live-token', expiresAt: Math.floor(Date.now() / 1000) + 60 });
      }
      throw new Error(`Unexpected URL: ${url}`);
    }
  });

  const response = await handler(new Request('https://jarvis.test/api/jarvis-live-token', {
    method: 'POST', headers: { Authorization: 'Bearer user-jwt' }
  }));
  const payload = await response.json();
  assert.equal(response.status, 200);
  assert.equal(payload.ok, true);
  assert.equal(payload.model, jarvisLiveModel);
  assert.equal(payload.token, 'single-use-live-token');
  assert.equal(payload.pricing.usdPerMinute, 0.05);
  assert.equal(calls.length, 3);
});

test('Live token broker refuses pilot users whose realtime gate is off', async () => {
  let providerCalled = false;
  const handler = createJarvisLiveTokenHandler({
    env,
    oidcResolver: async () => 'gateway-oidc',
    fetchImpl: async (url) => {
      if (String(url).endsWith('/auth/v1/user')) return json({ id: 'user-1' });
      if (String(url).includes('/rest/v1/solia_pilot_users?')) {
        return json([{ owner_id: 'user-1', can_use_ai: true, can_use_realtime: false }]);
      }
      providerCalled = true;
      return json({ token: 'should-not-exist', expiresAt: Math.floor(Date.now() / 1000) + 60 });
    }
  });
  const response = await handler(new Request('https://jarvis.test/api/jarvis-live-token', {
    method: 'POST', headers: { Authorization: 'Bearer user-jwt' }
  }));
  assert.equal(response.status, 403);
  assert.equal(providerCalled, false);
});
