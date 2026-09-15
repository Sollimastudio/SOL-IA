import { test } from 'node:test';
import assert from 'node:assert/strict';
import { JARVIS_INVARIANTS_VERSION } from '../core/jarvis-invariants.mjs';
import { classifyContinuity, continuitySystemText, loadAssistantHistoryPacket, loadContinuityPacket, loadProfilePacket, persistContinuityFromResponse } from '../server/continuity-runtime.mjs';

test('repeat stays repeat instead of rediscovery', () => {
  const prior=[{id:'11111111-1111-4111-8111-111111111111',content:'Quero um Jarvis que guarde tudo e nao me faça repetir.',match_kind:'match'}];
  const result=classifyContinuity('Quero um Jarvis que guarde tudo e nao me faça repetir.',prior,{likelyRepeat:true,currentBranch:'jarvis memória',rootTopic:'continuidade',newSignals:[]});
  assert.equal(result.relation,'repeat');
  assert.equal(result.signals.priorEventId,prior[0].id);
  assert.equal(result.signals.rootTopic,'continuidade');
  assert.equal(result.signals.currentBranch,'jarvis memória');
});

test('explicit correction outranks lexical similarity and links prior event', () => {
  const prior=[{id:'11111111-1111-4111-8111-111111111111',content:'Quero o Jarvis usando minha voz para conversar.',match_kind:'match'}];
  const result=classifyContinuity('Corrigindo: não quero minha voz para conversar, só para conteúdo.',prior,null);
  assert.equal(result.relation,'correction');
  assert.equal(result.scope,'explicit_update');
  assert.equal(result.signals.profileKind,'correction');
  assert.equal(result.signals.priorEventId,prior[0].id);
});

test('branch preserves root and return signal instead of dropping the main thread', () => {
  const result=classifyContinuity('Outra coisa: quero pensar no editor de vídeo.',[],{likelyBranch:true,rootTopic:'jarvis continuidade',currentBranch:'editor vídeo',returnNeeded:true,newSignals:['editor','vídeo']});
  assert.equal(result.relation,'branch');
  assert.equal(result.signals.rootTopic,'jarvis continuidade');
  assert.equal(result.signals.currentBranch,'editor vídeo');
  assert.equal(result.signals.returnNeeded,true);
});

test('temporary state never becomes stable identity', () => {
  const result=classifyContinuity('Hoje estou sem energia e mais chateada.',[],null);
  assert.equal(result.scope,'temporary_state');
  assert.equal(result.signals.profileKind,null);
});

test('exploration remains exploration', () => {
  const result=classifyContinuity('Talvez eu goste disso, quero descobrir.',[],null);
  assert.equal(result.scope,'exploration');
});

test('goal and boundary become operational profile statements', () => {
  const goal=classifyContinuity('Meu objetivo é construir uma comunidade paga forte.',[],null);
  assert.equal(goal.scope,'profile_statement'); assert.equal(goal.signals.profileKind,'goal');
  const boundary=classifyContinuity('Não quero que o Jarvis fale demais comigo.',[],null);
  assert.equal(boundary.scope,'profile_statement'); assert.equal(boundary.signals.profileKind,'boundary');
});

test('system directive separates state, exploration, assistant output and user decisions', () => {
  const text=continuitySystemText(
    [{content:'x',signals:{rootTopic:'jarvis',currentBranch:'memória'}}],
    classifyContinuity('Hoje estou cansada.',[],null),
    [{kind:'goal',content:'Construir comunidade.'}],
    [{answer:'Já expliquei a arquitetura ontem.',specialist:'jarvis_executive'}]
  );
  assert.match(text,new RegExp(`JARVIS_INVARIANTS=${JARVIS_INVARIANTS_VERSION.replaceAll('.','\\.')}`));
  assert.match(text,/Nao reexplique a visao do projeto/);
  assert.match(text,/Estado temporario NAO substitui identidade/);
  assert.match(text,/Exploracao nao e opiniao consolidada/);
  assert.match(text,/Resposta, inferencia ou sugestao do assistente nao e decisao da usuaria/);
  assert.match(text,/PERFIL_DNA_OPERACIONAL/);
  assert.match(text,/HISTORICO_ASSISTENTE/);
  assert.match(text,/NAO e fato sobre a usuaria/);
  assert.match(text,/agora entendi/);
});

test('public mode never queries private continuity, profile or assistant history', async () => {
  let calls=0;
  const request=new Request('https://test.invalid/api/jarvis-chat',{headers:{authorization:'Bearer token'}});
  const args={request,env:{SUPABASE_URL:'https://example.supabase.co',SUPABASE_ANON_KEY:'key'},envelope:{mode:'public',message:'oi'},fetchImpl:async()=>{calls++;throw new Error('must not call');}};
  assert.deepEqual(await loadContinuityPacket(args),[]);
  assert.deepEqual(await loadProfilePacket(args),[]);
  assert.deepEqual(await loadAssistantHistoryPacket(args),[]);
  assert.equal(calls,0);
});

test('private retrieval truncates untrusted rows, preserves safe tree metadata and uses RPC', async () => {
  let seenBody;
  const request=new Request('https://test.invalid/api/jarvis-chat',{headers:{authorization:'Bearer token'}});
  const rows=await loadContinuityPacket({request,env:{SUPABASE_URL:'https://example.supabase.co',SUPABASE_ANON_KEY:'key'},envelope:{mode:'private',message:'jarvis'},fetchImpl:async (url,init)=>{seenBody=JSON.parse(init.body); return Response.json([{id:'1',content:'x'.repeat(4000),topic_hint:'t'.repeat(300),match_kind:'match',signals:{rootTopic:'r'.repeat(300),currentBranch:'b'.repeat(300),priorEventId:'p'.repeat(200),returnNeeded:true,ignored:'secret'}}]);}});
  assert.equal(seenBody.p_query,'jarvis');
  assert.equal(rows[0].content.length,1600);
  assert.equal(rows[0].topic_hint.length,160);
  assert.equal(rows[0].signals.rootTopic.length,160);
  assert.equal(rows[0].signals.currentBranch.length,160);
  assert.equal(rows[0].signals.priorEventId.length,80);
  assert.equal(rows[0].signals.returnNeeded,true);
  assert.equal(rows[0].signals.ignored,undefined);
});

test('profile retrieval uses dedicated RPC and truncates rows', async () => {
  let calledUrl='';
  const request=new Request('https://test.invalid/api/jarvis-chat',{headers:{authorization:'Bearer token'}});
  const rows=await loadProfilePacket({request,env:{SUPABASE_URL:'https://example.supabase.co',SUPABASE_ANON_KEY:'key'},envelope:{mode:'private',message:'comunidade'},fetchImpl:async (url)=>{calledUrl=String(url); return Response.json([{id:'1',kind:'goal',content:'x'.repeat(4000),topic_hint:'t'.repeat(300),match_kind:'match'}]);}});
  assert.match(calledUrl,/search_solia_profile_claims/);
  assert.equal(rows[0].content.length,1600); assert.equal(rows[0].topic_hint.length,160);
});

test('assistant history retrieval uses dedicated RPC and truncates generated answer', async () => {
  let calledUrl='';
  const request=new Request('https://test.invalid/api/jarvis-chat',{headers:{authorization:'Bearer token'}});
  const rows=await loadAssistantHistoryPacket({request,env:{SUPABASE_URL:'https://example.supabase.co',SUPABASE_ANON_KEY:'key'},envelope:{mode:'private',message:'arquitetura'},fetchImpl:async (url)=>{calledUrl=String(url); return Response.json([{id:'1',answer:'x'.repeat(4000),specialist:'jarvis_executive',match_kind:'match'}]);}});
  assert.match(calledUrl,/search_solia_assistant_history/);
  assert.equal(rows[0].answer.length,1800);
});

test('continuity persistence happens only after confirmed memory write and carries supersession link', async () => {
  let calls=0;
  let continuityBody=null;
  const request=new Request('https://test.invalid/api/jarvis-chat',{headers:{authorization:'Bearer token'}});
  const response=Response.json({ok:true,persisted:true,memoryId:'22222222-2222-4222-8222-222222222222',warnings:[]});
  const classification=classifyContinuity('Corrigindo: a partir de agora fica definido assim.',[{id:'11111111-1111-4111-8111-111111111111',content:'regra antiga',match_kind:'match'}],null);
  const out=await persistContinuityFromResponse({request,env:{SUPABASE_URL:'https://example.supabase.co',SUPABASE_ANON_KEY:'key'},envelope:{mode:'private',remember:true},classification,response,fetchImpl:async (url,init)=>{calls++; continuityBody=JSON.parse(init.body); return Response.json([{id:'event'}]);}});
  const data=await out.json();
  assert.equal(calls,1); assert.equal(data.continuityPersisted,true); assert.equal(data.profileUpdated,true); assert.equal(data.continuity.relation,'correction');
  assert.equal(continuityBody.p_signals.priorEventId,'11111111-1111-4111-8111-111111111111');
});

test('successful generated answer is archived separately after memory confirmation', async () => {
  const urls=[];
  const request=new Request('https://test.invalid/api/jarvis-chat',{headers:{authorization:'Bearer token'}});
  const response=Response.json({ok:true,persisted:true,memoryId:'11111111-1111-4111-8111-111111111111',answer:'Resposta nova.',specialist:'jarvis_executive',modelUsed:'model',promptVersion:'v1',warnings:[]});
  const classification=classifyContinuity('Meu objetivo é avançar.',[],null);
  const out=await persistContinuityFromResponse({request,env:{SUPABASE_URL:'https://example.supabase.co',SUPABASE_ANON_KEY:'key'},envelope:{mode:'private',remember:true},classification,response,fetchImpl:async (url)=>{urls.push(String(url)); return Response.json([{id:'ok'}]);}});
  const data=await out.json();
  assert.equal(urls.length,2);
  assert.ok(urls.some(url=>url.includes('record_solia_continuity_event')));
  assert.ok(urls.some(url=>url.includes('record_solia_assistant_response')));
  assert.equal(data.assistantHistoryPersisted,true);
});

test('unsaved memory never creates continuity or assistant history', async () => {
  let calls=0;
  const request=new Request('https://test.invalid/api/jarvis-chat',{headers:{authorization:'Bearer token'}});
  const response=Response.json({ok:false,persisted:false,answer:'nao deve salvar'});
  const out=await persistContinuityFromResponse({request,env:{SUPABASE_URL:'https://example.supabase.co',SUPABASE_ANON_KEY:'key'},envelope:{mode:'private',remember:true},classification:classifyContinuity('oi',[],null),response,fetchImpl:async()=>{calls++; return Response.json({});}});
  assert.equal(calls,0); assert.equal((await out.json()).persisted,false);
});
