export const TENANT_CONTEXT_VERSION: string;
export const CORE_PROFILE_PACK_ID: 'core-default';
export const SOL_PILOT_PROFILE_PACK_ID: 'sol-pilot';

export type TenantRole = 'owner' | 'admin' | 'manager' | 'member' | 'viewer' | 'service';

export type TenantContext = Readonly<{
  version: string;
  tenantId: string;
  workspaceId: string;
  userId: string;
  role: TenantRole;
  profilePackId: string;
  skillPackIds: readonly string[];
  goals: readonly string[];
}>;

export function createTenantContext(input: {
  tenantId: string;
  workspaceId: string;
  userId: string;
  role?: TenantRole;
  profilePackId?: string;
  skillPackIds?: string[];
  goals?: string[];
}): TenantContext;

export function createSolPilotTenantContext(userId: string): TenantContext;
export function sameTenant(left: Partial<TenantContext>, right: Partial<TenantContext>): boolean;
export function sameWorkspace(left: Partial<TenantContext>, right: Partial<TenantContext>): boolean;
export function assertResourceScope(context: TenantContext, resource: { tenantId: string; workspaceId?: string }, options?: { allowTenantWide?: boolean }): true;
export function classifyDataScope(input?: { kind?: string; requestedScope?: string }): 'user-private' | 'workspace' | 'tenant';
export function tenantExecutionEnvelope(context: TenantContext, payload?: unknown): Readonly<{ tenant: Readonly<Record<string, unknown>>; payload: unknown }>;
