import { createHash } from 'node:crypto';
import { ReferenceError, parseBrief, createSeriesState, nextStep, editorialBundle, string } from '../core/reference-series.mjs';
import { acquireReference } from './reference-acquisition.mjs';
import { createReferenceStore } from './reference-store.mjs';
import { advanceReference, approveSeries, reviseEpisode, deliverSeries } from './reference-workflow.mjs';
import { mediaAdapterFromEnv, lucidaDeliveryFromEnv, createReferenceGenerator, readAudienceReport } from './reference-provider.mjs';
import { resolvePilotRuntime } from './pilot-runtime.mjs';

const json = (status, body) => Response.json(body, { status, headers: { 'Cache-Control': 'private, no-store', 'X-Content-Type-Options': 'nosniff' } });
const uuid = value => { if (typeof value !== 'string' || !/^[a-f0-9]{8}-[a-f0-9]{4}-[1-8][a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/i.test(value)) throw new ReferenceError('invalid_id', 'Identificador inválido.'); return value; };
export async function readReferenceBody(request, max = 120000) {
  if (!request.headers.get('content-type')?.startsWith('application/json')) throw new ReferenceError('json_required', 'Envie JSON.', 415);
  const reader = request.body?.getReader(); if (!reader) throw new ReferenceError('body_required', 'Pedido vazio.');
  const chunks = []; let size = 0;
  try { while (true) { const { value, done } = await reader.read(); if (done) break; size += value.length; if (size > max) { await reader.cancel(); throw new ReferenceError('body_limit', 'O pedido excede o tamanho permitido.', 413); } chunks.push(Buffer.from(value)); } }
  finally { reader.releaseLock(); }
  try { return JSON.parse(Buffer.concat(chunks).toString('utf8')); } catch { throw new ReferenceError('invalid_json', 'Pedido inválido.'); }
}
const publicRow = row => { const { owner_id, input_hash, lease_id, ...rest } = row; return { ...rest, busy: Boolean(lease_id) }; };
export function createReferencesHandler({ env = {}, fetchImpl = fetch, resolveRuntime = resolvePilotRuntime, storeFactory = createReferenceStore,
  acquire, generatorFactory = createReferenceGenerator, deliver } = {}) {
  return async request => {
    try {
      if (!['GET', 'POST'].includes(request.method)) return json(405, { ok: false, error: 'Use GET ou POST.' });
      if (env.JARVIS_REFERENCES_ENABLED !== 'true') throw new ReferenceError('references_disabled', 'O fluxo de referências ainda está em ativação neste ambiente.', 503);
      const runtime = await resolveRuntime(request, env, fetchImpl, undefined, { resolveProvider: false });
      if (!runtime.diagnostics.pilotVerified) throw new ReferenceError('access_required', 'Entre na conta autorizada para acessar suas séries.', 403);
      const ownerId = runtime.tenantContext?.userId || runtime.tenantContext?.user_id || runtime.env.JARVIS_ALLOWED_USER_IDS;
      if (!/^[a-f0-9-]{36}$/i.test(ownerId || '')) throw new ReferenceError('scope_unavailable', 'Não foi possível confirmar o escopo privado.', 403);
      const base = new URL(runtime.env.SUPABASE_URL).origin;
      const store = storeFactory({ base, key: runtime.env.SUPABASE_ANON_KEY, authorization: request.headers.get('authorization'), ownerId, fetchImpl });
      if (request.method === 'GET') {
        const url = new URL(request.url);
        if (url.searchParams.get('mode') !== 'private') throw new ReferenceError('private_required', 'Séries editoriais ficam no modo privado.', 403);
        if (url.searchParams.has('id')) return json(200, { ok: true, job: publicRow(await store.get(uuid(url.searchParams.get('id')))) });
        return json(200, { ok: true, jobs: (await store.list()).map(row => ({ id: row.id, revision: row.revision, title: row.state.brief.title, status: row.state.status, count: row.state.brief.count, generated: row.state.episodes.length, updatedAt: row.updated_at, busy: Boolean(row.lease_id) })) });
      }
      const body = await readReferenceBody(request);
      if (!body || body.mode !== 'private') throw new ReferenceError('private_required', 'Séries editoriais ficam no modo privado.', 403);
      if (body.action === 'insights') return json(200, { ok: true, report: await readAudienceReport(env, fetchImpl) });
      const id = uuid(body.id);
      if (body.action === 'create') {
        const brief = parseBrief(body.brief);
        const hash = createHash('sha256').update(JSON.stringify(brief)).digest('hex');
        const created = await store.create(id, hash, createSeriesState(brief));
        // A pasted link immediately attempts acquisition; no generation/provider is needed yet.
        const row = nextStep(created.state) === 'acquire' && !created.lease_id ? await advanceReference({ store, row: created, acquire: acquire || ((source, options) => acquireReference(source, { ...options, mediaAdapter: mediaAdapterFromEnv(env, fetchImpl) })), signal: request.signal }) : created;
        return json(201, { ok: true, job: publicRow(row) });
      }
      const row = await store.get(id);
      if (!Number.isInteger(body.revision) || row.revision !== body.revision) throw new ReferenceError('revision_conflict', 'A série mudou. Atualize antes de continuar.', 409);
      if (body.action === 'recover') return json(200, { ok: true, job: publicRow(await store.recover(id, row.revision)) });
      if (row.lease_id) throw new ReferenceError('job_busy', 'Esta série está processando uma etapa. Atualize para acompanhar.', 409);
      if (body.action === 'export') return json(200, { ok: true, bundle: editorialBundle(id, row.state) });
      if (body.action === 'delete') { await store.delete(id, row.revision); return json(200, { ok: true, deleted: id, note: 'A exclusão local não retira versões já recebidas pela LÚCIDA.' }); }
      let updated;
      if (body.action === 'advance') {
        const step = nextStep(row.state);
        const generate = step && step !== 'acquire' ? await generatorFactory(request, env, fetchImpl) : undefined;
        updated = await advanceReference({ store, row, generate, acquire: acquire || ((source, options) => acquireReference(source, { ...options, mediaAdapter: mediaAdapterFromEnv(env, fetchImpl) })), signal: request.signal });
      } else if (body.action === 'new_revision') {
        const state = structuredClone(row.state);
        if (!state.delivery) throw new ReferenceError('delivery_required', 'Esta ação abre a revisão de uma série já recebida pela Lúcida.', 409);
        if (state.delivery) state.revisions.push({ delivery: state.delivery, approved: state.approved, revisedAt: new Date().toISOString() });
        state.delivery = null; state.approved = null; state.status = 'review';
        updated = await store.save(id, row.revision, state);
      } else if (body.action === 'approve') updated = await store.save(id, row.revision, approveSeries(row, body));
      else if (body.action === 'edit_episode') updated = await store.save(id, row.revision, reviseEpisode(row, body));
      else if (body.action === 'deliver') updated = await deliverSeries({ store, row, deliver: deliver || lucidaDeliveryFromEnv(env, fetchImpl) });
      else if (body.action === 'retry') {
        if (!['blocked', 'uncertain'].includes(row.state.status) || body.confirmRetry !== true) throw new ReferenceError('retry_review_required', 'Confirme a retomada da etapa interrompida. Uma chamada não confirmada pode ter consumido a franquia anterior.', 409);
        const state = structuredClone(row.state); state.status = 'received'; state.lastError = null;
        if (state.reference?.status === 'blocked') state.reference = null;
        state.nextStep = nextStep(state); updated = await store.save(id, row.revision, state);
      } else if (body.action === 'recording') {
        if (row.state.delivery) throw new ReferenceError('delivered_version', 'A gravação exige uma nova revisão do pacote já entregue.', 409);
        const state = structuredClone(row.state), episode = state.episodes.find(e => e.id === body.episodeId);
        if (!episode || body.episodeVersion !== episode.version || body.reviewed !== true) throw new ReferenceError('recording_review_required', 'Confira a versão e a transcrição final antes de anexar a gravação.', 409);
        state.revisions.push({ episode: structuredClone(episode), revisedAt: new Date().toISOString() });
        episode.finalTranscript = string(body.transcript, 'a transcrição revisada', 12000, 40);
        episode.version++; episode.status = 'draft'; state.approved = null; state.status = 'review';
        updated = await store.save(id, row.revision, state);
      } else if (body.action === 'cancel') { const state = structuredClone(row.state); state.status = 'cancelled'; state.nextStep = null; updated = await store.save(id, row.revision, state); }
      else throw new ReferenceError('invalid_action', 'Operação desconhecida.');
      return json(200, { ok: true, job: publicRow(updated) });
    } catch (error) {
      return json(error instanceof ReferenceError ? error.status : 503, { ok: false, errorCode: error.code || 'reference_unavailable', error: error instanceof ReferenceError ? error.message : 'A operação não foi confirmada. Atualize a série; o trabalho salvo permanece disponível.' });
    }
  };
}
