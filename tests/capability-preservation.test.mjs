import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const read = path => readFileSync(new URL(`../${path}`, import.meta.url), 'utf8');

const requiredFiles = [
  'core/jarvis-invariants.mjs',
  'core/presence-profile.mjs',
  'core/audience-intelligence.mjs',
  'core/growth-intelligence.mjs',
  'core/prompt-autopilot.mjs',
  'server/anti-fatigue.mjs',
  'server/continuity-runtime.mjs',
  'server/continuity-cues.mjs',
  'server/pilot-runtime.mjs',
  'server/zero-cost-ai.mjs',
  'src/components/JarvisConversation.tsx',
  'src/components/KnowledgeLibrary.tsx',
  'src/components/MemoryVault.tsx',
  'src/components/IntegrationHub.tsx',
  'src/App.tsx'
];

test('core Jarvis capabilities cannot disappear silently', () => {
  for (const path of requiredFiles) {
    assert.ok(read(path).length > 20, `${path} must remain present and non-empty`);
  }
});

test('active chat remains wired to presence, audience, growth, anti-fatigue and durable continuity', () => {
  const chat = read('api/jarvis-chat.ts');
  for (const marker of [
    'SOL_PRESENCE_PROFILE',
    'AUDIENCE_INTELLIGENCE_DIRECTIVE',
    'GROWTH_INTELLIGENCE_DIRECTIVE',
    'analyzeConversation',
    'loadContinuityPacket',
    'loadProfilePacket',
    'loadAssistantHistoryPacket',
    'persistContinuityFromResponse',
    'verifyZeroCostGatewayModel'
  ]) assert.match(chat, new RegExp(marker), `${marker} must stay wired into active chat`);
});

test('non-negotiable continuity invariants remain centralized and injected', () => {
  const invariants = read('core/jarvis-invariants.mjs');
  const continuity = read('server/continuity-runtime.mjs');
  for (const marker of [
    'DELTA_FIRST',
    'REPETITION_IS_SIGNAL_NOT_REPROACH',
    'PRESERVE_ROOT_AND_BRANCHES',
    'STATE_IS_NOT_IDENTITY',
    'EXPLORATION_IS_NOT_OPINION',
    'OPINION_IS_NOT_FACT',
    'IMPORTED_SOURCE_IS_NOT_USER_FACT',
    'ASSISTANT_SUGGESTION_IS_NOT_USER_DECISION',
    'EXPLICIT_CORRECTION_PRESERVES_HISTORY_AND_SUPERSEDES_LINKED_PRIOR',
    'NEW_CAPABILITY_MUST_NOT_REMOVE_EXISTING_CORE_CAPABILITY'
  ]) assert.ok(invariants.includes(marker), `${marker} must remain a core invariant`);
  assert.match(continuity,/JARVIS_INVARIANTS_DIRECTIVE/);
  assert.match(continuity,/priorEventId/);
  assert.match(continuity,/rootTopic/);
  assert.match(continuity,/currentBranch/);
});

test('deployed health endpoint exposes the compiled continuity intelligence versions', () => {
  const health = read('api/jarvis-runtime-health.ts');
  for (const marker of [
    'JARVIS_INVARIANTS_VERSION',
    'ANTI_FATIGUE_VERSION',
    'GROWTH_INTELLIGENCE_VERSION',
    'durableContinuity',
    'profileDna',
    'assistantHistorySeparation'
  ]) assert.match(health,new RegExp(marker),`${marker} must remain visible in runtime health`);
});

test('profile corrections keep an explicit supersession chain instead of deleting history', () => {
  const migration = read('supabase/migrations/202609150815_profile_supersession_chain.sql');
  assert.match(migration,/supersedes_id/);
  assert.match(migration,/superseded_by_id/);
  assert.match(migration,/p_signals->>'priorEventId'/);
  assert.match(migration,/status='superseded'/);
  assert.match(migration,/pc\.status='active'/);
});

test('chat stays the product home and knowledge, vault and integrations stay reachable', () => {
  const app = read('src/App.tsx');
  assert.match(app, /area === 'chat' && <JarvisConversation/);
  for (const label of ['CONVERSAR', 'CONHECIMENTO', 'COFRE', 'INTEGRAÇÕES']) assert.ok(app.includes(label));
  assert.doesNotMatch(app, /area === 'chat' && \(meteredAiEnabled\s*\?/);
});

test('personal cloned voice never becomes the assistant dialogue voice by accident', () => {
  const continuity = read('docs/CONTINUIDADE_JARVIS.md');
  assert.match(continuity, /própria voz de assistente/);
  assert.match(continuity, /somente quando ela pedir explicitamente/);
});
