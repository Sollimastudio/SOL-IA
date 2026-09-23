import test from 'node:test';
import assert from 'node:assert/strict';
import {
  GPT6_LUNA_GATEWAY_MODEL,
  GPT6_SOL_GATEWAY_MODEL,
  resolveGpt6Experiment
} from '../server/gpt6-experiment.mjs';

test('GPT-6 candidates are inert by default', () => {
  const state = resolveGpt6Experiment({});
  assert.equal(state.requested, false);
  assert.equal(state.activationAllowed, false);
  assert.equal(state.reason, 'experiment_disabled');
  assert.equal(state.defaultModel, GPT6_LUNA_GATEWAY_MODEL);
  assert.equal(state.complexModel, GPT6_SOL_GATEWAY_MODEL);
  assert.equal(state.productionAutoSwitch, false);
});

test('requesting GPT-6 cannot bypass the paid-AI budget gate', () => {
  const state = resolveGpt6Experiment({ JARVIS_GPT6_EXPERIMENT_ENABLED: 'true' });
  assert.equal(state.activationAllowed, false);
  assert.equal(state.reason, 'metered_ai_disabled');
});

test('zero-cost mode wins over a paid GPT-6 experiment', () => {
  const state = resolveGpt6Experiment({
    JARVIS_GPT6_EXPERIMENT_ENABLED: 'true',
    JARVIS_METERED_AI_ENABLED: 'true',
    JARVIS_ZERO_COST_VERIFIED: 'true'
  });
  assert.equal(state.activationAllowed, false);
  assert.equal(state.reason, 'zero_cost_mode_active');
});

test('paid candidate becomes eligible only after both explicit gates', () => {
  const state = resolveGpt6Experiment({
    JARVIS_GPT6_EXPERIMENT_ENABLED: 'true',
    JARVIS_METERED_AI_ENABLED: 'true'
  });
  assert.equal(state.activationAllowed, true);
  assert.equal(state.reason, 'ready_for_supervised_test');
});

test('unknown model ids are not accepted as experiment configuration', () => {
  const state = resolveGpt6Experiment({
    JARVIS_GPT6_DEFAULT_MODEL: 'openai/not-real',
    JARVIS_GPT6_COMPLEX_MODEL: 'vendor/unknown'
  });
  assert.equal(state.defaultModel, GPT6_LUNA_GATEWAY_MODEL);
  assert.equal(state.complexModel, GPT6_SOL_GATEWAY_MODEL);
});
