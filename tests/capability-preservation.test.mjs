import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const read = path => readFileSync(new URL(`../${path}`, import.meta.url), 'utf8');

const requiredFiles = [
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

test('chat stays the product home and knowledge, vault and integrations stay reachable', () => {
  const app = read('src/App.tsx');
  assert.match(app, /area === 'chat' && <JarvisConversation/);
  for (const label of ['CONVERSAR', 'CONHECIMENTO', 'COFRE', 'INTEGRAÇÕES']) assert.ok(app.includes(label));
  assert.doesNotMatch(app, /area === 'chat' && \(meteredAiEnabled\s*\?/);
});

test('personal cloned voice never becomes the assistant dialogue voice by accident', () => {
  const presence = read('docs/CONTINUIDADE_JARVIS.md');
  assert.match(presence, /voz própria de assistente/);
  assert.match(presence, /somente quando ela pedir explicitamente/);
});
