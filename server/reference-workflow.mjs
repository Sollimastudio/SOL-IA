import { randomUUID } from 'node:crypto';
import { ReferenceError, nextStep, validatePlan, validateEpisode, editorialBundle } from '../core/reference-series.mjs';
import { acquireReference } from './reference-acquisition.mjs';

// One durable unit per request. Completed episodes are never generated again on resume.
export async function advanceReference({ store, row, acquire = acquireReference, generate, catalog = [], signal }) {
  const step = nextStep(row.state);
  if (!step) return row;
  const attempts = row.state.attempts[step] || 0;
  if (attempts >= 3) throw new ReferenceError('attempt_limit', 'Esta etapa atingiu três tentativas. Revise a causa antes de criar uma nova versão.', 409);
  const token = randomUUID();
  const claimed = await store.claim(row.id, row.revision, token);
  let state = structuredClone(claimed.state);
  state.attempts[step] = attempts + 1;
  state.lastError = null;
  try {
    if (step === 'acquire') {
      state.reference = await acquire(state.brief.source, { signal });
      state.status = ['ready', 'partial'].includes(state.reference.status) ? 'planning' : 'blocked';
      if (state.status === 'blocked') state.lastError = { code: state.reference.code, message: state.reference.reason, step };
    } else {
      if (!generate) throw new ReferenceError('provider_unavailable', 'A geração ainda depende da conexão de IA autorizada.', 503);
      const result = await generate({ state, step, operationId: `${row.id}:${step}:${attempts + 1}`, signal });
      if (step === 'plan') { state.plan = validatePlan(result.value, state, catalog); state.status = 'drafting'; }
      else {
        const number = state.episodes.length + 1;
        state.episodes.push(validateEpisode(result.value, state, row.id, number));
        state.status = state.episodes.length === state.brief.count ? 'review' : 'drafting';
      }
      state.usage = [...(state.usage || []), { step, attempt: attempts + 1, model: result.model || null, inputTokens: result.usage?.prompt_tokens ?? null, outputTokens: result.usage?.completion_tokens ?? null, cost: null }];
    }
    state.nextStep = nextStep(state);
  } catch (error) {
    // A transport failure after dispatch is ambiguous. Never silently retry a billed operation.
    state.status = error.code === 'provider_outcome_unknown' ? 'uncertain' : 'blocked';
    state.lastError = { code: error.code || 'stage_failed', message: error instanceof ReferenceError ? error.message : 'A etapa foi interrompida; os resultados anteriores foram preservados.', step };
    state.nextStep = step;
  }
  // Do not turn a failed checkpoint into an automatic replay; the lease remains visible for recovery.
  return store.finish(row.id, claimed.revision, token, state);
}

export function reviseEpisode(row, body) {
  const state = structuredClone(row.state);
  if (state.delivery) throw new ReferenceError('delivered_version', 'Crie uma revisão editorial antes de substituir uma série já entregue.', 409);
  const old = state.episodes.find(e => e.id === body.episodeId);
  if (!old || body.episodeVersion !== old.version) throw new ReferenceError('revision_conflict', 'O episódio mudou. Atualize a série.', 409);
  const next = validateEpisode(body.episode, state, row.id, old.number, old);
  state.revisions.push({ episode: old, revisedAt: new Date().toISOString() });
  state.episodes = state.episodes.map(e => e.id === old.id ? next : e);
  state.approved = null; state.status = state.episodes.length === state.brief.count ? 'review' : 'drafting';
  return state;
}
export function approveSeries(row, body) {
  const state = structuredClone(row.state);
  if (state.delivery) throw new ReferenceError('delivered_version', 'Abra uma nova revisão antes de alterar a aprovação já entregue.', 409);
  if (state.episodes.length !== state.brief.count || !state.plan || body.reviewed !== true) throw new ReferenceError('review_required', 'Revise todos os episódios antes de aprovar.', 409);
  if (!['free', 'entitled'].includes(body.access)) throw new ReferenceError('access_required', 'Defina os direitos desta série; o canal não foi classificado automaticamente.');
  if (body.access === 'entitled' && !/^[a-z0-9_-]{1,100}$/.test(body.entitlementId || '')) throw new ReferenceError('entitlement_required', 'Informe o produto que concede acesso.');
  state.episodes = state.episodes.map(e => {
    const entitlementId = body.access === 'entitled' ? body.entitlementId : null;
    const accessChanged = e.access !== 'unclassified' && (e.access !== body.access || e.entitlementId !== entitlementId);
    if (accessChanged) state.revisions.push({ episode: structuredClone(e), revisedAt: new Date().toISOString() });
    return { ...e, version: e.version + (accessChanged ? 1 : 0), status: 'approved', access: body.access, entitlementId };
  });
  state.bundleVersion = (state.bundleVersion || 0) + 1;
  state.approved = { at: new Date().toISOString(), version: state.bundleVersion, revision: row.revision };
  state.status = 'approved'; state.nextStep = 'deliver'; return state;
}
export async function deliverSeries({ row, store, deliver }) {
  const bundle = editorialBundle(row.id, row.state);
  if (row.state.delivery) return row;
  if (!deliver) throw new ReferenceError('lucida_bridge_unavailable', 'O pacote está pronto; a conexão com a LÚCIDA ainda não está configurada.', 503);
  const token = randomUUID(); const claimed = await store.claim(row.id, row.revision, token);
  const state = structuredClone(claimed.state);
  try {
    const receipt = await deliver(bundle);
    if (receipt?.seriesId !== row.id || receipt?.revision !== bundle.revision || typeof receipt?.digest !== 'string' || receipt?.episodeCount !== bundle.episodes.length)
      throw new ReferenceError('invalid_receipt', 'A LÚCIDA não confirmou a versão enviada.', 502);
    state.delivery = receipt; state.status = 'delivered'; state.nextStep = null; state.lastError = null;
  } catch (error) { state.lastError = { code: error.code || 'bridge_unconfirmed', message: 'Recebimento não confirmado. O reenvio usa a mesma versão e não publica no Telegram.', step: 'deliver' }; }
  return store.finish(row.id, claimed.revision, token, state);
}
