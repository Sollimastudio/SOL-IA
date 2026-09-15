import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createVoiceSession, VOICE_WAKE_PHRASE } from '../src/core/voiceSession.mjs';

test('wake phrase is explicit and versioned in code', () => {
  assert.equal(VOICE_WAKE_PHRASE, 'Jarvis, tá aí?');
});

test('no session without deliberate consent', () => {
  const gate = createVoiceSession();
  assert.equal(gate.start(false), false);
  assert.deepEqual(gate.accept('Jarvis, tá aí? ideia'), { kind: 'ignored' });
});

test('foreground session ignores ambient speech and plain Jarvis until full wake phrase is said', () => {
  const gate = createVoiceSession();
  gate.start(true);
  assert.deepEqual(gate.accept('estou conversando com outra pessoa'), { kind: 'ignored' });
  assert.deepEqual(gate.accept('Jarvis'), { kind: 'ignored' });
  assert.equal(gate.isEngaged(), false);
  assert.deepEqual(gate.accept('Jarvis, tá aí?'), { kind: 'ignored' });
  assert.equal(gate.isEngaged(), true);
  assert.deepEqual(gate.accept('Tive uma ideia sobre meu livro'), { kind: 'message', text: 'Tive uma ideia sobre meu livro' });
});

test('natural wake variants activate and can carry the first command', () => {
  for (const phrase of ['Jarvis, tá aí? organize meu dia', 'Jarvis taí, organize meu dia', 'Jarvis, está aí? organize meu dia', 'Jarvis, você tá aí? organize meu dia']) {
    const gate = createVoiceSession();
    gate.start(true);
    assert.deepEqual(gate.accept(phrase), { kind: 'message', text: 'organize meu dia' });
    assert.equal(gate.isEngaged(), true);
  }
});

test('repeating wake phrase while engaged does not leak it into message content', () => {
  const gate = createVoiceSession();
  gate.start(true);
  gate.accept('Jarvis, tá aí?');
  assert.deepEqual(gate.accept('Jarvis, tá aí? olha isso'), { kind: 'message', text: 'olha isso' });
});

test('assistant wake acknowledgement echo is ignored after activation', () => {
  for (const echoed of ['Tô aqui. Pode falar.', 'To aqui pode falar', 'Estou aqui.']) {
    const gate = createVoiceSession();
    gate.start(true);
    gate.accept('Jarvis, tá aí?');
    assert.deepEqual(gate.accept(echoed), { kind: 'ignored' });
    assert.equal(gate.isEngaged(), true);
  }
});

test('explicit ending stops session and invalidates late callbacks', () => {
  const gate = createVoiceSession();
  gate.start(true);
  const ticket = gate.ticket();
  assert.deepEqual(gate.accept('Jarvis, encerrar!'), { kind: 'stop' });
  assert.equal(gate.isCurrent(ticket), false);
  assert.equal(gate.isActive(), false);
  assert.deepEqual(gate.accept('conversa do ambiente'), { kind: 'ignored' });
});

test('mentioning an ending inside a story is not a stop command after activation', () => {
  const gate = createVoiceSession();
  gate.start(true);
  gate.accept('Jarvis, tá aí?');
  assert.equal(gate.accept('No meu livro a personagem decidiu encerrar o casamento').kind, 'message');
});

test('restart cannot revive stale session callbacks and requires full wake phrase again', () => {
  const gate = createVoiceSession();
  gate.start(true);
  gate.accept('Jarvis, tá aí?');
  const old = gate.ticket();
  gate.stop();
  gate.start(true);
  assert.equal(gate.isCurrent(old), false);
  assert.equal(gate.isCurrent(gate.ticket()), true);
  assert.deepEqual(gate.accept('fala ambiente'), { kind: 'ignored' });
  assert.deepEqual(gate.accept('Jarvis'), { kind: 'ignored' });
  assert.equal(gate.isEngaged(), false);
});

test('silence command works with accents and without wake phrase', () => {
  for (const command of ['silêncio', 'Jarvis, parar de ouvir.', 'encerrar conversa']) {
    const gate = createVoiceSession();
    gate.start(true);
    assert.equal(gate.accept(command).kind, 'stop');
  }
});
