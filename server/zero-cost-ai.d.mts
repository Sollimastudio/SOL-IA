export const ZERO_COST_MODEL: string;
export function modelIsZeroCost(model: unknown): boolean;
export function verifyZeroCostGatewayModel(fetchImpl?: typeof fetch): Promise<{ ok: boolean; reason: string; model: string | null }>;
export function applyZeroCostRuntime<T extends {
  useGateway?: boolean;
  gatewayCredential?: string;
  env?: Record<string, unknown>;
  diagnostics?: Record<string, unknown>;
}>(runtime: T, verification: { ok?: boolean; model?: string | null }): T;
