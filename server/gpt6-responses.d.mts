export const GPT6_RESPONSES_ENDPOINT: 'https://ai-gateway.vercel.sh/v1/responses';

export type Gpt6ProbeResult = {
  ok: boolean;
  executed: boolean;
  reason?: string;
  status?: number;
  model: string;
  text?: string;
  latencyMs?: number;
  usage?: {
    inputTokens: number | null;
    outputTokens: number | null;
    totalTokens: number | null;
    gatewayCostUsd: number | null;
  };
  gatewayRequestId?: string | null;
};

export function extractResponsesText(payload: unknown): string;
export function normalizeResponsesUsage(payload: unknown): {
  inputTokens: number | null;
  outputTokens: number | null;
  totalTokens: number | null;
  gatewayCostUsd: number | null;
};
export function runGpt6ResponsesProbe(options?: {
  env?: Record<string, string | undefined>;
  gatewayCredential?: string;
  mode?: 'default' | 'complex';
  input?: string;
  instructions?: string;
  reasoningEffort?: 'none' | 'low' | 'medium' | 'high' | 'xhigh' | 'max';
  maxOutputTokens?: number;
  fetchImpl?: typeof fetch;
  signal?: AbortSignal;
}): Promise<Gpt6ProbeResult>;
