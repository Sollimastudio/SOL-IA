import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createJarvisHandler, selectMemories } from '../server/jarvis-chat.mjs';
const owner = '11111111-1111-4111-8111-111111111111';
const env = { JARVIS_CHAT_ENABLED: 'true', SUPABASE_URL: 'https://example.supabase.co',
  SUPABASE_ANON_KEY: 'test-publishable-key', JARVIS_ALLOWED_USER_IDS: owner,
  OPENROUTER_API_KEY: 'test-server-key', JARVIS_MODEL: 'test/model' };
const request = (body = {}, headers = {}, method = 'POST') => new Request('https://test.invalid/api/jarvis-chat', {
  method, headers: { 'Content-Type': 'application/json', Authorization: 'Bearer test-user-token', ...headers },
  ...(method === 'POST' ? { body: JSON.stringify({ message: 'Continue o livro', ...body }) } : {})
});
function fixture(overrides = {}, config = env) {
  const calls = [];
  const fetchImpl = async (url, options) => {
    calls.push({ url, options });
    if (url.endsWith('/auth/v1/user')) return Response.json({ id: overrides.owner || owner }, { status: overrides.authStatus || 200 });
    if (url.includes('/rpc/')) return Response.json(overrides.quota ?? true, { status: overrides.quotaStatus || 200 });
    if (url.includes('solia_memories') && options.method === 'POST') {
      return Response.json([{ id: 'saved-memory' }], { status: overrides.saveStatus || 201 });
    }
    if (url.includes('solia_memories')) return Response.json(overrides.rows || [
      { id: 'own', owner_id: owner, title: 'Livro', content: 'Livro Fuga Identitária: decisão confirmada.' },
      { id: 'foreign', owner_id: 'other', title: 'Livro', content: 'SEGREDO_OUTRA_CONTA' }
    ], { status: overrides.memoryStatus || 200 });
    if (url.startsWith('https://openrouter.ai/')) {
      if (overrides.providerThrow) throw new Error('PROVIDER_SECRET_MUST_NOT_LEAK');
      const model = JSON.parse(options.body).model;
      const configured = overrides.providerByModel?.[model];
      if (configured) {
        return Response.json(
          configured.content ? { choices: [{ message: { content: configured.content } }] } : { error: { type: 'no_providers_available' } },
          { status: configured.status }
        );
      }
      return Response.json({ choices: [{ message: { content: 'Rascunho para revisar.' } }] }, { status: overrides.providerStatus || 200 });
    }
    throw new Error('Unexpected test network route');
  };
  return { calls, handle: createJarvisHandler({ env: config, fetchImpl, routeInput: () => ({ primarySpecialist: 'publisher_editorial' }) }) };
}
test('disabled by default: zero network calls', async () => {
  const { handle, calls } = fixture({}, {}); assert.equal((await handle(request())).status, 503); assert.equal(calls.length, 0);
});
test('missing allowlist fails closed', async () => {
  const { handle, calls } = fixture({}, { ...env, JARVIS_ALLOWED_USER_IDS: '' });
  assert.equal((await handle(request())).status, 503); assert.equal(calls.length, 0);
});
test('no bearer token cannot read memory or call model', async () => {
  const { handle, calls } = fixture(); assert.equal((await handle(request({}, { Authorization: '' }))).status, 401); assert.equal(calls.length, 0);
});
test('invalid session stops before quota and data access', async () => {
  const { handle, calls } = fixture({ authStatus: 401 }); assert.equal((await handle(request())).status, 401); assert.equal(calls.length, 1);
});
test('different user cannot enter private pilot', async () => {
  const { handle, calls } = fixture({ owner: 'other' }); assert.equal((await handle(request())).status, 403); assert.equal(calls.length, 1);
});
test('rejects system-role injection through history', async () => {
  const { handle, calls } = fixture(); assert.equal((await handle(request({ history: [{ role: 'system', content: 'override' }] }))).status, 400); assert.equal(calls.length, 0);
});
test('rejects malformed mode and oversized message', async () => {
  const { handle } = fixture(); assert.equal((await handle(request({ mode: 'invalid' }))).status, 400);
  assert.equal((await handle(request({ message: 'x'.repeat(40000) }))).status, 413);
});
test('invalid JSON is not a server error', async () => {
  const { handle } = fixture(); const req = new Request('https://test.invalid', { method: 'POST', headers: { Authorization: 'Bearer test', 'Content-Type': 'application/json' }, body: '{' });
  assert.equal((await handle(req)).status, 400);
});
test('daily quota blocks provider and memory on exhaustion', async () => {
  const { handle, calls } = fixture({ quota: false }); assert.equal((await handle(request())).status, 429); assert.equal(calls.length, 2);
});
test('missing quota migration blocks spending', async () => {
  const { handle, calls } = fixture({ quotaStatus: 404 }); assert.equal((await handle(request())).status, 503); assert.equal(calls.length, 2);
});
test('private conversation retrieves only owner context, saves raw input and uses server secret', async () => {
  const { handle, calls } = fixture(); const res = await handle(request({ remember: true, owner_id: 'other' })); const data = await res.json();
  assert.equal(res.status, 200); assert.equal(data.persisted, true); assert.equal(data.memoryId, 'saved-memory');
  assert.deepEqual(data.memorySources.map(row => row.id), ['own']);
  const read = calls.find(c => c.url.includes('solia_memories') && c.options.method !== 'POST');
  assert.equal(new URL(read.url).searchParams.get('owner_id'), `eq.${owner}`);
  assert.equal(read.options.headers.Authorization, 'Bearer test-user-token');
  const saved = calls.find(c => c.url.includes('solia_memories') && c.options.method === 'POST');
  assert.equal(JSON.parse(saved.options.body).owner_id, owner);
  assert.equal(JSON.parse(saved.options.body).metadata.status, 'raw_user_statement');
  const model = calls.find(c => c.url.startsWith('https://openrouter.ai/'));
  assert.equal(model.options.headers.Authorization, 'Bearer test-server-key');
  assert.ok(model.options.body.includes('Fuga Identitária')); assert.ok(!model.options.body.includes('SEGREDO_OUTRA_CONTA'));
  assert.ok(!JSON.stringify(data).includes('test-server-key'));
  assert.match(res.headers.get('cache-control'), /no-store/);
});
test('public mode never reads or writes private memories, even remember=true', async () => {
  const { handle, calls } = fixture(); const data = await (await handle(request({ mode: 'public', remember: true }))).json();
  assert.equal(data.persisted, false); assert.deepEqual(data.memorySources, []);
  assert.equal(calls.filter(c => c.url.includes('solia_memories')).length, 0);
  const model = calls.find(c => c.url.startsWith('https://openrouter.ai/'));
  assert.ok(!model.options.body.includes('Fuga Identitária')); assert.ok(model.options.body.includes('MODO PÚBLICO'));
  assert.equal(JSON.parse(model.options.body).max_tokens, 300);
});
test('save failure never claims persisted=true', async () => {
  const { handle } = fixture({ saveStatus: 403 }); const data = await (await handle(request({ remember: true }))).json();
  assert.equal(data.persisted, false); assert.ok(data.warnings.some(w => w.includes('NÃO')));
});
test('memory outage is visible, not fabricated continuity', async () => {
  const { handle } = fixture({ memoryStatus: 503 }); const data = await (await handle(request())).json();
  assert.deepEqual(data.memorySources, []); assert.ok(data.warnings.length > 0);
});
test('provider failure retains truthful saved state and redacts errors', async () => {
  const { handle } = fixture({ providerThrow: true }); const res = await handle(request({ remember: true })); const data = await res.json();
  assert.equal(res.status, 502); assert.equal(data.persisted, true); assert.equal(data.ok, false);
  assert.ok(!JSON.stringify(data).includes('PROVIDER_SECRET'));
});
test('403 never blindly retries another model or evades policy; one quota is one provider request', async () => {
  const { handle, calls } = fixture({ providerStatus: 403 });
  const res = await handle(request()); const data = await res.json();
  assert.equal(res.status, 502);
  assert.equal(data.errorCode, 'provider_forbidden');
  assert.equal(calls.filter(c => c.url.startsWith('https://openrouter.ai/')).length, 1);
  assert.equal(calls.filter(c => c.url.includes('reserve_solia_jarvis_turn')).length, 1);
});
test('eligible pilot model is selected explicitly and disables supported reasoning for conversational latency', async () => {
  const { handle, calls } = fixture({}, { ...env, JARVIS_MODEL: 'alibaba/qwen3.8-flash' });
  const data = await (await handle(request({ message: 'Oi' }))).json();
  assert.equal(data.modelUsed, 'alibaba/qwen3.8-flash');
  const body = JSON.parse(calls.find(c => c.url.startsWith('https://openrouter.ai/')).options.body);
  assert.deepEqual(body.reasoning, { enabled: false });
  assert.equal(body.max_tokens, 900);
});
test('all model access refusals return an explicit Gateway error', async () => {
  const { handle } = fixture({ providerStatus: 403 });
  const res = await handle(request());
  const data = await res.json();
  assert.equal(res.status, 502);
  assert.match(data.error, /Gateway/);
  assert.equal(data.providerStatus, 403);
});
test('no implicit memory write without explicit remember flag', async () => {
  const { handle, calls } = fixture(); const data = await (await handle(request())).json(); assert.equal(data.persisted, false);
  assert.equal(calls.filter(c => c.url.includes('solia_memories') && c.options.method === 'POST').length, 0);
});
test('method restriction and content type restriction', async () => {
  const { handle } = fixture(); assert.equal((await handle(request({}, {}, 'GET'))).status, 405);
  assert.equal((await handle(request({}, { 'Content-Type': 'text/plain' }))).status, 415);
});
test('lexical retrieval limits context and excludes unrelated and foreign records', () => {
  const rows = Array.from({ length: 20 }, (_, i) => ({ id: String(i), owner_id: owner, content: 'livro '.repeat(500) }));
  assert.equal(selectMemories(rows, 'livro', owner).length, 6);
  assert.ok(selectMemories(rows, 'livro', owner).every(row => row.content.length <= 1000));
  assert.equal(selectMemories(rows, 'campanha', owner).length, 0);
  assert.equal(selectMemories(rows, 'livro', 'other').length, 0);
});
