import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { AUDIENCE_INTELLIGENCE_DIRECTIVE, AUDIENCE_INTELLIGENCE_VERSION, conversionScenario } from '../core/audience-intelligence.mjs';
import { SOL_PRESENCE_PROFILE } from '../core/presence-profile.mjs';

test('audience layer distinguishes qualified attention from raw reach and refuses fake forecasts', () => {
  assert.match(AUDIENCE_INTELLIGENCE_DIRECTIVE, /atenção qualificada/i);
  assert.match(AUDIENCE_INTELLIGENCE_DIRECTIVE, /Nunca inventar percentual de compra/i);
  assert.match(AUDIENCE_INTELLIGENCE_DIRECTIVE, /cenário, não previsão/i);
  assert.match(AUDIENCE_INTELLIGENCE_DIRECTIVE, /não classificar ou excluir pessoas por pobreza/i);
  assert.match(AUDIENCE_INTELLIGENCE_DIRECTIVE, /não alegar controlar para quem o algoritmo entregará/i);
});

test('10k-view conversion math is explicit scenario, never a forecast', () => {
  assert.deepEqual(conversionScenario(10_000), [
    { rate: 0.001, buyers: 10, kind: 'scenario_not_forecast' },
    { rate: 0.005, buyers: 50, kind: 'scenario_not_forecast' },
    { rate: 0.01, buyers: 100, kind: 'scenario_not_forecast' }
  ]);
  assert.throws(() => conversionScenario(-1), /non-negative/);
  assert.throws(() => conversionScenario(10, [1.2]), /between 0 and 1/);
});

test('active Jarvis API wires both Sol presence and audience intelligence into provider guidance', async () => {
  const source = await readFile(new URL('../api/jarvis-chat.ts', import.meta.url), 'utf8');
  assert.match(source, /SOL_PRESENCE_PROFILE/);
  assert.match(source, /AUDIENCE_INTELLIGENCE_DIRECTIVE/);
  assert.match(source, /first\.content \+=/);
  assert.ok(SOL_PRESENCE_PROFILE.includes('PRESENCA_SOL='));
  assert.equal(AUDIENCE_INTELLIGENCE_VERSION, '2026-09-14.1');
});
