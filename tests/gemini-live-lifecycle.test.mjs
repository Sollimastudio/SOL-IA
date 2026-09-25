import test from 'node:test';
import assert from 'node:assert/strict';
import { createGeminiLiveClient } from '../src/core/geminiLiveClient.mjs';

const deferred = () => {
  let resolve;
  const promise = new Promise(done => { resolve = done; });
  return { promise, resolve };
};
const flush = () => new Promise(resolve => setImmediate(resolve));
const tokenResponse = () => ({ ok: true, json: async () => ({ ok: true, token: 'synthetic-only' }) });

// Synthetic transport/audio only: these tests do not prove Google or physical iPhone audio.
function harness(t, { media, response, ...options } = {}) {
  const descriptors = new Map();
  const stats = { mediaRequests: 0, stops: 0, fetches: 0, contextsClosed: 0 };
  const sockets = [], states = [], errors = [], playback = [], captures = [], requests = [];
  const track = { enabled: true, stop() { stats.stops++; } };
  const stream = { getTracks: () => [track], getAudioTracks: () => [track] };
  const node = () => ({ connect() {}, disconnect() {} });
  class AudioContextMock {
    constructor() { this.currentTime = 0; this.audioWorklet = { addModule: async () => {} }; }
    async resume() {}
    async close() { stats.contextsClosed++; }
    createMediaStreamSource() { return node(); }
    createGain() { return { ...node(), gain: { value: 0 } }; }
    createBuffer(_channels, length, rate) { return { duration: length / rate, getChannelData: () => new Float32Array(length) }; }
    createBufferSource() {
      const source = { ...node(), stopped: false, start(time) { this.time = time; }, stop() { this.stopped = true; } };
      playback.push(source);
      return source;
    }
  }
  class WorkletMock {
    constructor() { this.port = { onmessage: null }; captures.push(this); }
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
    close(code = 1000) {
      if (this.readyState === 3) return;
      this.readyState = 3;
      queueMicrotask(() => this.emit('close', { code }));
    }
  }
  for (const [key, value] of Object.entries({
    navigator: { mediaDevices: { getUserMedia: async () => { stats.mediaRequests++; return media ? media.promise : stream; } } },
    AudioContext: AudioContextMock, AudioWorkletNode: WorkletMock
  })) {
    descriptors.set(key, Object.getOwnPropertyDescriptor(globalThis, key));
    Object.defineProperty(globalThis, key, { value, configurable: true });
  }
  const client = createGeminiLiveClient({
    accessToken: 'synthetic-session', WebSocketImpl: SocketMock,
    fetchImpl: async (_url, request) => {
      stats.fetches++; requests.push(request);
      return response ? response.promise : tokenResponse();
    },
    onStatus: state => states.push(state), onError: error => errors.push(error), ...options
  });
  t.after(() => {
    client.disconnect();
    for (const [key, descriptor] of descriptors) {
      if (descriptor) Object.defineProperty(globalThis, key, descriptor);
      else delete globalThis[key];
    }
  });
  return { client, stream, track, stats, sockets, states, errors, playback, captures, requests };
}
async function connected(h) {
  await h.client.connect();
  h.sockets[0].open();
  h.sockets[0].message({ setupComplete: {} });
  assert.equal(h.client.isConnected(), true);
}
const audio = { serverContent: { modelTurn: { parts: [{ inlineData: { data: 'AQACAA==', mimeType: 'audio/pcm;rate=24000' } }] } } };

test('Gemini preserves automatic idle protection and continuous listening explicitly opts out', async t => {
  t.mock.timers.enable({ apis: ['setTimeout'] });
  const automatic = harness(t);
  await connected(automatic);
  t.mock.timers.tick(180001);
  assert.equal(automatic.client.isConnected(), false);
  assert.equal(automatic.stats.stops, 1);
  const continuous = harness(t, { keepAlive: true });
  await connected(continuous);
  t.mock.timers.tick(240000);
  assert.equal(continuous.client.isConnected(), true);
  await continuous.client.close();
  assert.equal(continuous.stats.stops, 1);
});

test('Gemini interruption clears queued audio and the next turn still plays', async t => {
  const h = harness(t);
  await connected(h);
  h.sockets[0].message(audio); h.sockets[0].message(audio);
  h.sockets[0].message({ serverContent: { interrupted: true } });
  assert.ok(h.playback.every(source => source.stopped));
  h.sockets[0].message(audio);
  assert.equal(h.playback[2].time, h.playback[0].time);
  assert.equal(h.playback[2].stopped, false);
  assert.equal(h.client.isConnected(), true);
});

test('Gemini stop aborts token request and late authorization cannot open microphone', async t => {
  const response = deferred(), h = harness(t, { response });
  const pending = h.client.connect();
  h.client.disconnect();
  assert.equal(h.requests[0].signal.aborted, true);
  response.resolve(tokenResponse());
  await pending;
  assert.equal(h.stats.mediaRequests, 0);
  assert.equal(h.sockets.length, 0);
  assert.equal(h.states.at(-1), 'disconnected');
});

test('Gemini stop during microphone permission disposes a late granted stream', async t => {
  const media = deferred(), h = harness(t, { media });
  const pending = h.client.connect();
  await flush();
  await h.client.close();
  media.resolve(h.stream);
  await pending;
  assert.equal(h.stats.stops, 1);
  assert.equal(h.sockets.length, 0);
});

test('Gemini mute ends audio input and no frames escape until explicitly unmuted', async t => {
  const h = harness(t);
  await connected(h);
  h.client.mute();
  assert.deepEqual(h.sockets[0].sent.at(-1), { realtimeInput: { audioStreamEnd: true } });
  const length = h.sockets[0].sent.length;
  h.captures[0].port.onmessage({ data: new ArrayBuffer(4) });
  assert.equal(h.sockets[0].sent.length, length);
  assert.equal(h.track.enabled, false);
  h.client.unmute();
  h.captures[0].port.onmessage({ data: new ArrayBuffer(4) });
  assert.ok(h.sockets[0].sent.at(-1).realtimeInput.audio);
});

test('Gemini bounds setup wait and releases microphone if provider never starts', async t => {
  t.mock.timers.enable({ apis: ['setTimeout'] });
  const h = harness(t);
  await h.client.connect(); h.sockets[0].open();
  t.mock.timers.tick(30001);
  assert.equal(h.stats.stops, 1);
  assert.equal(h.stats.contextsClosed, 1);
  assert.equal(h.states.at(-1), 'error');
  h.sockets[0].message({ setupComplete: {} });
  assert.equal(h.client.isConnected(), false);
});

test('Gemini cancelled delegation is aborted and never returns stale private context', async t => {
  const result = deferred(); let signal;
  const h = harness(t, { onDelegation: task => { signal = task.signal; return result.promise; } });
  await connected(h);
  h.sockets[0].message({ toolCall: { functionCalls: [{ id: 'task1', name: 'consult_jarvis', args: { request: 'Contexto autorizado?' } }] } });
  h.sockets[0].message({ toolCallCancellation: { ids: ['task1'] } });
  assert.equal(signal.aborted, true);
  result.resolve('synthetic private context'); await flush();
  assert.equal(h.sockets[0].sent.filter(event => event.toolResponse).length, 0);
});

test('Gemini resumes with fresh authorization, same voice/model and keeps mute after goAway', async t => {
  t.mock.timers.enable({ apis: ['setTimeout'] });
  const h = harness(t, { keepAlive: true, voice: 'Kore', getAccessToken: async () => 'refreshed-synthetic-session' });
  await connected(h);
  assert.deepEqual(h.sockets[0].sent[0].setup.sessionResumption, {});
  assert.deepEqual(h.sockets[0].sent[0].setup.contextWindowCompression, { slidingWindow: {} });
  h.client.mute();
  h.sockets[0].message({ sessionResumptionUpdate: { resumable: true, newHandle: 'synthetic-handle' } });
  h.sockets[0].message({ goAway: { timeLeft: '30s' } });
  t.mock.timers.tick(1000); await flush();
  assert.equal(h.stats.fetches, 2);
  assert.equal(h.requests[1].headers.Authorization, 'Bearer refreshed-synthetic-session');
  assert.equal(h.stats.mediaRequests, 1);
  h.sockets[1].open();
  const setup = h.sockets[1].sent[0].setup;
  assert.deepEqual(setup.sessionResumption, { handle: 'synthetic-handle' });
  assert.equal(setup.model, h.sockets[0].sent[0].setup.model);
  assert.deepEqual(setup.generationConfig, h.sockets[0].sent[0].setup.generationConfig);
  h.sockets[1].message({ setupComplete: {} });
  assert.equal(h.client.isConnected(), true);
  assert.equal(h.client.isMuted(), true);
  assert.equal(h.track.enabled, false);
});

test('Gemini never resumes without consent, after policy denial, or from an invalidated handle', async t => {
  for (const options of [{ keepAlive: false, code: 1000 }, { keepAlive: true, code: 1008 }, { keepAlive: true, code: 1006, invalidated: true }]) {
    const h = harness(t, options);
    await connected(h);
    h.sockets[0].message({ sessionResumptionUpdate: { resumable: true, newHandle: 'synthetic-handle' } });
    if (options.invalidated) h.sockets[0].message({ sessionResumptionUpdate: { resumable: false } });
    h.sockets[0].close(options.code); await flush();
    assert.equal(h.states.at(-1), 'disconnected');
    assert.equal(h.stats.stops, 1);
    assert.equal(h.stats.fetches, 1);
  }
});

test('Gemini manual stop cancels pending resumption and ignores stale socket messages', async t => {
  t.mock.timers.enable({ apis: ['setTimeout'] });
  const h = harness(t, { keepAlive: true });
  await connected(h);
  h.sockets[0].message({ sessionResumptionUpdate: { resumable: true, newHandle: 'synthetic-handle' } });
  h.sockets[0].message({ goAway: { timeLeft: '30s' } });
  await h.client.close();
  t.mock.timers.tick(30001); await flush();
  h.sockets[0].message({ setupComplete: {} }); h.sockets[0].message(audio);
  assert.equal(h.stats.fetches, 1);
  assert.equal(h.playback.length, 0);
  assert.equal(h.states.at(-1), 'disconnected');
});

test('Gemini caps repeated short-lived resumption attempts instead of looping forever', async t => {
  t.mock.timers.enable({ apis: ['setTimeout'] });
  const h = harness(t, { keepAlive: true });
  await connected(h);
  for (let attempt = 0; attempt < 4; attempt++) {
    const socket = h.sockets.at(-1);
    socket.message({ sessionResumptionUpdate: { resumable: true, newHandle: `synthetic-handle-${attempt}` } });
    socket.close(1006); await flush();
    t.mock.timers.tick(1000); await flush();
    if (attempt < 3) {
      h.sockets.at(-1).open(); h.sockets.at(-1).message({ setupComplete: {} });
    }
  }
  assert.equal(h.stats.fetches, 4);
  assert.equal(h.states.at(-1), 'disconnected');
  assert.equal(h.stats.stops, 1);
});

test('Gemini cancels queued tool calls before delegation starts', async t => {
  const result = deferred(); const delegated = [];
  const h = harness(t, { onDelegation: task => { delegated.push(task.id); return result.promise; } });
  await connected(h);
  h.sockets[0].message({ toolCall: { functionCalls: ['a', 'b'].map(id => ({ id, name: 'consult_jarvis', args: {} })) } });
  h.sockets[0].message({ toolCallCancellation: { ids: ['b'] } });
  result.resolve('synthetic context'); await flush();
  assert.deepEqual(delegated, ['a']);
  assert.equal(h.sockets[0].sent.filter(event => event.toolResponse).length, 1);
});
