import { test } from 'node:test';
import assert from 'node:assert/strict';
import { analyzeConversation } from '../server/anti-fatigue.mjs';

test('first message establishes a root without diagnosing the user', () => {
  const state = analyzeConversation([], 'Quero estruturar o projeto Feminicídio Emocional e transformar isso em apresentação.');
  assert.equal(state.userTurnCount, 1);
  assert.equal(state.likelyRepeat, false);
  assert.equal(state.likelyBranch, false);
  assert.match(state.rootTopic, /feminicidio|emocional|estruturar|projeto/);
  assert.doesNotMatch(JSON.stringify(state), /tdah|diagnost|transtorno|ansiedade/i);
});

test('similar repeated input is treated silently as a delta, not a reprimand', () => {
  const history = [
    { role: 'user', content: 'Quero organizar meu livro Morte em Vida, manter a nota forense e revisar a abertura.' },
    { role: 'assistant', content: 'Certo.' },
    { role: 'user', content: 'No Morte em Vida quero manter a nota forense e revisar a abertura do livro.' }
  ];
  const state = analyzeConversation(history, 'Quero revisar de novo a abertura do Morte em Vida e manter a nota forense.');
  assert.equal(state.likelyRepeat, true);
  assert.match(state.guidance, /delta novo/);
  assert.doesNotMatch(state.guidance, /você já falou|vezes|repetiu/i);
});

test('a distant topic becomes a branch while preserving the original root', () => {
  const history = [
    { role: 'user', content: 'Vamos terminar a estrutura do livro Reposicione-se e definir o capítulo sobre posicionamento.' },
    { role: 'assistant', content: 'Vamos.' }
  ];
  const state = analyzeConversation(history, 'Também preciso pensar numa campanha de Instagram para vender Magnetus esta semana.');
  assert.equal(state.likelyBranch, true);
  assert.equal(state.returnNeeded, true);
  assert.match(state.rootTopic, /livro|reposicione|estrutura|posicionamento/);
  assert.match(state.currentBranch, /campanha|instagram|vender|magnetus/);
});

test('new detail inside same subject is not automatically marked as repetition', () => {
  const history = [{ role: 'user', content: 'Quero escrever sobre Fuga Identitária e apagamento do eu.' }];
  const state = analyzeConversation(history, 'A novidade é que quero ligar o capítulo ao comportamento pós-pandemia e pertencimento.');
  assert.equal(state.likelyRepeat, false);
  assert.ok(state.novelty > 0.4);
});
