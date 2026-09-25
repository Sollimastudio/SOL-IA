export const GROWTH_INTELLIGENCE_VERSION: string;
export const GROWTH_INTELLIGENCE_DIRECTIVE: string;
export const FRESHNESS_WINDOWS_DAYS: Readonly<Record<string, number>>;
export function freshnessStatus(observedAt: string | Date, kind: string, now?: string | Date): { kind: string; ageDays: number; maxDays: number; status: 'current' | 'stale' };
export function bestTimeSignal(rows?: Array<{ dayOfWeek?: number; bestTimesByHour?: Array<{ hourOfDay?: number; value?: number }> }>): { status: 'insufficient_account_data' | 'account_signal_available'; recommendations: Array<{ dayOfWeek?: number; hourOfDay?: number; value: number }> };
export function modelPromotionDecision(candidate: { quality: number; cost: number; latency: number }, baseline: { quality: number; cost: number; latency: number }, thresholds?: { minQualityGain?: number; maxCostMultiplier?: number; maxLatencyMultiplier?: number }): { promote: boolean; qualityGain: number; costMultiplier: number; latencyMultiplier: number; reason: string };

export const DEFAULT_PROVIDER_WEIGHTS: Readonly<Record<'quality' | 'capabilityFit' | 'privacy' | 'stability' | 'evidence' | 'cost' | 'latency' | 'integrationEffort', number>>;
export type ProviderCandidate = {
  id: string;
  provider: string;
  quality: number;
  capabilityFit: number;
  privacy: number;
  stability: number;
  evidence: number;
  integrationEffort: number;
  costPerTask: number;
  latencyMs: number;
  status?: string;
};
export function providerCandidateScore(candidate: ProviderCandidate, baseline: ProviderCandidate, weights?: Partial<typeof DEFAULT_PROVIDER_WEIGHTS>): { id: string; provider: string; score: number; costScore: number; latencyScore: number; evidence: number; status: string };
export function compareProviderCandidates(candidates: ProviderCandidate[], baselineId: string, options?: { minEvidence?: number; minScoreGain?: number; maxCostMultiplier?: number; weights?: Partial<typeof DEFAULT_PROVIDER_WEIGHTS> }): { baselineId: string; bestObservedId: string; supervisedPromotionRequired: true; ranked: Array<{ id: string; provider: string; score: number; costScore: number; latencyScore: number; evidence: number; status: string; scoreGain: number; costMultiplier: number; decision: string }> };
export function buildProviderOpportunityCard(input: { task: string; trigger: string; factStatus: 'official_fact' | 'observed_data' | 'controlled_test' | 'hypothesis'; sourceUrls?: string[]; comparison: unknown; recommendation: string; doNotAutoChange?: string[] }): { schema: 'jarvis-provider-opportunity-v1'; task: string; trigger: string; factStatus: string; sourceUrls: string[]; comparison: unknown; recommendation: string; doNotAutoChange: string[]; requiresHumanApprovalForProductionChange: true };
