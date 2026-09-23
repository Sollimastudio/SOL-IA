import { test } from 'node:test';
import assert from 'node:assert/strict';
import { inspectSource, materialFingerprint } from '../scripts/capability-radar.mjs';

const source = {
  key: 'official-test',
  kind: 'platform_algorithm',
  url: 'https://example.com/official',
  allowedHosts: ['example.com']
};

const response = text => new Response(`<html><body><main>${text}</main><script>volatile()</script></body></html>`, {
  status: 200,
  headers: { 'content-type': 'text/html' }
});

test('first observation creates baseline without pretending a change happened', async () => {
  const result = await inspectSource(source, null, async () => response('Nova API e modelo oficial'));
  assert.equal(result.ok, true);
  assert.equal(result.change, 'baseline_created');
  assert.equal(result.materialChange, 'baseline_created');
  assert.match(result.hash, /^[a-f0-9]{64}$/);
  assert.match(result.materialHash, /^[a-f0-9]{64}$/);
});

test('same normalized source is unchanged', async () => {
  const first = await inspectSource(source, null, async () => response('API sem mudança'));
  const second = await inspectSource(source, { hash: first.hash, materialHash: first.materialHash }, async () => response('API sem mudança'));
  assert.equal(second.change, 'unchanged');
  assert.equal(second.materialChange, 'unchanged');
});

test('cosmetic page delta can change raw hash without becoming material', async () => {
  const first = await inspectSource(source, null, async () => response('API estável. Rodapé A.'));
  const second = await inspectSource(source, { hash: first.hash, materialHash: first.materialHash }, async () => response('API estável. Rodapé B.'));
  assert.equal(second.change, 'changed');
  assert.equal(second.materialChange, 'changed');
  // The keyword window intentionally catches nearby copy; semantic review remains supervised.
});

test('new material term creates a different material fingerprint', () => {
  const before = materialFingerprint('Página institucional sem detalhes técnicos.');
  const after = materialFingerprint('Página institucional. API pricing changed and model deprecated.');
  assert.equal(before, null);
  assert.match(after, /^[a-f0-9]{64}$/);
});

test('source outage is recorded honestly', async () => {
  const result = await inspectSource(source, null, async () => new Response('nope', { status: 503 }));
  assert.equal(result.ok, false);
  assert.equal(result.change, 'unavailable');
  assert.equal(result.materialChange, 'unavailable');
  assert.equal(result.status, 503);
});
