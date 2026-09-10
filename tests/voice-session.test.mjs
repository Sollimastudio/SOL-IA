import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createVoiceSession } from '../src/core/voiceSession.mjs';

test('no session without deliberate consent', () => {
  const gate = createVoiceSession();
  assert.equal(gate.start(false), false);
  assert.deepEqual(gate.accept('Jarvis, ideia'), { kind: 'ignored' });
});

test('foreground session ignores ambient speech until Jarvis is said', () => {
  const gate = createVoiceSession();
  gate.start(true);
  assert.deepEqual(gate.accept('estou conversando com outra pessoa'), { kind: 'ignored' });
  assert.equal(gate.isEngaged(), false);
  assert.deepEqual(gate.accept('Jarvis'), { kind: 'ignored' });
  assert.equal(gate.isEngaged(), true);
  assert.deepEqual(gate.accept('Tive uma ideia sobre meu livro'), { kind: 'message', text: 'Tive uma ideia sobre meu livro' });
});

test('Jarvis plus command activates and sends the first message immediately', () => {
  const gate = createVoiceSession();
  gate.start(true);
  assert.deepEqual(gate.accept('Jarvis, organize meu dia'), { kind: 'message', text: 'organize meu dia' });
  assert.equal(gate.isEngaged(), true);
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
  gate.accept('Jarvis');
  assert.equal(gate.accept('No meu livro a personagem decidiu encerrar o casamento').kind, 'message');
});

test('restart cannot revive stale session callbacks and requires Jarvis again', () => {
  const gate = createVoiceSession();
  gate.start(true);
  gate.accept('Jarvis');
  const old = gate.ticket();
  gate.stop();
  gate.start(true);
  assert.equal(gate.isCurrent(old), false);
  assert.equal(gate.isCurrent(gate.ticket()), true);
  assert.deepEqual(gate.accept('fala ambiente'), { kind: 'ignored' });
});

test('silence command works with accents and without assistant name', () => {
  for (const command of ['silêncio', 'Jarvis, parar de ouvir.', 'encerrar conversa']) {
    const gate = createVoiceSession();
    gate.start(true);
    assert.equal(gate.accept(command).kind, 'stop');
  }
});
