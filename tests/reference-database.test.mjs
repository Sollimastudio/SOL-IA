import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile, mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { PGlite } from '@electric-sql/pglite';
import { createSeriesState, parseBrief } from '../core/reference-series.mjs';
import { advanceReference } from '../server/reference-workflow.mjs';
import { brief, plan, episode } from './fixtures/reference-series.mjs';

const A = '11111111-1111-4111-8111-111111111111', B = '22222222-2222-4222-8222-222222222222', ID = '11111111-1111-4111-8111-111111111110';
test('real PostgreSQL engine: RLS, claims, revisions, idempotency and restart at episode 4', async () => {
  const dir = await mkdtemp(join(tmpdir(), 'jarvis-reference-db-')); let db = new PGlite(dir);
  const migration = await readFile(new URL('../supabase/migrations/20260921182729_reference_series_jobs.sql', import.meta.url), 'utf8');
  try {
    await db.exec(await readFile(new URL('./sql/knowledge-setup.sql', import.meta.url), 'utf8'));
    await db.exec(migration); await db.exec(migration);
    const actor = (user, fn) => db.transaction(async tx => { await tx.exec('set local role authenticated'); await tx.query("select set_config('request.jwt.claim.sub',$1,true)", [user]); return fn(tx); });
    const rpc = (user, name, args) => actor(user, async tx => (await tx.query(`select * from public.${name}(${args.map((_, i) => '$' + (i + 1)).join(',')})`, args)).rows[0]);
    const hash = 'a'.repeat(64), state = createSeriesState(parseBrief(brief));
    const first = await rpc(A, 'create_solia_reference_job', [ID, hash, state]);
    const duplicate = await rpc(A, 'create_solia_reference_job', [ID, hash, state]); assert.equal(first.id, duplicate.id);
    await assert.rejects(rpc(A, 'create_solia_reference_job', [ID, 'b'.repeat(64), state]));
    assert.equal((await actor(B, tx => tx.query('select * from public.solia_reference_jobs'))).rows.length, 0);
    await assert.rejects(rpc(B, 'claim_solia_reference_job', [ID, 0, B]));
    await assert.rejects(actor(A, tx => tx.query('update public.solia_reference_jobs set owner_id=$1 where id=$2', [B, ID])));
    await assert.rejects(db.transaction(async tx => { await tx.exec('set local role anon'); return tx.query('select * from public.solia_reference_jobs'); }));
    const claimed = await rpc(A, 'claim_solia_reference_job', [ID, 0, A]);
    await assert.rejects(rpc(A, 'claim_solia_reference_job', [ID, 0, B]));
    await assert.rejects(rpc(A, 'save_solia_reference_job', [ID, claimed.revision, B, state]));
    await rpc(A, 'save_solia_reference_job', [ID, claimed.revision, A, state]);
    const store = { get: () => actor(A, async tx => (await tx.query('select * from public.solia_reference_jobs where id=$1', [ID])).rows[0]),
      claim: (id, rev, token) => rpc(A, 'claim_solia_reference_job', [id, rev, token]), finish: (id, rev, token, next) => rpc(A, 'save_solia_reference_job', [id, rev, token, next]) };
    const calls = []; const generate = async ({ step }) => { calls.push(step); return { value: step === 'plan' ? plan() : episode(Number(step.split(':')[1])) }; };
    let row = await store.get(); for (let i = 0; i < 5; i++) row = await advanceReference({ store, row, generate });
    const preserved = JSON.stringify(row.state.episodes); assert.equal(row.state.episodes.length, 3);
    await db.close(); db = new PGlite(dir); // Actual storage/process boundary, not an in-memory clone.
    row = await store.get(); assert.equal(JSON.stringify(row.state.episodes), preserved);
    for (let i = 0; i < 6; i++) row = await advanceReference({ store, row, generate });
    assert.equal(row.state.episodes.length, 9); assert.equal(calls.filter(x => x === 'episode:1').length, 1);
    assert.equal((await actor(B, tx => tx.query('select * from public.solia_reference_jobs'))).rows.length, 0);
    await assert.rejects(rpc(A, 'save_solia_reference_job', [ID, 0, null, state]));
    const defs = (await db.query("select prosecdef from pg_proc where proname in ('create_solia_reference_job','claim_solia_reference_job','save_solia_reference_job','recover_solia_reference_job')")).rows;
    assert.ok(defs.every(x => x.prosecdef === false));
  } finally { await db.close(); await rm(dir, { recursive: true, force: true }); }
});
