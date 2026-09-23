import test from 'node:test';
import assert from 'node:assert/strict';
import { runGpt6ResponsesProbe } from '../server/gpt6-responses.mjs';

const enabledEnv = {
  JARVIS_GPT6_EXPERIMENT_ENABLED: 'true',
  JARVIS_METERED_AI_ENABLED: 'true'
};

test('Responses probe never calls Gateway while experiment is disabled', async () => {
  let calls = 0;
  const result = await runGpt6ResponsesProbe({
    env: {},
    gatewayCredential: 'secret',
    input: 'teste',
    fetchImpl: async () => { calls += 1; return Response.json({}); }
  });
  assert.equal(result.executed, false);
  assert.equal(result.reason, 'experiment_disabled');
  assert.equal(calls, 0);
});

test('zero-cost mode blocks paid GPT-6 even when both paid flags are set', async () => {
  let calls = 0;
  const result = await runGpt6ResponsesProbe({
    env: { ...enabledEnv, JARVIS_ZERO_COST_VERIFIED: 'true' },
    gatewayCredential: 'secret',
    input: 'teste',
    fetchImpl: async () => { calls += 1; return Response.json({}); }
  });
  assert.equal(result.executed, false);
  assert.equal(result.reason, 'zero_cost_mode_active');
  assert.equal(calls, 0);
});

test('Responses probe requires a server-side Gateway credential', async () => {
  let calls = 0;
  const result = await runGpt6ResponsesProbe({
    env: enabledEnv,
    input: 'teste',
    fetchImpl: async () => { calls += 1; return Response.json({}); }
  });
  assert.equal(result.executed, false);
  assert.equal(result.reason, 'gateway_credential_missing');
  assert.equal(calls, 0);
});

test('Responses probe returns text, usage and latency without storing secrets', async () => {
  const calls = [];
  const result = await runGpt6ResponsesProbe({
    env: enabledEnv,
    gatewayCredential: 'gateway-test-token',
    input: 'Responda em uma frase.',
    reasoningEffort: 'none',
    fetchImpl: async (url, init) => {
      calls.push({ url: String(url), init });
      return Response.json({
        output_text: 'Resposta controlada.',
        usage: { input_tokens: 12, output_tokens: 4, total_tokens: 16 },
        providerMetadata: { gateway: { cost: 0.00001 } }
      }, { status: 200, headers: { 'x-request-id': 'req-test' } });
    }
  });
  assert.equal(result.ok, true);
  assert.equal(result.executed, true);
  assert.equal(result.text, 'Resposta controlada.');
  assert.equal(result.usage.inputTokens, 12);
  assert.equal(result.usage.gatewayCostUsd, 0.00001);
  assert.equal(result.gatewayRequestId, 'req-test');
  assert.equal(calls.length, 1);
  const sent = JSON.parse(calls[0].init.body);
  assert.equal(sent.model, 'openai/gpt-6-luna');
  assert.equal(sent.reasoning.effort, 'none');
  assert.equal(calls[0].init.headers.Authorization, 'Bearer gateway-test-token');
});

test('Responses probe classifies a Vercel budget rejection and does not retry', async () => {
  let calls = 0;
  const result = await runGpt6ResponsesProbe({
    env: enabledEnv,
    gatewayCredential: 'gateway-test-token',
    input: 'teste',
    fetchImpl: async () => {
      calls += 1;
      return Response.json({ error: { type: 'quota_for_entity_exceeded' } }, { status: 402 });
    }
  });
  assert.equal(result.ok, false);
  assert.equal(result.executed, true);
  assert.equal(result.reason, 'gateway_budget_exceeded');
  assert.equal(calls, 1);
});
