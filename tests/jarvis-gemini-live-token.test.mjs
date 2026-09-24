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
      // REST AuthToken schema, independently checked against Google's reference.
      // liveConnectConstraints is converted by the SDK; it is not a wire field.
      assert.equal(Object.hasOwn(body, 'liveConnectConstraints'), false);
      assert.equal(body.bidiGenerateContentSetup.model, `models/${jarvisGeminiLiveModel}`);
      assert.deepEqual(body.bidiGenerateContentSetup.generationConfig.responseModalities, ['AUDIO']);
      assert.equal(body.fieldMask, 'model,generationConfig.responseModalities');
      assert.ok(Date.parse(body.expireTime) > Date.now());
      assert.ok(Date.parse(body.newSessionExpireTime) < Date.parse(body.expireTime));
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

const authorizedRequest = () => new Request('https://jarvis.test/api/jarvis-gemini-live-token', {
  method: 'POST', headers: { Authorization: 'Bearer user-jwt' }
});

test('REST mask preserves client voice, prompt, transcription, tools and resumption settings', async () => {
  let wire;
  const handler = createJarvisGeminiLiveTokenHandler({
    env: { ...baseEnv, GEMINI_API_KEY: 'gemini-test-key' },
    fetchImpl: async (url, init) => {
      if (String(url).includes('/auth_tokens')) wire = JSON.parse(init.body);
      return authedFetch()(url, init);
    }, logger: { info() {} }
  });
  assert.equal((await handler(authorizedRequest())).status, 200);
  const clientSetup = {
    model: 'models/other-model', generationConfig: {
      responseModalities: ['TEXT'], speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Puck' } } }
    },
    systemInstruction: { parts: [{ text: 'Owner-authorized instructions' }] },
    inputAudioTranscription: {}, outputAudioTranscription: {},
    tools: [{ functionDeclarations: [{ name: 'consult_jarvis' }] }],
    sessionResumption: { handle: 'client-resumption-handle' }
  };
  // Apply the documented partial-lock semantics independently of the broker.
  const effective = structuredClone(clientSetup);
  for (const path of wire.fieldMask.split(',')) {
    const keys = path.split('.');
    let target = effective; let locked = wire.bidiGenerateContentSetup;
    for (const key of keys.slice(0, -1)) { target = target[key]; locked = locked[key]; }
    target[keys.at(-1)] = locked[keys.at(-1)];
  }
  assert.deepEqual(effective, { ...clientSetup, model: `models/${jarvisGeminiLiveModel}`,
    generationConfig: { ...clientSetup.generationConfig, responseModalities: ['AUDIO'] } });
});

test('400 diagnostics identify unknown fields without leaking echoed secrets or private text', async () => {
  const logs = [];
  const secrets = ['gemini-test-key', 'user-jwt', 'auth_tokens/private-secret', 'private-owner-memory'];
  let attempts = 0;
  const handler = createJarvisGeminiLiveTokenHandler({
    env: { ...baseEnv, GEMINI_API_KEY: secrets[0] }, logger: { info: (...args) => logs.push(args) },
    fetchImpl: async (url, init) => {
      if (!String(url).includes('/auth_tokens')) return authedFetch()(url, init);
      attempts += 1;
      return json({ error: { status: 'INVALID_ARGUMENT',
        message: `Unknown name "liveConnectConstraints": Cannot find field. ${secrets.join(' ')}`,
        details: [{ reason: secrets[0], metadata: { key: secrets[0] }, fieldViolations: [
          { field: 'liveConnectConstraints', description: secrets[1] }, { field: secrets[3] }
        ] }] } }, 400);
    }
  });
  const response = await handler(authorizedRequest()); const payload = await response.json();
  assert.equal(response.status, 502); assert.equal(payload.providerStatus, 400); assert.equal(attempts, 1);
  const diagnostic = JSON.parse(logs[0][1]);
  assert.equal(diagnostic.cause, 'unknown_field');
  assert.equal(diagnostic.providerCode, 'INVALID_ARGUMENT');
  assert.deepEqual(diagnostic.fields, ['liveConnectConstraints']);
  for (const secret of secrets) assert.equal(JSON.stringify({ logs, payload }).includes(secret), false);
});

test('Google API_KEY_INVALID at HTTP 400 is a credential error, without changing login', async () => {
  const logs = [];
  const handler = createJarvisGeminiLiveTokenHandler({
    env: { ...baseEnv, GEMINI_API_KEY: 'gemini-test-key' }, logger: { info: (...args) => logs.push(args) },
    fetchImpl: async (url, init) => String(url).includes('/auth_tokens')
      ? json({ error: { status: 'INVALID_ARGUMENT', message: 'API key not valid. Please pass a valid API key.',
        details: [{ reason: 'API_KEY_INVALID' }] } }, 400) : authedFetch()(url, init)
  });
  const response = await handler(authorizedRequest());
  assert.equal(response.status, 502);
  assert.equal((await response.json()).errorCode, 'gemini_key_not_authorized');
  assert.equal(JSON.parse(logs[0][1]).cause, 'api_key_invalid');
});

test('malformed provider errors fail safely and never expose raw upstream response', async () => {
  const logs = [];
  const handler = createJarvisGeminiLiveTokenHandler({
    env: { ...baseEnv, GEMINI_API_KEY: 'gemini-test-key' }, logger: { info: (...args) => logs.push(args) },
    fetchImpl: async (url, init) => String(url).includes('/auth_tokens')
      ? new Response('<html>gemini-test-key</html>', { status: 500 }) : authedFetch()(url, init)
  });
  const response = await handler(authorizedRequest());
  assert.equal(response.status, 502);
  assert.equal(JSON.parse(logs[0][1]).cause, 'provider_rejected');
  assert.equal(JSON.stringify(logs).includes('gemini-test-key'), false);
});

test('an unauthorized or cross-owner pilot never reaches Google', async () => {
  for (const pilot of [null, { owner_id: 'another-owner', can_use_ai: true, can_use_realtime: true },
    { owner_id: 'user-1', can_use_ai: true, can_use_realtime: false }]) {
    let googleCalls = 0;
    const handler = createJarvisGeminiLiveTokenHandler({
      env: { ...baseEnv, GEMINI_API_KEY: 'gemini-test-key' },
      fetchImpl: async url => {
        if (String(url).endsWith('/auth/v1/user')) return json({ id: 'user-1' });
        if (String(url).includes('/solia_pilot_users?')) return json(pilot ? [pilot] : []);
        googleCalls += 1; return json({ name: 'unexpected' });
      }
    });
    assert.equal((await handler(authorizedRequest())).status, 403);
    assert.equal(googleCalls, 0);
  }
});

test('successful logs and response preserve the ephemeral-only credential boundary', async () => {
  const logs = [];
  const handler = createJarvisGeminiLiveTokenHandler({
    env: { ...baseEnv, GEMINI_API_KEY: 'gemini-test-key' }, fetchImpl: authedFetch(),
    logger: { info: (...args) => logs.push(args) }
  });
  const response = await handler(authorizedRequest()); const payload = await response.json();
  assert.equal(response.headers.get('cache-control'), 'private, no-store');
  assert.equal(payload.token, 'ephemeral-gemini-token');
  assert.equal(JSON.stringify(logs).includes(payload.token), false);
  assert.equal(JSON.stringify({ logs, payload }).includes('gemini-test-key'), false);
});
