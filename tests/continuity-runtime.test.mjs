import { test } from 'node:test';
import assert from 'node:assert/strict';
import { classifyContinuity, continuitySystemText } from '../server/continuity-runtime.mjs';

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
