import { test } from 'node:test';
import assert from 'node:assert/strict';
import { classifyProviderError, providerErrorMessage } from '../server/provider-errors.mjs';
for (const [status, body, expected] of [
  [403, {error:{type:'no_providers_available',message:'This model is not available on the free tier'}}, 'free_tier_model'],
  [403, {error:'Your team has restricted access to this model.',type:'no_providers_available'}, 'team_policy'],
  [403, {type:'customer_verification_required'}, 'card_verification'],
  [403, {type:'no_providers_available'}, 'no_providers_available'],
  [403, {error:'Unrecognized denial'}, 'provider_forbidden'],
  [402, {}, 'budget_or_credit'], [401, {}, 'provider_authentication'],
  [404, {}, 'model_unavailable'], [429, {}, 'provider_rate_limit'], [500, {}, 'provider_unavailable']
]) test(`safe classifier: ${status} ${expected}`, async () => {
  const data={...body, request:'PRIVATE_INPUT', token:'VERY_SECRET_KEY'};
  assert.equal(await classifyProviderError(Response.json(data,{status})), expected);
  assert.ok(!providerErrorMessage(expected).includes('PRIVATE_INPUT'));
  assert.ok(!providerErrorMessage(expected).includes('VERY_SECRET_KEY'));
});
test('oversized or non-JSON upstream failures produce only a safe status category',async () => {
  assert.equal(await classifyProviderError(new Response('x'.repeat(20000), {status:403})), 'provider_forbidden');
  assert.equal(await classifyProviderError(new Response('<html>PRIVATE</html>', {status:500})), 'provider_unavailable');
});
