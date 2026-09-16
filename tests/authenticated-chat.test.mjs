import { test } from 'node:test';
import assert from 'node:assert/strict';
import { sendAuthenticatedChat, UnsentMessageError } from '../src/services/authenticatedChat.mjs';

const session = token => ({ access_token: token, user: { id: 'sol-test' } });
const rejected = () => Response.json({ ok: false, errorCode: 'session_invalid', stage: 'access', persisted: false }, { status: 401 });
const options = extra => ({ body: '{"message":"synthetic"}', userId: 'sol-test', signal: new AbortController().signal,
  getSession: async () => session('current'), refreshSession: async () => session('refreshed'), ...extra });

test('uses the latest SDK token for every send', async () => {
  let token = 'first'; const seen = [];
  const args = options({ getSession: async () => session(token), fetchImpl: async (_url, init) => {
    seen.push(init.headers.Authorization); return Response.json({ ok: true });
  } });
  await sendAuthenticatedChat(args); token = 'renewed'; await sendAuthenticatedChat(args);
  assert.deepEqual(seen, ['Bearer first', 'Bearer renewed']);
});

test('adds explicit application headers without replacing auth or content type', async () => {
  let headers;
  await sendAuthenticatedChat(options({
    extraHeaders: { 'X-Jarvis-Live-Delegation': '1' },
    fetchImpl: async (_url, init) => { headers = init.headers; return Response.json({ ok: true }); }
  }));
  assert.equal(headers.Authorization, 'Bearer current');
  assert.equal(headers['Content-Type'], 'application/json');
  assert.equal(headers['X-Jarvis-Live-Delegation'], '1');
});

test('refreshes once and replays only an explicit rejection before any write', async () => {
  let token = 'expired', refreshes = 0; const seen = [];
  const response = await sendAuthenticatedChat(options({ getSession: async () => session(token),
    refreshSession: async () => { refreshes++; token = 'renewed'; return session(token); },
    fetchImpl: async (_url, init) => { seen.push(init.headers.Authorization); return rejected(); }
  }));
  assert.equal(response.status, 401);
  assert.equal(refreshes, 1);
  assert.deepEqual(seen, ['Bearer expired', 'Bearer renewed']);
});

for (const [name, makeResponse] of [
  ['temporary outage', () => Response.json({ persisted: false }, { status: 503 })],
  ['permission denial', () => Response.json({ persisted: false }, { status: 403 })],
  ['ambiguous 401', () => Response.json({ ok: false }, { status: 401 })],
  ['saved despite 401', () => Response.json({ ok: false, stage: 'access', errorCode: 'session_invalid', persisted: true }, { status: 401 })],
  ['hosting login page', () => new Response('<html>login</html>', { status: 401, headers: { 'Content-Type': 'text/html' } })],
  ['broken JSON', () => new Response('{', { status: 401, headers: { 'Content-Type': 'application/json' } })]
]) test(`does not replay ${name}`, async () => {
  let calls = 0, refreshes = 0;
  await sendAuthenticatedChat(options({ refreshSession: async () => { refreshes++; return session('new'); },
    fetchImpl: async () => { calls++; return makeResponse(); } }));
  assert.equal(calls, 1); assert.equal(refreshes, 0);
});

test('transport failure may have saved: never retries or declares unsent', async () => {
  let calls = 0;
  await assert.rejects(sendAuthenticatedChat(options({ fetchImpl: async () => { calls++; throw new TypeError('network'); } })), error => !(error instanceof UnsentMessageError));
  assert.equal(calls, 1);
});

test('changed account, missing session and SDK outage cannot send private history', async () => {
  for (const read of [async () => null, async () => ({ ...session('new'), user: { id: 'another-user' } }), async () => { throw new Error('SDK private details'); }]) {
    await assert.rejects(sendAuthenticatedChat(options({ getSession: read, fetchImpl: async () => assert.fail('must not send') })), UnsentMessageError);
  }
});

test('signout or mode cancellation during session refresh prevents replay', async () => {
  const controller = new AbortController(); let calls = 0;
  await assert.rejects(sendAuthenticatedChat(options({ signal: controller.signal,
    refreshSession: async () => { controller.abort(); return session('new'); },
    fetchImpl: async () => { calls++; return rejected(); }
  })), { name: 'AbortError' });
  assert.equal(calls, 1);
});

test('account switch during refresh prevents replay', async () => {
  let switched = false, calls = 0;
  await assert.rejects(sendAuthenticatedChat(options({
    getSession: async () => switched ? { ...session('new'), user: { id: 'another-user' } } : session('old'),
    refreshSession: async () => { switched = true; return session('new'); },
    fetchImpl: async () => { calls++; return rejected(); }
  })), UnsentMessageError);
  assert.equal(calls, 1);
});

test('abort releases a stalled SDK session read without waiting for it or sending', async () => {
  const controller = new AbortController();
  const pending = sendAuthenticatedChat(options({ signal: controller.signal,
    getSession: () => new Promise(() => {}), fetchImpl: async () => assert.fail('must not send') }));
  controller.abort();
  await assert.rejects(pending, { name: 'AbortError' });
});

test('budget pause preserves a private remembered message through capture without calling another model', async () => {
  const calls = [];
  const body = JSON.stringify({ message: 'Ideia importante da Sol', mode: 'private', remember: true, history: [{ role: 'user', content: 'contexto' }] });
  const response = await sendAuthenticatedChat(options({ body, fetchImpl: async (url, init) => {
    calls.push({ url, init });
    if (url === '/api/jarvis-chat') {
      return Response.json({ ok: false, errorCode: 'ai_budget_paused', stage: 'budget', persisted: false }, { status: 403 });
    }
    assert.equal(url, '/api/jarvis-capture');
    const capture = JSON.parse(init.body);
    assert.equal(capture.message, 'Ideia importante da Sol');
    assert.equal(capture.mode, 'private');
    assert.equal(capture.remember, true);
    assert.deepEqual(capture.history, []);
    assert.match(capture.captureId, /^[0-9a-f-]{36}$/i);
    return Response.json({ ok: true, persisted: true, memoryId: capture.captureId, execution: 'capture_only', continuityPersisted: true,
      continuity: { relation: 'new_topic', scope: 'raw_statement', topicHint: 'ideia' } });
  }}));
  const data = await response.json();
  assert.equal(response.status, 200);
  assert.equal(data.ok, true);
  assert.equal(data.persisted, true);
  assert.equal(data.execution, 'capture_only_budget_fallback');
  assert.equal(data.modelUsed, 'none');
  assert.match(data.answer, /guardada no cofre e no Diário/);
  assert.equal(calls.length, 2);
});

test('budget pause never auto-captures public mode or a private message with memory disabled', async () => {
  for (const body of [
    JSON.stringify({ message: 'público', mode: 'public', remember: false, history: [] }),
    JSON.stringify({ message: 'privado sem memória', mode: 'private', remember: false, history: [] })
  ]) {
    let calls = 0;
    const response = await sendAuthenticatedChat(options({ body, fetchImpl: async () => {
      calls++;
      return Response.json({ ok: false, errorCode: 'ai_budget_paused', stage: 'budget', persisted: false }, { status: 403 });
    }}));
    assert.equal(response.status, 403);
    assert.equal(calls, 1);
  }
});
