import assert from 'node:assert/strict';
import test from 'node:test';
import { createJarvisGeminiLiveTokenHandler, jarvisGeminiLiveModel } from '../server/jarvis-gemini-live-token.mjs';

const baseEnv = {
  SUPABASE_URL: 'https://example.supabase.co',
  SUPABASE_PUBLISHABLE_KEY: 'sb_publishable_test'
};

const json = (data, status = 200) => Response.json(data, { status, headers: { 'Content-Type': 'application/json' } });

function authedFetch({ tokenStatus = 200 } = {}) {
  return async (url, init = {}) => {
    const value = String(url);
    if (value.endsWith('/auth/v1/user')) return json({ id: 'user-1' });
    if (value.includes('/rest/v1/solia_pilot_users?')) {
      return json([{ owner_id: 'user-1', can_use_ai: true, can_use_realtime: true }]);
    }
    if (value.includes('/v1beta/auth_tokens')) {
      assert.equal(init.headers['x-goog-api-key'], 'gemini-test-key');
      const body = JSON.parse(init.body);
      assert.equal(body.uses, 1);
      assert.equal(body.liveConnectConstraints.model, `models/${jarvisGeminiLiveModel}`);
      assert.deepEqual(body.liveConnectConstraints.config.responseModalities, ['AUDIO']);
      return tokenStatus === 200 ? json({ name: 'ephemeral-gemini-token' }) : json({ error: { message: 'quota' } }, tokenStatus);
    }
    throw new Error(`Unexpected URL: ${url}`);
  };
}

test('Gemini token broker rejects callers without Jarvis session', async () => {
  let calls = 0;
  const handler = createJarvisGeminiLiveTokenHandler({
    env: { ...baseEnv, GEMINI_API_KEY: 'gemini-test-key' },
    fetchImpl: async () => { calls += 1; return json({}); }
  });
  const response = await handler(new Request('https://jarvis.test/api/jarvis-gemini-live-token', { method: 'POST' }));
  assert.equal(response.status, 401);
  assert.equal(calls, 0);
});

test('Gemini token broker never calls Google when server key is missing', async () => {
  let googleCalled = false;
  const handler = createJarvisGeminiLiveTokenHandler({
    env: baseEnv,
    fetchImpl: async (url) => {
      const value = String(url);
      if (value.endsWith('/auth/v1/user')) return json({ id: 'user-1' });
      if (value.includes('/rest/v1/solia_pilot_users?')) {
        return json([{ owner_id: 'user-1', can_use_ai: true, can_use_realtime: true }]);
      }
      googleCalled = true;
      return json({});
    }
  });
  const response = await handler(new Request('https://jarvis.test/api/jarvis-gemini-live-token', {
    method: 'POST',
    headers: { Authorization: 'Bearer user-jwt' }
  }));
  const payload = await response.json();
  assert.equal(response.status, 503);
  assert.equal(payload.errorCode, 'gemini_api_key_missing');
  assert.equal(googleCalled, false);
});

test('Gemini token broker mints one short-lived token only after pilot authorization', async () => {
  const handler = createJarvisGeminiLiveTokenHandler({
    env: { ...baseEnv, GEMINI_API_KEY: 'gemini-test-key' },
    fetchImpl: authedFetch()
  });
  const response = await handler(new Request('https://jarvis.test/api/jarvis-gemini-live-token', {
    method: 'POST',
    headers: { Authorization: 'Bearer user-jwt' }
  }));
  const payload = await response.json();
  assert.equal(response.status, 200);
  assert.equal(payload.ok, true);
  assert.equal(payload.provider, 'gemini');
  assert.equal(payload.token, 'ephemeral-gemini-token');
  assert.equal(payload.model, jarvisGeminiLiveModel);
});

test('Gemini quota errors are surfaced without retries', async () => {
  let tokenCalls = 0;
  const handler = createJarvisGeminiLiveTokenHandler({
    env: { ...baseEnv, GEMINI_API_KEY: 'gemini-test-key' },
    fetchImpl: async (url, init) => {
      if (String(url).includes('/v1beta/auth_tokens')) tokenCalls += 1;
      return authedFetch({ tokenStatus: 429 })(url, init);
    }
  });
  const response = await handler(new Request('https://jarvis.test/api/jarvis-gemini-live-token', {
    method: 'POST',
    headers: { Authorization: 'Bearer user-jwt' }
  }));
  const payload = await response.json();
  assert.equal(response.status, 502);
  assert.equal(payload.errorCode, 'gemini_quota_limited');
  assert.equal(tokenCalls, 1);
});
