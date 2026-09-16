import assert from 'node:assert/strict';
import test from 'node:test';
import {
  CORE_PROFILE_PACK_ID,
  SOL_PILOT_PROFILE_PACK_ID,
  assertResourceScope,
  classifyDataScope,
  createSolPilotTenantContext,
  createTenantContext,
  sameTenant,
  sameWorkspace,
  tenantExecutionEnvelope
} from '../core/tenant-context.mjs';
import {
  PROFILE_PACKS,
  assertGlobalProfileNeutral,
  getProfilePack,
  resolveProfilePack
} from '../core/profile-packs.mjs';

const context = createTenantContext({
  tenantId: 'agency:alpha',
  workspaceId: 'client:acme',
  userId: 'user-1',
  role: 'manager',
  profilePackId: 'agency-default',
  skillPackIds: ['agency-ops'],
  goals: ['grow-revenue']
});

test('generic tenant context defaults to neutral core profile, never Sol', () => {
  const generic = createTenantContext({ tenantId: 'company:one', workspaceId: 'hq', userId: 'user-2' });
  assert.equal(generic.profilePackId, CORE_PROFILE_PACK_ID);
  assert.notEqual(generic.profilePackId, SOL_PILOT_PROFILE_PACK_ID);
  assert.equal(resolveProfilePack().id, CORE_PROFILE_PACK_ID);
  assert.equal(assertGlobalProfileNeutral(), true);
});

test('Sol pilot profile is explicit and backward-compatible rather than global', () => {
  const pilot = createSolPilotTenantContext('11111111-1111-4111-8111-111111111111');
  assert.equal(pilot.profilePackId, SOL_PILOT_PROFILE_PACK_ID);
  assert.match(pilot.tenantId, /^personal:/);
  assert.equal(PROFILE_PACKS[CORE_PROFILE_PACK_ID].scope, 'global');
  assert.equal(PROFILE_PACKS[SOL_PILOT_PROFILE_PACK_ID].scope, 'tenant');
});

test('cross-tenant access fails closed', () => {
  assert.equal(assertResourceScope(context, { tenantId: 'agency:alpha', workspaceId: 'client:acme' }), true);
  assert.throws(
    () => assertResourceScope(context, { tenantId: 'agency:other', workspaceId: 'client:acme' }),
    /cross_tenant_access_denied/
  );
  assert.equal(sameTenant(context, { tenantId: 'agency:other' }), false);
});

test('cross-workspace access fails closed unless explicitly tenant-wide', () => {
  assert.throws(
    () => assertResourceScope(context, { tenantId: 'agency:alpha', workspaceId: 'client:other' }),
    /cross_workspace_access_denied/
  );
  assert.equal(sameWorkspace(context, { tenantId: 'agency:alpha', workspaceId: 'client:other' }), false);
  assert.equal(
    assertResourceScope(context, { tenantId: 'agency:alpha', workspaceId: 'client:other' }, { allowTenantWide: true }),
    true
  );
});

test('personal memory cannot be silently promoted to company or agency scope', () => {
  assert.equal(classifyDataScope({ kind: 'personal_memory', requestedScope: 'tenant' }), 'user-private');
  assert.equal(classifyDataScope({ kind: 'private_memory', requestedScope: 'workspace' }), 'user-private');
  assert.equal(classifyDataScope({ kind: 'campaign_metric', requestedScope: 'workspace' }), 'workspace');
});

test('execution envelope always carries tenant and workspace identity', () => {
  const envelope = tenantExecutionEnvelope(context, { task: 'analyze-campaign' });
  assert.equal(envelope.tenant.id, 'agency:alpha');
  assert.equal(envelope.tenant.workspaceId, 'client:acme');
  assert.equal(envelope.tenant.profilePackId, 'agency-default');
  assert.deepEqual(envelope.payload, { task: 'analyze-campaign' });
});

test('unknown client profile never becomes an implicit personalized profile', () => {
  assert.equal(getProfilePack('made-up-client'), null);
  assert.equal(resolveProfilePack('made-up-client').id, CORE_PROFILE_PACK_ID);
});
