import { test } from 'node:test';
import assert from 'node:assert/strict';
import { classifyContinuity, continuitySystemText, loadContinuityPacket, persistContinuityFromResponse } from '../server/continuity-runtime.mjs';

test('repeat stays repeat instead of rediscovery', () => {
  const prior=[{id:'1',content:'Quero um Jarvis que guarde tudo e nao me faça repetir.',match_kind:'match'}];
  const result=classifyContinuity('Quero um Jarvis que guarde tudo e nao me faça repetir.',prior,{likelyRepeat:true,currentBranch:'jarvis memória',newSignals:[]});
  assert.equal(result.relation,'repeat');
});

test('explicit correction outranks lexical similarity', () => {
  const prior=[{id:'1',content:'Quero o Jarvis usando minha voz para conversar.',match_kind:'match'}];
  const result=classifyContinuity('Corrigindo: não quero minha voz para conversar, só para conteúdo.',prior,null);
  assert.equal(result.relation,'correction');
  assert.equal(result.scope,'explicit_update');
});

test('temporary state never becomes stable identity', () => {
  const result=classifyContinuity('Hoje estou sem energia e mais chateada.',[],null);
  assert.equal(result.scope,'temporary_state');
});

test('exploration remains exploration', () => {
  const result=classifyContinuity('Talvez eu goste disso, quero descobrir.',[],null);
  assert.equal(result.scope,'exploration');
});

test('system directive forbids repeated rediscovery and identity drift', () => {
  const text=continuitySystemText([{content:'x'}], classifyContinuity('Hoje estou cansada.',[],null));
  assert.match(text,/Nao reexplique a visao do projeto/);
  assert.match(text,/Estado temporario NAO substitui identidade/);
  assert.match(text,/agora entendi/);
});

test('public mode never queries continuity vault', async () => {
  let calls=0;
  const request=new Request('https://test.invalid/api/jarvis-chat',{headers:{authorization:'Bearer token'}});
  const rows=await loadContinuityPacket({request,env:{SUPABASE_URL:'https://example.supabase.co',SUPABASE_ANON_KEY:'key'},envelope:{mode:'public',message:'oi'},fetchImpl:async()=>{calls++;throw new Error('must not call');}});
  assert.deepEqual(rows,[]); assert.equal(calls,0);
});

test('private retrieval truncates untrusted rows and uses RPC', async () => {
  let seenBody;
  const request=new Request('https://test.invalid/api/jarvis-chat',{headers:{authorization:'Bearer token'}});
  const rows=await loadContinuityPacket({request,env:{SUPABASE_URL:'https://example.supabase.co',SUPABASE_ANON_KEY:'key'},envelope:{mode:'private',message:'jarvis'},fetchImpl:async (url,init)=>{seenBody=JSON.parse(init.body); return Response.json([{id:'1',content:'x'.repeat(4000),topic_hint:'t'.repeat(300),match_kind:'match'}]);}});
  assert.equal(seenBody.p_query,'jarvis');
  assert.equal(rows[0].content.length,1600);
  assert.equal(rows[0].topic_hint.length,160);
});

test('continuity persistence happens only after confirmed memory write', async () => {
  let calls=0;
  const request=new Request('https://test.invalid/api/jarvis-chat',{headers:{authorization:'Bearer token'}});
  const response=Response.json({ok:true,persisted:true,memoryId:'11111111-1111-4111-8111-111111111111',warnings:[]});
  const classification=classifyContinuity('A partir de agora fica definido assim.',[],null);
  const out=await persistContinuityFromResponse({request,env:{SUPABASE_URL:'https://example.supabase.co',SUPABASE_ANON_KEY:'key'},envelope:{mode:'private',remember:true},classification,response,fetchImpl:async()=>{calls++; return Response.json([{id:'event'}]);}});
  const data=await out.json();
  assert.equal(calls,1); assert.equal(data.continuityPersisted,true); assert.equal(data.continuity.relation,'decision');
});

test('unsaved memory never creates continuity event', async () => {
  let calls=0;
  const request=new Request('https://test.invalid/api/jarvis-chat',{headers:{authorization:'Bearer token'}});
  const response=Response.json({ok:false,persisted:false});
  const out=await persistContinuityFromResponse({request,env:{SUPABASE_URL:'https://example.supabase.co',SUPABASE_ANON_KEY:'key'},envelope:{mode:'private',remember:true},classification:classifyContinuity('oi',[],null),response,fetchImpl:async()=>{calls++; return Response.json({});}});
  assert.equal(calls,0); assert.equal((await out.json()).persisted,false);
});
