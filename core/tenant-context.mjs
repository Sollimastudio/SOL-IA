export const TENANT_CONTEXT_VERSION = '2026-09-16.1';
export const CORE_PROFILE_PACK_ID = 'core-default';
export const SOL_PILOT_PROFILE_PACK_ID = 'sol-pilot';

const SAFE_ID = /^[a-z0-9][a-z0-9._:@-]{1,159}$/i;
const ALLOWED_ROLES = new Set(['owner', 'admin', 'manager', 'member', 'viewer', 'service']);

function cleanId(value, label) {
  const id = String(value ?? '').trim();
  if (!SAFE_ID.test(id)) throw new Error(`invalid_${label}`);
  return id;
}

function cleanList(value, max = 32) {
  if (value === undefined) return [];
  if (!Array.isArray(value) || value.length > max) throw new Error('invalid_list');
  return [...new Set(value.map(item => String(item ?? '').trim()).filter(Boolean))];
}

/**
 * Creates the explicit execution boundary used by future multi-tenant code.
 * Nothing here changes persistence yet; it is a contract that prevents new code
 * from assuming that user_id alone is a sufficient commercial isolation model.
 */
export function createTenantContext({
  tenantId,
  workspaceId,
  userId,
  role = 'member',
  profilePackId = CORE_PROFILE_PACK_ID,
  skillPackIds = [],
  goals = []
} = {}) {
  const normalizedRole = String(role ?? '').trim().toLowerCase();
  if (!ALLOWED_ROLES.has(normalizedRole)) throw new Error('invalid_role');

  return Object.freeze({
    version: TENANT_CONTEXT_VERSION,
    tenantId: cleanId(tenantId, 'tenant_id'),
    workspaceId: cleanId(workspaceId, 'workspace_id'),
    userId: cleanId(userId, 'user_id'),
    role: normalizedRole,
    profilePackId: cleanId(profilePackId, 'profile_pack_id'),
    skillPackIds: Object.freeze(cleanList(skillPackIds)),
    goals: Object.freeze(cleanList(goals, 64))
  });
}

/**
 * Backward-compatible adapter for the current one-user pilot.
 * The Sol profile is explicit here; it is never the global default.
 */
export function createSolPilotTenantContext(userId) {
  const id = cleanId(userId, 'user_id');
  return createTenantContext({
    tenantId: `personal:${id}`,
    workspaceId: `personal:${id}:primary`,
    userId: id,
    role: 'owner',
    profilePackId: SOL_PILOT_PROFILE_PACK_ID,
    skillPackIds: ['personal-executive', 'creator-business']
  });
}

export function sameTenant(left, right) {
  return Boolean(left?.tenantId && right?.tenantId && left.tenantId === right.tenantId);
}

export function sameWorkspace(left, right) {
  return sameTenant(left, right) && Boolean(left?.workspaceId && right?.workspaceId && left.workspaceId === right.workspaceId);
}

/**
 * Fail-closed authorization helper for objects that already carry tenant/workspace scope.
 * Future repositories/services should call this before returning or mutating data.
 */
export function assertResourceScope(context, resource, { allowTenantWide = false } = {}) {
  if (!context || !resource) throw new Error('scope_missing');
  if (resource.tenantId !== context.tenantId) throw new Error('cross_tenant_access_denied');
  if (!allowTenantWide && resource.workspaceId !== context.workspaceId) throw new Error('cross_workspace_access_denied');
  return true;
}

/**
 * Shared data may exist at tenant scope, but personal/private memory must never be
 * promoted to tenant scope merely because a user belongs to the organization.
 */
export function classifyDataScope({ kind, requestedScope = 'workspace' } = {}) {
  const normalizedKind = String(kind ?? '').trim().toLowerCase();
  const normalizedScope = String(requestedScope ?? '').trim().toLowerCase();
  if (['personal_memory', 'private_memory', 'personal_profile'].includes(normalizedKind)) return 'user-private';
  if (!['user-private', 'workspace', 'tenant'].includes(normalizedScope)) throw new Error('invalid_data_scope');
  return normalizedScope;
}

export function tenantExecutionEnvelope(context, payload = {}) {
  if (!context?.tenantId || !context?.workspaceId || !context?.userId) throw new Error('tenant_context_required');
  return Object.freeze({
    tenant: Object.freeze({
      id: context.tenantId,
      workspaceId: context.workspaceId,
      actorUserId: context.userId,
      role: context.role,
      profilePackId: context.profilePackId,
      skillPackIds: context.skillPackIds
    }),
    payload
  });
}
