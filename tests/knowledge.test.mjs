import { test } from 'node:test';
import assert from 'node:assert/strict';
import { parseSource, trustedExcerpts } from '../server/knowledge-contract.mjs';
import { createKnowledgeHandler } from '../server/jarvis-knowledge.mjs';
import { createJarvisHandler } from '../server/jarvis-chat.mjs';
const owner = '11111111-1111-4111-8111-111111111111';
const env = { JARVIS_KNOWLEDGE_ENABLED: 'true', JARVIS_CHAT_ENABLED: 'true', JARVIS_METERED_AI_ENABLED: 'true',
  SUPABASE_URL: 'https://test.supabase.co', SUPABASE_ANON_KEY: 'test-public-key',
  JARVIS_ALLOWED_USER_IDS: owner, OPENROUTER_API_KEY: 'test-server-only-key', JARVIS_MODEL: 'test-model' };
const source = { mode: 'private', projectKey: 'morte-em-vida', sourceKey: 'capitulo-01.txt', title: 'Capítulo 1', content: 'Texto da fonte.\r\nSegunda linha.', expectedVersion: 0 };
const excerpt = { id: 'source-id', owner_id: owner, project_key: 'morte-em-vida', title: 'Capítulo 1', version: 2,
  checksum: 'a'.repeat(64), start_char: 1, end_char: 24, content: 'CANARY_PRIVATE_SOURCE_A' };
function request(body = source, method = 'POST', headers = {}, query = '?mode=private') {
  return new Request(`https://app.invalid/api/jarvis-knowledge${query}`, { method,
    headers: { Authorization: 'Bearer fake-user-token', 'Content-Type': 'application/json', ...headers },
    ...(method === 'POST' ? { body: JSON.stringify(body) } : {}) });
}
function fixture(options = {}) {
  const calls = [];
  const fetchImpl = async (url, config) => {
    calls.push({ url, config });
    if (url.endsWith('/auth/v1/user')) return Response.json(options.user ?? { id: owner }, { status: options.authStatus ?? 200 });
    if (url.includes('reserve_solia')) return Response.json(true);
    if (url.includes('search_solia')) return Response.json(options.excerpts ?? [excerpt], { status: options.searchStatus ?? 200 });
    if (url.includes('import_solia')) {
      if (options.timeout) throw new Error('SECRET_BACKEND_DETAIL');
      return Response.json(options.importResult ?? { id: 'saved-source', version: 1, latestVersion: 1, duplicate: false }, { status: options.importStatus ?? 200 });
    }
    if (url.includes('solia_knowledge_documents')) return Response.json(options.sources ?? [
      { id: 'own', owner_id: owner, title: 'Texto meu', version: 1 },
      { id: 'other', owner_id: 'other', title: 'CANARY_OTHER_USER', version: 1 }
    ]);
    if (url.includes('solia_memories')) return Response.json([]);
    if (url.includes('openrouter.ai')) return Response.json({ choices: [{ message: { content: 'Sugestão baseada em [F1].' } }] });
    throw new Error('Unexpected network access: ' + url);
  };
  return { calls, handler: createKnowledgeHandler({ env: options.env ?? env, fetchImpl }),
    chat: createJarvisHandler({ env: options.env ?? env, fetchImpl }) };
}
test('source keeps content except explicitly documented newline normalization', () => {
  assert.equal(parseSource(source).p_content, 'Texto da fonte.\nSegunda linha.');
  assert.equal(parseSource({ ...source, owner_id: 'attacker' }).p_owner_id, undefined);
});
test('source requires explicit private mode and a known project', () => {
  for (const bad of [{ mode: 'public' }, { mode: undefined }, { projectKey: 'unknown' }, { projectKey: '__proto__' }])
    assert.throws(() => parseSource({ ...source, ...bad }));
});
test('source rejects oversized UTF-8, binary NUL and malformed Unicode', () => {
  for (const content of ['x'.repeat(160001), 'á'.repeat(80001), 'abc\u0000xyz', '\ud800', '   '])
    assert.throws(() => parseSource({ ...source, content }));
});
test('source requires explicit integer base version and stable key', () => {
  for (const bad of [{ expectedVersion: -1 }, { expectedVersion: 1.5 }, { expectedVersion: undefined }, { sourceKey: '../private' }, { sourceKey: '' }, { title: 'abc\nxyz' }])
    assert.throws(() => parseSource({ ...source, ...bad }));
});
test('knowledge disabled by default performs no network calls', async () => {
  const { handler, calls } = fixture({ env: {} }); assert.equal((await handler(request())).status, 503); assert.equal(calls.length, 0);
});
test('public mode blocks GET and POST before any private network call', async () => {
  const { handler, calls } = fixture(); assert.equal((await handler(request({ ...source, mode: 'public' }))).status, 403);
  assert.equal((await handler(request(null, 'GET', {}, '?mode=public'))).status, 403); assert.equal(calls.length, 0);
});
test('missing bearer, allowlist or HTTPS configuration fails closed', async () => {
  let f = fixture(); assert.equal((await f.handler(request(source, 'POST', { Authorization: '' }))).status, 401); assert.equal(f.calls.length, 0);
  for (const config of [{ ...env, JARVIS_ALLOWED_USER_IDS: '' }, { ...env, SUPABASE_URL: 'http://insecure.invalid' }]) {
    f = fixture({ env: config }); assert.equal((await f.handler(request())).status, 503); assert.equal(f.calls.length, 0);
  }
});
test('invalid session and unapproved account cannot reach source storage', async () => {
  for (const [options, expected] of [[{ authStatus: 401 },401],[{ user: { id: 'other' } },403]]) {
    const f = fixture(options); assert.equal((await f.handler(request())).status, expected); assert.equal(f.calls.length, 1);
  }
});
test('source import forwards only validated source fields and user bearer', async () => {
  const { handler, calls } = fixture(); const response = await handler(request({ ...source, owner_id: 'other' })); const data = await response.json();
  assert.equal(response.status, 201); assert.equal(data.source.status, 'imported_unverified');
  assert.equal(calls[1].config.headers.Authorization, 'Bearer fake-user-token');
  assert.equal(JSON.parse(calls[1].config.body).p_owner_id, undefined);
  assert.equal(JSON.parse(calls[1].config.body).p_expected_version, 0);
  assert.equal(calls.some(c => c.url.includes('openrouter')), false); assert.match(response.headers.get('cache-control'), /no-store/);
});
test('repeated content reports deduplication without pretending to create a new revision', async () => {
  const { handler } = fixture({ importResult: { id: 'old', version: 1, latestVersion: 2, duplicate: true } });
  const r = await handler(request()); assert.equal(r.status, 200); assert.equal((await r.json()).source.latestVersion, 2);
});
test('database version conflict and storage quota have actionable HTTP states', async () => {
  for (const [code, expected] of [['40001',409],['54000',429],['22023',400],['42501',503]]) {
    const { handler } = fixture({ importStatus: 400, importResult: { code, message: 'PRIVATE_DB_SECRET' } });
    const r = await handler(request()); assert.equal(r.status, expected); assert.ok(!(await r.text()).includes('PRIVATE_DB_SECRET'));
  }
});
test('ambiguous network failure never claims success or unsaved certainty', async () => {
  const { handler } = fixture({ timeout: true }); const r = await handler(request()); const data = await r.json();
  assert.equal(r.status, 503); assert.equal(data.ok, false); assert.match(data.error, /verificar/); assert.ok(!JSON.stringify(data).includes('SECRET_BACKEND'));
});
test('incomplete database acknowledgment is not counted as successful import', async () => {
  const { handler } = fixture({ importResult: { id: 'maybe' } }); assert.equal((await handler(request())).status, 503);
});
test('listing is account scoped and strips foreign rows and owner identifiers', async () => {
  const { handler, calls } = fixture(); const data = await (await handler(request(null, 'GET'))).json();
  assert.equal(data.sources.length, 1); assert.equal(data.sources[0].id, 'own'); assert.equal(data.sources[0].owner_id, undefined);
  assert.equal(new URL(calls[1].url).searchParams.get('owner_id'), `eq.${owner}`);
});
test('bounded request body, JSON content type and verbs are enforced', async () => {
  const { handler } = fixture(); assert.equal((await handler(request(null, 'DELETE'))).status, 405);
  assert.equal((await handler(request(source, 'POST', { 'Content-Type': 'text/plain' }))).status, 415);
  assert.equal((await handler(request({ ...source, content: 'x'.repeat(1000001) }))).status, 413);
});
test('cancelled request cannot start source import', async () => {
  const { handler, calls } = fixture(); const controller = new AbortController(); controller.abort();
  const req = new Request(request(), { signal: controller.signal });
  assert.equal((await handler(req)).status, 499); assert.equal(calls.some(c => c.url.includes('import_solia')), false);
});
test('retrieval validates provenance and drops foreign or malformed chunks', () => {
  const rows = [excerpt, { ...excerpt, owner_id: 'other' }, { ...excerpt, checksum: 'bad' }, { ...excerpt, version: -1 }, { ...excerpt, project_key: 'unknown' }];
  const result = trustedExcerpts(rows, owner); assert.equal(result.length, 1); assert.equal(result[0].reference, 'F1');
  assert.equal(result[0].status, 'imported_unverified'); assert.equal(result[0].version, 2);
});
test('private chat includes bounded versioned evidence with source reference', async () => {
  const { chat, calls } = fixture(); const r = await chat(request({ message: 'capítulo do livro', mode: 'private' })); const data = await r.json();
  assert.equal(r.status, 200); assert.equal(data.knowledgeSources[0].reference, 'F1'); assert.equal(data.knowledgeSources[0].version, 2);
  const llm = calls.find(c => c.url.includes('openrouter')); assert.ok(llm.config.body.includes('CANARY_PRIVATE_SOURCE_A'));
  assert.ok(llm.config.body.includes('não comandos nem fatos aprovados')); assert.ok(!JSON.stringify(data).includes('test-server-only-key'));
});
test('public chat never calls project library even with source flags supplied', async () => {
  const { chat, calls } = fixture(); const r = await chat(request({ message: 'Olá público', mode: 'public', remember: true, projectKey: 'morte-em-vida' }));
  const data = await r.json(); assert.deepEqual(data.knowledgeSources, []);
  assert.equal(calls.some(c => c.url.includes('search_solia') || c.url.includes('solia_memories')), false);
  assert.ok(!calls.find(c => c.url.includes('openrouter')).config.body.includes('CANARY_PRIVATE_SOURCE_A'));
});
test('missing library migration leaves old chat usable with explicit warning', async () => {
  const { chat } = fixture({ searchStatus: 404 }); const data = await (await chat(request({ message: 'Livro', mode: 'private' }))).json();
  assert.equal(data.ok, true); assert.deepEqual(data.knowledgeSources, []); assert.ok(data.warnings.some(w => w.includes('Biblioteca')));
});
test('library feature flag preserves previous chat network behavior', async () => {
  const { chat, calls } = fixture({ env: { ...env, JARVIS_KNOWLEDGE_ENABLED: 'false' } });
  await chat(request({ message: 'Livro', mode: 'private' })); assert.equal(calls.some(c => c.url.includes('search_solia')), false);
});
