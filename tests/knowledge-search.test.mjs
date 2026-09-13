import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createKnowledgeHandler } from '../server/jarvis-knowledge.mjs';

const owner = '11111111-1111-4111-8111-111111111111';
const env = {
  JARVIS_KNOWLEDGE_ENABLED: 'true',
  SUPABASE_URL: 'https://test.supabase.co',
  SUPABASE_ANON_KEY: 'test-public-key',
  JARVIS_ALLOWED_USER_IDS: owner
};
const excerpt = {
  id: 'source-id', owner_id: owner, project_key: 'geral', title: 'Fonte fictícia de verificação', version: 1,
  checksum: 'a'.repeat(64), start_char: 1, end_char: 120,
  content: 'O marcador único é ORBITA-CANELA-731 e a fita é violeta.'
};
function request(query) {
  return new Request(`https://app.invalid/api/jarvis-knowledge?mode=private&q=${encodeURIComponent(query)}`, {
    method: 'GET', headers: { Authorization: 'Bearer fake-user-token' }
  });
}
function fixture(rows = [excerpt]) {
  const calls = [];
  const fetchImpl = async (url, config) => {
    calls.push({ url, config });
    if (url.endsWith('/auth/v1/user')) return Response.json({ id: owner });
    if (url.includes('/rpc/search_solia_knowledge')) return Response.json(rows);
    if (url.includes('openrouter.ai')) throw new Error('AI provider must never be called by knowledge search');
    throw new Error('Unexpected network route: ' + url);
  };
  return { calls, handler: createKnowledgeHandler({ env, fetchImpl }) };
}

test('no-cost search returns provenance and never calls a model', async () => {
  const { calls, handler } = fixture();
  const response = await handler(request('ORBITA CANELA fita violeta'));
  const data = await response.json();
  assert.equal(response.status, 200);
  assert.equal(data.ok, true);
  assert.equal(data.query, 'ORBITA CANELA fita violeta');
  assert.equal(data.matches.length, 1);
  assert.deepEqual(data.matches[0], {
    reference: 'F1', id: 'source-id', project: 'geral', title: 'Fonte fictícia de verificação', version: 1,
    startChar: 1, endChar: 120, checksum: 'a'.repeat(64), status: 'imported_unverified',
    content: 'O marcador único é ORBITA-CANELA-731 e a fita é violeta.'
  });
  const search = calls.find(call => call.url.includes('/rpc/search_solia_knowledge'));
  assert.deepEqual(JSON.parse(search.config.body), { p_query: 'ORBITA CANELA fita violeta' });
  assert.equal(calls.some(call => call.url.includes('openrouter.ai')), false);
  assert.match(response.headers.get('cache-control'), /no-store/);
});

test('search drops foreign and malformed rows before returning them', async () => {
  const { handler } = fixture([
    excerpt,
    { ...excerpt, id: 'foreign', owner_id: '22222222-2222-4222-8222-222222222222' },
    { ...excerpt, id: 'bad-checksum', checksum: 'not-a-checksum' }
  ]);
  const data = await (await handler(request('violeta'))).json();
  assert.deepEqual(data.matches.map(match => match.id), ['source-id']);
  assert.equal(JSON.stringify(data).includes('22222222-2222-4222-8222-222222222222'), false);
});

test('empty or oversized search is rejected before private network access', async () => {
  for (const query of ['', 'x'.repeat(501)]) {
    const { calls, handler } = fixture();
    const response = await handler(request(query));
    assert.equal(response.status, 400);
    assert.equal(calls.length, 0);
  }
});
