import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createJarvisHandler } from '../server/jarvis-chat.mjs';
import { resolvePilotRuntime } from '../server/pilot-runtime.mjs';
import { selectLocalPortugueseVoice } from '../src/core/localVoice.mjs';

const owner = '11111111-1111-4111-8111-111111111111';
const captureId = '22222222-2222-4222-8222-222222222222';
const env = { SUPABASE_URL: 'https://example.supabase.co', SUPABASE_ANON_KEY: 'test-public-key', JARVIS_ALLOWED_USER_IDS: owner };
const request = (overrides = {}) => new Request('https://example.invalid/api/jarvis-capture', {
  method: 'POST', headers: { authorization: 'Bearer test-token', 'content-type': 'application/json' },
  body: JSON.stringify({ message: '  Uma ideia\ncom detalhes.  ', mode: 'private', remember: true, captureId, ...overrides })
});
function fixture(options = {}) {
  const calls = [], records = new Map(); let inserts = 0;
  const fetchImpl = async (url, init) => {
    calls.push({url, init});
    assert.ok(url.startsWith(env.SUPABASE_URL), 'only Supabase, never a model provider');
    if (url.endsWith('/auth/v1/user')) return Response.json({ id: options.owner ?? owner }, {status:options.authStatus ?? 200});
    assert.ok(url.includes('/solia_memories?'), 'no AI quota or library RPC');
    if (init.method === 'POST') {
      const record = JSON.parse(init.body); inserts++;
      if (options.saveStatus) return Response.json({}, {status:options.saveStatus});
      if (records.has(record.id)) return Response.json({}, { status: 409 });
      records.set(record.id, record);
      if (options.lostAck && inserts === 1) throw new Error('network lost after commit');
      return Response.json([{ id: options.wrongId ? 'wrong' : record.id }], {status:201});
    }
    const params = new URL(url).searchParams;
    assert.equal(params.get('owner_id'), `eq.${owner}`);
    assert.equal(params.get('id'), `eq.${captureId}`);
    return Response.json(options.foreign ? [{id:captureId,owner_id:'foreign',content:'private'}] : [...records.values()]);
  };
  return {calls, records, handle:createJarvisHandler({env, fetchImpl, captureOnly:true})};
}
test('capture works with no model keys or AI flag and preserves the original text', async () => {
  const f=fixture(); const result=await (await f.handle(request({owner_id:'foreign'}))).json();
  assert.equal(result.persisted,true); assert.equal(result.memoryId,captureId); assert.equal(result.execution,'capture_only');
  assert.equal(f.records.get(captureId).owner_id,owner);
  assert.equal(f.records.get(captureId).content,'  Uma ideia\ncom detalhes.  ');
  assert.equal(f.records.get(captureId).metadata.source,'jarvis-capture-v1');
  assert.equal(f.calls.length,2);
});
test('lost acknowledgment resolves on the same ID without duplicate or overwrite', async () => {
  const f=fixture({lostAck:true});
  assert.equal((await (await f.handle(request())).json()).persisted,null);
  const retry=await (await f.handle(request())).json();
  assert.equal(retry.persisted,true); assert.equal(f.records.size,1);
  const conflict=await f.handle(request({message:'Conteúdo diferente'}));
  assert.equal(conflict.status,409); assert.equal((await conflict.json()).errorCode,'capture_conflict');
  assert.equal(f.records.get(captureId).content,'  Uma ideia\ncom detalhes.  ');
});
test('capture rejects public mode, unconsented save, supplied history and malformed ID before access', async () => {
  for (const body of [{mode:'public'},{remember:false},{history:[{role:'user',content:'other'}]},{captureId:'not-uuid'}]) {
    const f=fixture(); assert.equal((await f.handle(request(body))).status,400); assert.equal(f.calls.length,0);
  }
});
test('capture enforces verified identity and known access rejection', async () => {
  for (const options of [{owner:'other'},{authStatus:401},{authStatus:503}]) {
    const f=fixture(options); const data=await (await f.handle(request())).json();
    assert.equal(data.persisted,false); assert.equal(data.stage,'access'); assert.equal(f.calls.length,1);
  }
});
test('capture does not claim success on denied, failed or malformed save', async () => {
  for (const [options,persisted] of [[{saveStatus:403},false],[{saveStatus:503},null],[{wrongId:true},null]]) {
    const f=fixture(options); const data=await (await f.handle(request())).json();
    assert.equal(data.ok,false); assert.equal(data.persisted,persisted);
  }
});
test('conflict recovery never accepts another owner record', async () => {
  const f=fixture({foreign:true}); await f.handle(request());
  const response=await f.handle(request()); assert.equal(response.status,409);
  assert.equal((await response.json()).persisted,false);
});
test('zero-budget guard blocks even configured credentials before network or quota', async () => {
  for (const flag of [undefined,'false','TRUE','1']) {
    const calls=[];
    const handle=createJarvisHandler({env:{...env,JARVIS_CHAT_ENABLED:'true',OPENROUTER_API_KEY:'test-key',JARVIS_MODEL:'test',JARVIS_METERED_AI_ENABLED:flag},fetchImpl:async (...args)=>{calls.push(args);throw new Error();}});
    const data=await (await handle(request())).json(); assert.equal(data.errorCode,'ai_budget_paused'); assert.equal(calls.length,0);
  }
});
test('capture access resolution does not obtain any provider credentials', async () => {
  let oidcCalls=0; const calls=[];
  const runtime=await resolvePilotRuntime(request(),env,async url=>{
    calls.push(url);
    return Response.json(url.endsWith('/auth/v1/user') ? {id:owner} : [{owner_id:owner,can_use_ai:false}]);
  },()=>{oidcCalls++;return 'not-used';},{resolveProvider:false});
  assert.equal(runtime.diagnostics.pilotVerified,true); assert.equal(oidcCalls,0); assert.equal(calls.length,2);
  assert.equal(runtime.diagnostics.providerCredentialPresent,false);
});
test('local reading prefers Brazilian Portuguese and never falls back to a remote voice', () => {
  const remote={name:'remote',lang:'pt-BR',localService:false};
  const pt={name:'local PT',lang:'pt-PT',localService:true};
  const br={name:'local BR',lang:'pt-BR',localService:true};
  assert.equal(selectLocalPortugueseVoice([remote]),null);
  assert.equal(selectLocalPortugueseVoice([remote,pt,br]),br);
  assert.equal(selectLocalPortugueseVoice([remote,pt]),pt);
});
