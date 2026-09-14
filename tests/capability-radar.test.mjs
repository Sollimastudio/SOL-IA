import { test } from 'node:test';
import assert from 'node:assert/strict';
import { inspectSource } from '../scripts/capability-radar.mjs';

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
  const result = await inspectSource(source, null, async () => response('Regra oficial A'));
  assert.equal(result.ok, true);
  assert.equal(result.change, 'baseline_created');
  assert.match(result.hash, /^[a-f0-9]{64}$/);
});

test('same normalized source is unchanged', async () => {
  const first = await inspectSource(source, null, async () => response('Regra oficial A'));
  const second = await inspectSource(source, { hash: first.hash }, async () => response('Regra oficial A'));
  assert.equal(second.change, 'unchanged');
});

test('changed official source is flagged for review, not auto-promoted', async () => {
  const first = await inspectSource(source, null, async () => response('Regra oficial A'));
  const changed = await inspectSource(source, { hash: first.hash }, async () => response('Regra oficial B'));
  assert.equal(changed.change, 'changed');
  assert.notEqual(changed.hash, first.hash);
});

test('source outage is recorded honestly', async () => {
  const result = await inspectSource(source, null, async () => new Response('nope', { status: 503 }));
  assert.equal(result.ok, false);
  assert.equal(result.change, 'unavailable');
  assert.equal(result.status, 503);
});
