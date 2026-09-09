/** CI only: two real PostgreSQL connections compete for the same next revision. */
import { spawn } from 'node:child_process';
import assert from 'node:assert/strict';
if (process.env.PGDATABASE !== 'jarvis_test' || process.env.PGHOST !== '127.0.0.1') throw new Error('Refusing a non-test database');
const prefix = `set role authenticated; set request.jwt.claim.sub='11111111-1111-4111-8111-111111111111';`;
function sql(command) {
  return new Promise((resolve, reject) => {
    const proc = spawn('psql', ['-v', 'ON_ERROR_STOP=1', '-At', '-c', prefix + command], { env: process.env });
    let output = ''; let error = '';
    proc.stdout.on('data', data => { output += data; }); proc.stderr.on('data', data => { error += data; });
    proc.on('error', reject); proc.on('exit', code => resolve({ code, output, error }));
  });
}
assert.equal((await sql(`select public.import_solia_knowledge('geral','concurrent.txt','Concorrência','Versão inicial',0);`)).code, 0);
const results = await Promise.all([
  sql(`select public.import_solia_knowledge('geral','concurrent.txt','Concorrência','Revisão A',1);`),
  sql(`select public.import_solia_knowledge('geral','concurrent.txt','Concorrência','Revisão B',1);`)
]);
assert.equal(results.filter(r => r.code === 0).length, 1, 'Exactly one concurrent revision must succeed');
assert.ok(results.find(r => r.code !== 0).error.includes('Version conflict'));
const counts = await sql(`select count(*),max(version) from public.solia_knowledge_documents where source_key='concurrent.txt';`);
assert.ok(counts.output.trim().endsWith('2|2'), 'Initial version and one revision must survive');
console.log('Two-connection concurrency check passed: one revision accepted, the other rejected, both prior records preserved.');
