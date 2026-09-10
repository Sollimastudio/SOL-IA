import { test } from 'node:test';
import assert from 'node:assert/strict';
import { auditEnvironment, runAudit } from '../scripts/env-audit.mjs';
const a = 'https://rkkpbmzrucaghrojujvb.supabase.co';
const b = 'https://gsrltjndmyiwkmudnpyl.supabase.co';
const token = role => 'test.' + Buffer.from(JSON.stringify({ role, ref: 'private-ref' })).toString('base64url') + '.TEST_SIGNATURE';
test('missing configuration is represented without fabricated activation', () => {
  const r = auditEnvironment({});
  assert.equal(r.frontend.project, 'missing'); assert.equal(r.frontend.accessCodeConditionsSatisfied, false);
  assert.equal(r.server.sameProjectAsFrontend, null); assert.equal(r.server.chatEnabled, false);
  assert.equal(r.server.providerEnvCredentialPresent, false);
  assert.equal(r.server.runtimeOidcHelperChecked, false);
});
test('known projects are classified without returning URLs', () => {
  const r = auditEnvironment({ VITE_SUPABASE_URL: a, VITE_SUPABASE_ANON_KEY: 'sb_publishable_TEST', SUPABASE_URL: b });
  assert.equal(r.frontend.project, 'ACESSORA-SOL.IA'); assert.equal(r.server.project, 'cerebro Sol');
  assert.equal(r.server.sameProjectAsFrontend, false); assert.ok(!JSON.stringify(r).includes('supabase.co'));
});
test('server fallback matches deployed handler behavior', () => {
  const r = auditEnvironment({ VITE_SUPABASE_URL: a, VITE_SUPABASE_ANON_KEY: token('anon') });
  assert.equal(r.server.sameProjectAsFrontend, true); assert.equal(r.server.sameKeyAsFrontend, true);
  assert.equal(r.frontend.keyShape, 'legacy_anon_unverified');
});
test('strict feature flags do not coerce other strings', () => {
  for (const flag of ['TRUE', '1', 'true\n', 'yes', '']) {
    const r = auditEnvironment({ VITE_SECURE_MEMORY_ENABLED: flag, JARVIS_CHAT_ENABLED: flag });
    assert.equal(r.frontend.secureMemoryEnabled, false); assert.equal(r.server.chatEnabled, false);
  }
  assert.equal(auditEnvironment({ JARVIS_CHAT_ENABLED: 'true' }).server.chatEnabled, true);
});
test('unsafe frontend key forms are classified without values', () => {
  for (const secret of [token('service_role'), 'sb_secret_SUPER_PRIVATE']) {
    const r = auditEnvironment({ VITE_SUPABASE_ANON_KEY: secret });
    assert.equal(r.frontend.keyShape, 'server_secret'); assert.ok(!JSON.stringify(r).includes(secret));
  }
});
test('all arbitrary input values, key names, IDs and malformed URLs remain redacted', () => {
  const secret = 'DO_NOT_LOG_SECRET_123';
  const r = auditEnvironment({
    VITE_SUPABASE_URL: 'https://user:' + secret + '@rkkpbmzrucaghrojujvb.supabase.co',
    VITE_SUPABASE_ANON_KEY: secret, SUPABASE_URL: secret, SUPABASE_ANON_KEY: secret,
    OPENROUTER_API_KEY: secret, OPENAI_API_KEY: secret, AI_GATEWAY_API_KEY: secret,
    VERCEL_OIDC_TOKEN: secret, JARVIS_MODEL: secret, JARVIS_ALLOWED_USER_IDS: secret, [secret]: secret
  });
  assert.equal(r.frontend.project, 'unrecognized_url'); assert.ok(!JSON.stringify(r).includes(secret));
  assert.equal(r.server.openRouterKeyPresent, true);
  assert.equal(r.server.gatewayKeyPresent, true);
  assert.equal(r.server.gatewayEnvOidcPresent, true);
  assert.equal(r.server.providerEnvCredentialPresent, true);
});
test('AI Gateway env presence is distinguished from runtime OIDC helper availability', () => {
  const r = auditEnvironment({ AI_GATEWAY_API_KEY: 'gateway-test' });
  assert.equal(r.server.gatewayKeyPresent, true);
  assert.equal(r.server.gatewayEnvOidcPresent, false);
  assert.equal(r.server.providerEnvCredentialPresent, true);
  assert.equal(r.server.runtimeOidcHelperChecked, false);
  assert.match(r.disclaimer, /runtime OIDC/i);
});
test('build frontend and runtime backend configurations are distinguished', () => {
  const r = auditEnvironment({}, { VITE_SUPABASE_URL: a, VITE_SUPABASE_ANON_KEY: 'sb_publishable_TEST', VITE_SECURE_MEMORY_ENABLED: 'true' });
  assert.equal(r.frontend.accessCodeConditionsSatisfied, true); assert.equal(r.server.project, 'missing');
});
test('an empty comma-only pilot allowlist is not an authorized pilot', () => {
  assert.equal(auditEnvironment({ JARVIS_ALLOWED_USER_IDS: ',  , ' }).server.pilotAllowlistPresent, false);
});
test('production and local builds never run this preview audit', async () => {
  const logs = [];
  await runAudit({ VERCEL_ENV: 'production' }, x => logs.push(x));
  await runAudit({}, x => logs.push(x)); assert.deepEqual(logs, []);
});
