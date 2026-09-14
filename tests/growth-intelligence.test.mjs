import { test } from 'node:test';
import assert from 'node:assert/strict';
import { GROWTH_INTELLIGENCE_DIRECTIVE, bestTimeSignal, freshnessStatus, modelPromotionDecision } from '../core/growth-intelligence.mjs';

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
