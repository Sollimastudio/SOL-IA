import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const [api, migration, memory, envExample] = await Promise.all([
  readFile(resolve(root, 'api/meta-ads-insights.ts'), 'utf8'),
  readFile(resolve(root, 'supabase/migrations/202607240100_secure_personal_data.sql'), 'utf8'),
  readFile(resolve(root, 'src/services/memoryRepository.ts'), 'utf8'),
  readFile(resolve(root, '.env.example'), 'utf8')
]);

const checks = [
  ['Meta endpoint exposes GET', /export async function GET/.test(api)],
  ['Meta endpoint exposes no mutation handler', !/export async function (POST|PUT|PATCH|DELETE)/.test(api)],
  ['Meta token is never a VITE variable', !/VITE_META_ACCESS_TOKEN/.test(api + envExample)],
  ['Meta token stays in Authorization header', /Authorization: `Bearer \$\{env\.META_ACCESS_TOKEN/.test(api)],
  ['Meta account is restricted by user allowlist', /META_ALLOWED_USER_IDS/.test(api) && /allowedUserIds\.includes\(verifiedUser\.id\)/.test(api)],
  ['RLS is enabled for memories', /alter table public\.memories enable row level security/i.test(migration)],
  ['RLS checks authenticated owner', /auth\.uid\(\) is not null and auth\.uid\(\) = owner_id/i.test(migration)],
  ['Anonymous memory policy is absent', !/to anon/i.test(migration)],
  ['Memory writes require verified user', /requireVerifiedUser/.test(memory)],
  ['Memory client does not use service role', !/service_role/i.test(memory)]
];

const failures = checks.filter(([, passed]) => !passed);
for (const [name, passed] of checks) {
  console.log(`${passed ? 'PASS' : 'FAIL'} ${name}`);
}

if (failures.length > 0) {
  process.exitCode = 1;
}
