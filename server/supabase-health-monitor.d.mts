export const SUPABASE_HEALTH_MONITOR_VERSION: string;

export type SupabaseHealthSummary = {
  status: 'finding' | 'unable_to_assess' | 'clear';
  findings: string[];
  unavailable: boolean;
};

export function summarizeSupabaseHealthAdvisors(payload: unknown): SupabaseHealthSummary;

export function createSupabaseHealthMonitorHandler(options?: {
  env?: NodeJS.ProcessEnv;
  fetchImpl?: typeof globalThis.fetch;
}): (request: Request) => Promise<Response>;
