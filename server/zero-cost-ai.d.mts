export const ZERO_COST_MODEL: string;
export function modelIsZeroCost(model: unknown): boolean;
export function verifyZeroCostGatewayModel(fetchImpl?: typeof fetch): Promise<{ ok: boolean; reason: string; model: string | null }>;

type RuntimeLike = {
  useGateway: boolean;
  gatewayCredential: string;
  env: Record<string, unknown>;
  diagnostics: Record<string, unknown>;
};

export function applyZeroCostRuntime<T extends RuntimeLike>(
  runtime: T,
  verification: { ok?: boolean; model?: string | null }
): T & {
  env: T['env'] & {
    JARVIS_ZERO_COST_VERIFIED?: string;
    JARVIS_MODEL?: string;
    JARVIS_CHAT_ENABLED?: string;
  };
  diagnostics: T['diagnostics'] & {
    zeroCostModelVerified?: boolean;
    zeroCostModel?: string | null;
  };
};
