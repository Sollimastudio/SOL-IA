import assert from 'node:assert/strict';
import test from 'node:test';
import { resolvePilotRuntime } from '../server/pilot-runtime.mjs';
import { SOL_PILOT_PROFILE_PACK_ID } from '../core/tenant-context.mjs';

const owner = '11111111-1111-4111-8111-111111111111';
const request = () => new Request('https://preview.invalid/api/jarvis-chat', {
  method: 'POST', headers: { Authorization: 'Bearer synthetic-session' }
});
const noOidc = async () => '';

function fakeFetch({ member = true, canUseAi = false, ownerId = owner } = {}) {
  return async url => {
    const value = String(url);
    if (value.includes('/auth/v1/user')) return Response.json({ id: owner });
    if (value.includes('/rest/v1/solia_pilot_users')) {
      return Response.json(member ? [{ owner_id: ownerId, can_use_ai: canUseAi, model: 'openai/test-model' }] : []);
    }
    throw new Error(`unexpected ${value}`);
  };
}

test('verified pilot membership receives an explicit Sol tenant context without requiring paid AI', async () => {
  const runtime = await resolvePilotRuntime(request(), {}, fakeFetch({ member: true, canUseAi: false }), noOidc);
  assert.equal(runtime.diagnostics.pilotVerified, true);
  assert.equal(runtime.diagnostics.canUseAi, false);
  assert.equal(runtime.diagnostics.tenantContextPresent, true);
  assert.equal(runtime.tenantContext?.userId, owner);
  assert.equal(runtime.tenantContext?.profilePackId, SOL_PILOT_PROFILE_PACK_ID);
  assert.equal(runtime.tenantContext?.tenantId, `personal:${owner}`);
  assert.equal(runtime.tenantContext?.workspaceId, `personal:${owner}:primary`);
  assert.equal(runtime.env.JARVIS_CHAT_ENABLED, 'false');
});

test('non-member never receives a tenant context', async () => {
  const runtime = await resolvePilotRuntime(request(), {}, fakeFetch({ member: false }), noOidc);
  assert.equal(runtime.diagnostics.pilotVerified, false);
  assert.equal(runtime.diagnostics.tenantContextPresent, false);
  assert.equal(runtime.tenantContext, null);
});

test('foreign membership row cannot mint a tenant context for the authenticated user', async () => {
  const runtime = await resolvePilotRuntime(request(), {}, fakeFetch({ member: true, canUseAi: true, ownerId: '22222222-2222-4222-8222-222222222222' }), noOidc);
  assert.equal(runtime.diagnostics.pilotVerified, false);
  assert.equal(runtime.diagnostics.tenantContextPresent, false);
  assert.equal(runtime.tenantContext, null);
});
