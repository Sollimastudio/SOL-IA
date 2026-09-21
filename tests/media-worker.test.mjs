import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, readFile, readdir, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createHash } from 'node:crypto';
import { createMediaWorker } from '../server/media-worker.mjs';
import { youtubeCaptionTrack, acquireReference } from '../server/reference-acquisition.mjs';
const token = 'synthetic-worker-token-more-than-thirty-two';
const bytes = Buffer.from('synthetic media, processor stub in this unit test');
const sha256 = createHash('sha256').update(bytes).digest('hex');
test('recognition limits reach the reference checkpoint without fabricated content', async () => {
  const result = await acquireReference({ url: 'https://example.com/long.mp4', kind: 'media', title: 'Long reference' }, { readPublic: async () => { throw Error('transport'); }, mediaAdapter: async () => ({ status: 'blocked', code: 'media_duration_limit' }) });
  assert.equal(result.code, 'media_duration_limit'); assert.match(result.reason, /três minutos/); assert.equal(result.coverage.audio, false); assert.deepEqual(result.segments, []);
});
test('private worker authenticates, verifies bytes, separates credentials and cleans files', async () => {
  const workDir = await mkdtemp(join(tmpdir(), 'jarvis-worker-test-')); let calls = 0;
  const worker = createMediaWorker({ referenceToken: token + '-reference', voiceToken: token, workDir, python: 'unused', modelDir: 'unused',
    recognize: async path => { calls++; assert.deepEqual(await readFile(path), bytes); return { status: 'ready', sourceSha256: sha256, text: 'Synthetic recognition contract' }; } });
  await new Promise(resolve => worker.listen(0, '127.0.0.1', resolve));
  const base = `http://127.0.0.1:${worker.address().port}`;
  const body = { allowPaid: false, transcriptionConsent: true, mediaBase64: bytes.toString('base64'), sha256 };
  const post = (payload, auth = token, path = '/transcribe') => fetch(base + path, { method: 'POST', headers: { Authorization: `Bearer ${auth}`, 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
  try {
    assert.equal((await post(body, 'wrong')).status, 403);
    assert.equal((await post(body, token, '/reference')).status, 403);
    assert.equal((await post({ ...body, sha256: 'wrong' })).status, 400);
    assert.equal((await post({ ...body, transcriptionConsent: false })).status, 400);
    assert.equal((await post({ ...body, allowPaid: true })).status, 400);
    assert.equal(calls, 0);
    const response = await post(body); assert.equal(response.status, 200); assert.equal((await response.json()).sourceSha256, sha256);
    await new Promise(resolve => setTimeout(resolve, 30)); assert.deepEqual(await readdir(workDir), []); assert.equal(calls, 1);
  } finally { await new Promise(resolve => worker.close(resolve)); await rm(workDir, { recursive: true }); }
});
test('public captions are JSON data, retain signed track query and never imply listening', async () => {
  const player = { playabilityStatus: { status: 'OK' }, videoDetails: { title: 'An untrusted } title' }, captions: { playerCaptionsTracklistRenderer: { captionTracks: [{ baseUrl: 'https://www.youtube.com/api/timedtext?v=okmV674zkd4&signature=fixture', languageCode: 'pt', kind: 'asr' }] } } };
  const html = `<script>var ytInitialPlayerResponse = ${JSON.stringify(player)}; globalThis.compromised = true;</script>`;
  const track = youtubeCaptionTrack(html); assert.match(track.url, /\/api\/timedtext\?/); assert.match(track.url, /signature=fixture/); assert.match(track.url, /fmt=vtt/); assert.equal(globalThis.compromised, undefined);
  assert.equal(youtubeCaptionTrack('ytInitialPlayerResponse = function(){evil()}'), null);
  assert.equal(youtubeCaptionTrack('ytInitialPlayerResponse = ' + JSON.stringify({ ...player, playabilityStatus: { status: 'LOGIN_REQUIRED' } })), null);
  let reads = 0;
  const result = await acquireReference({ url: 'https://youtu.be/okmV674zkd4', kind: 'video', title: 'Synthetic caption fixture' }, { readPublic: async url => {
    reads++; return { status: 200, url, headers: { 'content-type': reads === 1 ? 'text/html' : 'text/vtt' }, bytes: Buffer.from(reads === 1 ? html : 'WEBVTT\n\n00:00:00.000 --> 00:00:04.000\nUma legenda sintética para testar a leitura da faixa pública.') };
  } });
  assert.equal(result.method, 'youtube_public_captions'); assert.equal(result.coverage.audio, false); assert.equal(result.segments[0].start, 0);
});
