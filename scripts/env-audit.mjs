/** Preview-only, allowlisted configuration audit. No network calls or mutations.
 * Never print environment values, URLs, key fragments, emails or user IDs.
 * Frontend values follow Vite's production build; server values are process.env.
 */
import { pathToFileURL } from 'node:url';

const presenceKeys = [
  'VITE_SUPABASE_URL', 'VITE_SUPABASE_ANON_KEY', 'VITE_SECURE_MEMORY_ENABLED',
  'SUPABASE_URL', 'SUPABASE_ANON_KEY', 'JARVIS_CHAT_ENABLED',
  'JARVIS_KNOWLEDGE_ENABLED', 'JARVIS_ALLOWED_USER_IDS',
  'JARVIS_MODEL', 'OPENROUTER_API_KEY', 'OPENAI_API_KEY'
];
const projects = {
  gsrltjndmyiwkmudnpyl: 'cerebro Sol',
  rkkpbmzrucaghrojujvb: 'ACESSORA-SOL.IA'
};
const present = value => typeof value === 'string' && value.trim().length > 0;
function projectRef(value) {
  if (!present(value)) return null;
  try {
    const url = new URL(value);
    if (url.protocol !== 'https:' || url.username || url.password || url.search || url.hash || !['', '/'].includes(url.pathname)) return null;
    return /^([a-z0-9]{20})\.supabase\.co$/.exec(url.hostname)?.[1] ?? null;
  } catch { return null; }
}
function label(value) {
  const ref = projectRef(value);
  return ref ? (projects[ref] ?? 'other_project') : (present(value) ? 'unrecognized_url' : 'missing');
}
function keyShape(value) {
  if (!present(value)) return 'missing';
  if (value.startsWith('sb_publishable_')) return 'publishable';
  if (value.startsWith('sb_secret_')) return 'server_secret';
  try {
    if (value.length > 8192 || value.split('.').length !== 3) return 'unrecognized';
    const payload = JSON.parse(Buffer.from(value.split('.')[1], 'base64url').toString('utf8'));
    if (payload.role === 'anon') return 'legacy_anon_unverified';
    if (payload.role === 'service_role') return 'server_secret';
  } catch { /* Intentionally do not log the exception or its input. */ }
  return 'unrecognized';
}

export function auditEnvironment(server = {}, frontend = server) {
  const frontUrl = frontend.VITE_SUPABASE_URL;
  const serverUrl = server.SUPABASE_URL || server.VITE_SUPABASE_URL;
  const serverKey = server.SUPABASE_ANON_KEY || server.VITE_SUPABASE_ANON_KEY;
  const frontRef = projectRef(frontUrl), backRef = projectRef(serverUrl);
  const variables = Object.fromEntries(presenceKeys.map(name => [name, {
    present: present(name.startsWith('VITE_') ? frontend[name] : server[name])
  }]));
  // An explicit whitelist prevents arbitrary variable names/values reaching logs.
  return {
    schema: 'jarvis-env-audit-v1', scope: 'preview_build_snapshot',
    variables,
    frontend: {
      project: label(frontUrl),
      keyShape: keyShape(frontend.VITE_SUPABASE_ANON_KEY),
      secureMemoryEnabled: frontend.VITE_SECURE_MEMORY_ENABLED === 'true',
      accessCodeConditionsSatisfied: Boolean(frontUrl && frontend.VITE_SUPABASE_ANON_KEY && frontend.VITE_SECURE_MEMORY_ENABLED === 'true')
    },
    server: {
      project: label(serverUrl),
      keyShape: keyShape(serverKey),
      chatEnabled: server.JARVIS_CHAT_ENABLED === 'true',
      knowledgeEnabled: server.JARVIS_KNOWLEDGE_ENABLED === 'true',
      pilotAllowlistPresent: typeof server.JARVIS_ALLOWED_USER_IDS === 'string' && server.JARVIS_ALLOWED_USER_IDS.split(',').some(present),
      modelConfigured: present(server.JARVIS_MODEL),
      providerKeyPresent: present(server.OPENROUTER_API_KEY),
      sameProjectAsFrontend: frontRef && backRef ? frontRef === backRef : null,
      sameKeyAsFrontend: present(serverKey) && present(frontend.VITE_SUPABASE_ANON_KEY) ? serverKey === frontend.VITE_SUPABASE_ANON_KEY : null
    },
    disclaimer: 'Presence and key shape are not authentication, RLS, model availability or end-to-end validation.'
  };
}

export async function runAudit(server = process.env, log = console.log) {
  if (server.VERCEL_ENV !== 'preview') return;
  try {
    const { loadEnv } = await import('vite');
    // Current package build uses Vite production mode and default root/envDir.
    const frontend = { ...loadEnv('production', process.cwd(), 'VITE_'), ...server };
    log('[JARVIS_ENV_AUDIT] ' + JSON.stringify(auditEnvironment(server, frontend)));
  } catch {
    // Diagnostic failure must not expose values, prevent a build, or alter runtime.
    log('[JARVIS_ENV_AUDIT] {"status":"unavailable","secretsPrinted":false}');
  }
}
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) await runAudit();
