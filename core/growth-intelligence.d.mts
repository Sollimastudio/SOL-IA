export const GROWTH_INTELLIGENCE_VERSION: string;
export const GROWTH_INTELLIGENCE_DIRECTIVE: string;
export const FRESHNESS_WINDOWS_DAYS: Readonly<Record<string, number>>;
export function freshnessStatus(observedAt: string | Date, kind: string, now?: string | Date): { kind: string; ageDays: number; maxDays: number; status: 'current' | 'stale' };
export function bestTimeSignal(rows?: Array<{ dayOfWeek?: number; bestTimesByHour?: Array<{ hourOfDay?: number; value?: number }> }>): { status: 'insufficient_account_data' | 'account_signal_available'; recommendations: Array<{ dayOfWeek?: number; hourOfDay?: number; value: number }> };
export function modelPromotionDecision(candidate: { quality: number; cost: number; latency: number }, baseline: { quality: number; cost: number; latency: number }, thresholds?: { minQualityGain?: number; maxCostMultiplier?: number; maxLatencyMultiplier?: number }): { promote: boolean; qualityGain: number; costMultiplier: number; latencyMultiplier: number; reason: string };
