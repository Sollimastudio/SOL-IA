import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createVoiceSession } from '../src/core/voiceSession.mjs';
test('no session without deliberate consent', () => {
  const gate = createVoiceSession(); assert.equal(gate.start(false), false);
  assert.deepEqual(gate.accept('Jarvis, ideia'), { kind: 'ignored' });
});
test('active session accepts natural speech', () => {
  const gate = createVoiceSession(); gate.start(true);
  assert.deepEqual(gate.accept('Tive uma ideia sobre meu livro'), { kind: 'message', text: 'Tive uma ideia sobre meu livro' });
});
test('explicit ending stops session and invalidates late callbacks', () => {
  const gate = createVoiceSession(); gate.start(true); const ticket = gate.ticket();
  assert.deepEqual(gate.accept('Jarvis, encerrar!'), { kind: 'stop' });
  assert.equal(gate.isCurrent(ticket), false); assert.equal(gate.isActive(), false);
  assert.deepEqual(gate.accept('conversa do ambiente'), { kind: 'ignored' });
});
test('mentioning an ending inside a story is not a stop command', () => {
  const gate = createVoiceSession(); gate.start(true);
  assert.equal(gate.accept('No meu livro a personagem decidiu encerrar o casamento').kind, 'message');
});
test('restart cannot revive stale session callbacks', () => {
  const gate = createVoiceSession(); gate.start(true); const old = gate.ticket(); gate.stop(); gate.start(true);
  assert.equal(gate.isCurrent(old), false); assert.equal(gate.isCurrent(gate.ticket()), true);
});
test('silence command works with accents and without assistant name', () => {
  for (const command of ['silêncio', 'Jarvis, parar de ouvir.', 'encerrar conversa']) {
    const gate = createVoiceSession(); gate.start(true); assert.equal(gate.accept(command).kind, 'stop');
  }
});
