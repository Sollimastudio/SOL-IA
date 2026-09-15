import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createJarvisCoreHandler, JARVIS_CORE_VERSION } from '../server/jarvis-core.mjs';

const owner = '11111111-1111-4111-8111-111111111111';
const env = {
  SUPABASE_URL: 'https://example.supabase.co',
  SUPABASE_ANON_KEY: 'test-publishable-key',
  JARVIS_ALLOWED_USER_IDS: owner,
  JARVIS_KNOWLEDGE_ENABLED: 'true'
};

const request = (body = { query: 'reposicione-se' }, headers = {}) => new Request('https://test.invalid/api/jarvis-core', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json', Authorization: 'Bearer test-user-token', ...headers },
  body: JSON.stringify(body)
});

function fixture(overrides = {}, config = env) {
  const calls = [];
  const fetchImpl = async (url, options = {}) => {
    calls.push({ url, options });
    if (url.endsWith('/auth/v1/user')) return Response.json({ id: overrides.owner || owner }, { status: overrides.authStatus || 200 });
    if (url.includes('/rpc/search_solia_continuity')) {
      if (overrides.continuityStatus) return Response.json({}, { status: overrides.continuityStatus });
      return Response.json([{ id: 'c1', relation: 'detail', scope: 'raw_statement', topic_hint: 'Jarvis', delta_hint: 'servidor', content: 'Servidor privado do Jarvis.', created_at: '2026-09-15T00:00:00Z', match_kind: 'match', signals: { rootTopic: 'Jarvis', currentBranch: 'Servidor', returnNeeded: true } }]);
    }
    if (url.includes('/rpc/search_solia_profile_claims')) return Response.json([{ id: 'p1', kind: 'goal', topic_hint: 'Jarvis', content: 'Quero construir meu Jarvis.', created_at: '2026-09-15T00:00:00Z', match_kind: 'match' }]);
    if (url.includes('/rpc/search_solia_assistant_history')) return Response.json([{ id: 'a1', specialist: 'jarvis_executive', answer: 'Próximo passo: Core read-only.', created_at: '2026-09-15T00:00:00Z', match_kind: 'match' }]);
    if (url.includes('/rpc/search_solia_knowledge')) return Response.json([{
      id: 'k1', owner_id: owner, project_key: 'geral', title: 'Arquitetura Jarvis', version: 1,
      checksum: 'a'.repeat(64), start_char: 1, end_char: 20, content: 'Conhecimento versionado.'
    }]);
    throw new Error(`Unexpected route: ${url}`);
  };
  return { calls, handle: createJarvisCoreHandler({ env: config, fetchImpl }) };
}

test('Jarvis Core fails closed before network when configuration is incomplete', async () => {
  const { handle, calls } = fixture({}, { SUPABASE_URL: '', SUPABASE_ANON_KEY: '', JARVIS_ALLOWED_USER_IDS: '' });
  const res = await handle(request());
  assert.equal(res.status, 503);
  assert.equal(calls.length, 0);
});

test('Jarvis Core requires the authenticated private session', async () => {
  const { handle, calls } = fixture();
  const res = await handle(request(undefined, { Authorization: '' }));
  assert.equal(res.status, 401);
  assert.equal(calls.length, 0);
});

test('Jarvis Core blocks accounts outside the private allowlist', async () => {
  const { handle, calls } = fixture({ owner: '22222222-2222-4222-8222-222222222222' });
  const res = await handle(request());
  assert.equal(res.status, 403);
  assert.equal(calls.length, 1);
});

test('Jarvis Core reads continuity, profile, history and knowledge without model or writes', async () => {
  const { handle, calls } = fixture();
  const res = await handle(request());
  const data = await res.json();
  assert.equal(res.status, 200);
  assert.equal(data.ok, true);
  assert.equal(data.version, JARVIS_CORE_VERSION);
  assert.equal(data.mode, 'read_only');
  assert.equal(data.thread.rootTopic, 'Jarvis');
  assert.equal(data.thread.currentBranch, 'Servidor');
  assert.equal(data.thread.returnNeeded, true);
  assert.deepEqual(data.counts, { continuity: 1, profile: 1, assistantHistory: 1, knowledge: 1 });
  assert.equal(data.context.knowledge[0].status, 'imported_unverified');
  assert.equal(JSON.stringify(data).includes(owner), false);
  assert.ok(calls.every(call => call.url.startsWith('https://example.supabase.co/')));
  assert.equal(calls.some(call => /openrouter|ai-gateway|openai\.com/i.test(call.url)), false);
  assert.equal(calls.some(call => call.options.method === 'DELETE' || call.options.method === 'PATCH' || call.options.method === 'PUT'), false);
  assert.match(res.headers.get('cache-control'), /no-store/);
  assert.equal(res.headers.get('x-jarvis-core-mode'), 'read-only');
});

test('Jarvis Core returns partial truthful context when one source is unavailable', async () => {
  const { handle } = fixture({ continuityStatus: 503 });
  const res = await handle(request({ query: 'jarvis' }));
  const data = await res.json();
  assert.equal(res.status, 200);
  assert.deepEqual(data.context.continuity, []);
  assert.equal(data.context.profile.length, 1);
  assert.ok(data.warnings.some(item => item.includes('Continuidade')));
});

test('Jarvis Core validates query size and content type before data access', async () => {
  const { handle, calls } = fixture();
  assert.equal((await handle(request({ query: '' }))).status, 400);
  assert.equal((await handle(request({ query: 'x'.repeat(1001) }))).status, 400);
  assert.equal((await handle(request({ query: 'ok' }, { 'Content-Type': 'text/plain' }))).status, 415);
  assert.equal(calls.length, 0);
});
