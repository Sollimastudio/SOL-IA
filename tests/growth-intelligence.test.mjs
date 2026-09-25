import { test } from 'node:test';
import assert from 'node:assert/strict';
import { GROWTH_INTELLIGENCE_DIRECTIVE, bestTimeSignal, freshnessStatus, modelPromotionDecision, compareProviderCandidates, buildProviderOpportunityCard } from '../core/growth-intelligence.mjs';

test('fast-changing platform evidence becomes stale', () => {
  const result = freshnessStatus('2026-08-01T00:00:00Z', 'platform_algorithm', '2026-09-14T00:00:00Z');
  assert.equal(result.status, 'stale');
  assert.equal(result.maxDays, 14);
});

test('fresh model/API evidence stays current within its short window', () => {
  const result = freshnessStatus('2026-09-10T00:00:00Z', 'model_or_api', '2026-09-14T00:00:00Z');
  assert.equal(result.status, 'current');
  assert.equal(result.maxDays, 7);
});

test('all-zero best-time matrix never invents a posting hour', () => {
  const rows = [{ dayOfWeek: 1, bestTimesByHour: [{ hourOfDay: 9, value: 0 }, { hourOfDay: 19, value: 0 }] }];
  const result = bestTimeSignal(rows);
  assert.equal(result.status, 'insufficient_account_data');
  assert.deepEqual(result.recommendations, []);
});

test('account-specific best-time evidence is ranked by observed value', () => {
  const rows = [
    { dayOfWeek: 1, bestTimesByHour: [{ hourOfDay: 9, value: 12 }, { hourOfDay: 19, value: 41 }] },
    { dayOfWeek: 2, bestTimesByHour: [{ hourOfDay: 12, value: 30 }] }
  ];
  const result = bestTimeSignal(rows);
  assert.equal(result.status, 'account_signal_available');
  assert.deepEqual(result.recommendations.map(item => item.value), [41, 30, 12]);
});

test('newer model is not promoted merely because it is newer', () => {
  const decision = modelPromotionDecision(
    { quality: 0.82, cost: 1.1, latency: 1.2 },
    { quality: 0.86, cost: 1, latency: 1 },
    { minQualityGain: 0, maxCostMultiplier: 1.25, maxLatencyMultiplier: 1.5 }
  );
  assert.equal(decision.promote, false);
  assert.equal(decision.reason, 'benchmark_not_better_enough');
});

test('better candidate can be promoted after benchmark gates', () => {
  const decision = modelPromotionDecision(
    { quality: 0.91, cost: 1.15, latency: 1.25 },
    { quality: 0.86, cost: 1, latency: 1 },
    { minQualityGain: 0.02, maxCostMultiplier: 1.25, maxLatencyMultiplier: 1.5 }
  );
  assert.equal(decision.promote, true);
  assert.equal(decision.reason, 'benchmark_passed');
});

test('directive rejects universal emotional clock as fact', () => {
  assert.match(GROWTH_INTELLIGENCE_DIRECTIVE, /manha = reflexao, tarde = raiva/);
  assert.match(GROWTH_INTELLIGENCE_DIRECTIVE, /apenas hipotese/);
  assert.match(GROWTH_INTELLIGENCE_DIRECTIVE, /Modelo mais novo nao e automaticamente melhor/);
});


test('cross-provider comparison can prefer a cheaper stronger candidate but still requires supervised promotion', () => {
  const result = compareProviderCandidates([
    {
      id: 'gemini-live',
      provider: 'google',
      quality: 0.84,
      capabilityFit: 0.92,
      privacy: 0.78,
      stability: 0.82,
      evidence: 0.88,
      integrationEffort: 0.15,
      costPerTask: 1,
      latencyMs: 500
    },
    {
      id: 'gpt-live',
      provider: 'openai',
      quality: 0.91,
      capabilityFit: 0.95,
      privacy: 0.82,
      stability: 0.90,
      evidence: 0.90,
      integrationEffort: 0.20,
      costPerTask: 1.10,
      latencyMs: 470
    }
  ], 'gemini-live', { minScoreGain: 0.01, maxCostMultiplier: 1.2 });
  assert.equal(result.supervisedPromotionRequired, true);
  assert.equal(result.bestObservedId, 'gpt-live');
  assert.equal(result.ranked[0].decision, 'candidate_for_supervised_promotion');
});

test('provider comparison refuses to promote when evidence is weak even if a score looks attractive', () => {
  const result = compareProviderCandidates([
    {
      id: 'baseline',
      provider: 'google',
      quality: 0.80,
      capabilityFit: 0.88,
      privacy: 0.80,
      stability: 0.85,
      evidence: 0.90,
      integrationEffort: 0.10,
      costPerTask: 1,
      latencyMs: 600
    },
    {
      id: 'new-lab',
      provider: 'candidate',
      quality: 0.98,
      capabilityFit: 0.98,
      privacy: 0.90,
      stability: 0.90,
      evidence: 0.40,
      integrationEffort: 0.05,
      costPerTask: 0.6,
      latencyMs: 300
    }
  ], 'baseline');
  const candidate = result.ranked.find(item => item.id === 'new-lab');
  assert.equal(candidate.decision, 'insufficient_evidence');
});

test('opportunity card labels evidence and freezes production approval', () => {
  const card = buildProviderOpportunityCard({
    task: 'voice-realtime',
    trigger: 'new official model',
    factStatus: 'official_fact',
    sourceUrls: ['https://example.com/official'],
    comparison: { baseline: 'gemini', candidate: 'openai' },
    recommendation: 'benchmark before any switch',
    doNotAutoChange: ['production provider']
  });
  assert.equal(card.requiresHumanApprovalForProductionChange, true);
  assert.equal(card.factStatus, 'official_fact');
  assert.deepEqual(card.doNotAutoChange, ['production provider']);
});

test('directive explicitly requires multivendor comparison rather than OpenAI-only monitoring', () => {
  assert.match(GROWTH_INTELLIGENCE_DIRECTIVE, /multifornnecedor/);
  assert.match(GROWTH_INTELLIGENCE_DIRECTIVE, /Gemini, Anthropic, Apple\/on-device/);
  assert.match(GROWTH_INTELLIGENCE_DIRECTIVE, /Custo-beneficio deve ser avaliado por tarefa/);
});
