import { test } from 'node:test';
import assert from 'node:assert/strict';
import { normalizeContinuityCues } from '../server/continuity-cues.mjs';
import { classifyContinuity } from '../server/continuity-runtime.mjs';

for (const phrase of [
  'Estou aqui pensando sobre o que eu acredito.',
  'Me peguei pensando se isso faz sentido.',
  'Venho pensando sobre esse assunto.'
]) {
  test(`natural reflection remains exploration: ${phrase}`, () => {
    const normalized = normalizeContinuityCues(phrase);
    const result = classifyContinuity(normalized, [], null);
    assert.equal(result.scope, 'exploration');
  });
}

test('normalizer does not rewrite unrelated statements', () => {
  const source='Meu objetivo é construir minha comunidade.';
  assert.equal(normalizeContinuityCues(source), source);
});
