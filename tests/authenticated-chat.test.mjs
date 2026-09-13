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
