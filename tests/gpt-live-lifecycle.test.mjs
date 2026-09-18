import test from 'node:test';
import assert from 'node:assert/strict';
import { createGptLiveClient } from '../src/core/gptLiveClient.mjs';

const deferred = () => {
  let resolve;
  const promise = new Promise(done => { resolve = done; });
  return { promise, resolve };
};
const flush = () => new Promise(resolve => setImmediate(resolve));
const tokenResponse = () => ({ ok: true, json: async () => ({ token: 'synthetic-only', expiresAt: Date.now() / 1000 + 60 }) });

// Synthetic browser adapters: no microphone, network, provider key or paid call.
function harness(t, { media, response } = {}) {
  const descriptors = new Map();
  const stats = { mediaRequests: 0, stops: 0, fetches: 0, contexts: 0, contextsClosed: 0 };
  const sockets = [];
  const states = [];
  const errors = [];
  const usage = [];
  let requestSignal;
  const track = { enabled: true, stop() { stats.stops++; } };
  const stream = { getTracks: () => [track], getAudioTracks: () => [track] };
  const node = () => ({ connect() {}, disconnect() {} });
  class AudioContextMock {
    constructor() { stats.contexts++; this.audioWorklet = { addModule: async () => {} }; }
    async resume() {}
    async close() { stats.contextsClosed++; }
    createMediaStreamSource() { return node(); }
    createGain() { return { ...node(), gain: { value: 0 } }; }
  }
  class WorkletMock {
    constructor() { this.port = { onmessage: null }; }
    connect() {}
    disconnect() {}
  }
  class SocketMock {
    static OPEN = 1;
    constructor() { this.readyState = 0; this.listeners = {}; this.sent = []; sockets.push(this); }
    addEventListener(name, callback) { (this.listeners[name] ??= []).push(callback); }
    emit(name, event = {}) { for (const callback of this.listeners[name] ?? []) callback(event); }
    open() { this.readyState = 1; this.emit('open'); }
    message(data) { this.emit('message', { data: JSON.stringify(data) }); }
    send(raw) { this.sent.push(JSON.parse(raw)); }
    close() {
      if (this.readyState === 3) return;
      this.readyState = 3;
      queueMicrotask(() => this.emit('close'));
    }
  }
  for (const [key, value] of Object.entries({
    navigator: { mediaDevices: { getUserMedia: async () => { stats.mediaRequests++; return media ? media.promise : stream; } } },
    AudioContext: AudioContextMock,
    AudioWorkletNode: WorkletMock
  })) {
    descriptors.set(key, Object.getOwnPropertyDescriptor(globalThis, key));
    Object.defineProperty(globalThis, key, { value, configurable: true });
  }
  const client = createGptLiveClient({
    accessToken: 'synthetic-session',
    WebSocketImpl: SocketMock,
    fetchImpl: async (_url, options) => {
      stats.fetches++;
      requestSignal = options.signal;
      return response ? response.promise : tokenResponse();
    },
    onStatus: state => states.push(state),
    onError: error => errors.push(error),
    onUsage: (seconds, meta) => usage.push({ seconds, ...meta })
  });
  t.after(() => {
    client.disconnect();
    for (const [key, descriptor] of descriptors) {
      if (descriptor) Object.defineProperty(globalThis, key, descriptor);
      else delete globalThis[key];
    }
  });
  return { client, stream, stats, sockets, states, errors, usage, get signal() { return requestSignal; } };
}

async function connected(h) {
  await h.client.connect();
  h.sockets[0].open();
  h.sockets[0].message({ type: 'session.started' });
  assert.equal(h.client.isConnected(), true);
}

async function mustSettle(promise) {
  let timer;
  try {
    assert.equal(await Promise.race([
      promise.then(() => 'settled'),
      new Promise(resolve => { timer = setTimeout(() => resolve('hung'), 50); })
    ]), 'settled');
  } finally { clearTimeout(timer); }
}

test('close after disconnect settles instead of hanging forever', async t => {
  const h = harness(t);
  h.client.disconnect();
  await mustSettle(h.client.close());
});

test('cancellation before microphone permission resolves releases the late stream and never mints a token', async t => {
  const media = deferred();
  const h = harness(t, { media });
  const opening = h.client.connect();
  h.client.disconnect();
  media.resolve(h.stream);
  await opening;
  assert.equal(h.stats.stops, 1);
  assert.equal(h.stats.contexts, 0);
  assert.equal(h.stats.fetches, 0);
  assert.equal(h.sockets.length, 0);
});

test('cancellation during token request aborts it and never opens a late socket', async t => {
  const response = deferred();
  const h = harness(t, { response });
  const opening = h.client.connect();
  await flush();
  assert.equal(h.stats.fetches, 1);
  h.client.disconnect();
  response.resolve(tokenResponse()); // A transport may deliver despite abort.
  await opening;
  assert.equal(h.signal?.aborted, true);
  assert.equal(h.sockets.length, 0);
});

test('concurrent connect attempts cannot acquire two microphones', async t => {
  const media = deferred();
  const h = harness(t, { media });
  const opening = h.client.connect();
  const duplicate = h.client.connect();
  const rejection = assert.rejects(duplicate, /andamento/);
  media.resolve(h.stream);
  await opening;
  await rejection;
  assert.equal(h.stats.mediaRequests, 1);
});

for (const seconds of [undefined, null, -1, 'invalid']) {
  test(`invalid final usage (${String(seconds)}) is never confirmed`, async t => {
    const h = harness(t);
    await connected(h);
    h.sockets[0].message({ type: 'session.closed', usage: { seconds } });
    await flush();
    assert.equal(h.client.hasFinalUsage(), false);
    assert.equal(h.usage.length, 0);
    await mustSettle(h.client.close());
  });
}

test('valid final usage closes and repeated close remains safe', async t => {
  const h = harness(t);
  await connected(h);
  h.sockets[0].message({ type: 'session.closed', usage: { seconds: 4 } });
  await flush();
  assert.equal(h.client.hasFinalUsage(), true);
  assert.deepEqual(h.usage, [{ seconds: 4, final: true }]);
  assert.equal(h.client.isConnected(), false);
  await mustSettle(h.client.close());
});

test('late session.started after disconnect cannot revive a closed session', async t => {
  const h = harness(t);
  await connected(h);
  const socket = h.sockets[0];
  h.client.disconnect();
  const stateCount = h.states.length;
  socket.message({ type: 'session.started' });
  assert.equal(h.states.slice(stateCount).includes('connected'), false);
});
