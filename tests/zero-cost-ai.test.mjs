import test from 'node:test';
import assert from 'node:assert/strict';
import { applyZeroCostRuntime, modelIsZeroCost, verifyZeroCostGatewayModel, ZERO_COST_MODEL } from '../server/zero-cost-ai.mjs';

test('only the dedicated candidate with zero input and output price is accepted', () => {
  assert.equal(modelIsZeroCost({ id: ZERO_COST_MODEL, pricing: { input: '0', output: '0' } }), true);
  assert.equal(modelIsZeroCost({ id: ZERO_COST_MODEL, pricing: { input: '0', output: '0.0001' } }), false);
  assert.equal(modelIsZeroCost({ id: 'other/model', pricing: { input: '0', output: '0' } }), false);
});

test('catalog verification accepts current zero-cost model and rejects a price change', async () => {
  const ok = await verifyZeroCostGatewayModel(async () => Response.json({ data: [
    { id: ZERO_COST_MODEL, pricing: { input: '0', output: '0' } }
  ] }));
  assert.deepEqual(ok, { ok: true, reason: 'verified_zero_cost', model: ZERO_COST_MODEL });

  const priced = await verifyZeroCostGatewayModel(async () => Response.json({ data: [
    { id: ZERO_COST_MODEL, pricing: { input: '0.000001', output: '0.000002' } }
  ] }));
  assert.deepEqual(priced, { ok: false, reason: 'free_model_not_zero_cost', model: null });
});

test('catalog outage and missing model fail closed without choosing a fallback', async () => {
  const missing = await verifyZeroCostGatewayModel(async () => Response.json({ data: [{ id: 'other/model', pricing: { input: '0', output: '0' } }] }));
  assert.equal(missing.ok, false); assert.equal(missing.model, null);
  const outage = await verifyZeroCostGatewayModel(async () => { throw new Error('offline'); });
  assert.equal(outage.ok, false); assert.equal(outage.model, null);
});

test('zero-cost runtime cannot activate without the Vercel Gateway credential', () => {
  const base = {
    useGateway: true,
    gatewayCredential: 'oidc-test',
    env: { JARVIS_MODEL: 'paid/model', JARVIS_CHAT_ENABLED: 'false' },
    diagnostics: { readinessReason: 'ready' }
  };
  const enabled = applyZeroCostRuntime(base, { ok: true, model: ZERO_COST_MODEL });
  assert.equal(enabled.env.JARVIS_ZERO_COST_VERIFIED, 'true');
  assert.equal(enabled.env.JARVIS_MODEL, ZERO_COST_MODEL);
  assert.equal(enabled.env.JARVIS_CHAT_ENABLED, 'true');

  const noCredential = applyZeroCostRuntime({ ...base, gatewayCredential: '' }, { ok: true, model: ZERO_COST_MODEL });
  assert.equal(noCredential.env.JARVIS_ZERO_COST_VERIFIED, undefined);
});
