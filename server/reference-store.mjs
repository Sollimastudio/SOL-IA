import { ReferenceError } from '../core/reference-series.mjs';

export function createReferenceStore({ base, key, authorization, ownerId, fetchImpl = fetch }) {
  const headers = { apikey: key, Authorization: authorization, 'Content-Type': 'application/json' };
  async function call(path, init = {}) {
    const r = await fetchImpl(`${base}/rest/v1/${path}`, { ...init, headers: { ...headers, ...init.headers }, cache: 'no-store', redirect: 'error', signal: AbortSignal.timeout(8000) });
    let data; try { data = await r.json(); } catch { throw new ReferenceError('checkpoint_unconfirmed', 'A gravação não foi confirmada. Atualize a série antes de repetir.', 503); }
    if (!r.ok) throw new ReferenceError(data?.code === '40001' ? 'revision_conflict' : 'storage_unavailable', data?.code === '40001' ? 'Outra operação alterou esta série. Atualize o estado.' : 'O armazenamento de séries está indisponível neste ambiente.', data?.code === '40001' ? 409 : 503);
    return data;
  }
  const params = more => new URLSearchParams({ owner_id: `eq.${ownerId}`, ...more });
  function own(row) { if (!row || row.owner_id !== ownerId) throw new ReferenceError('not_found', 'Série não encontrada nesta conta.', 404); return row; }
  return {
    async list() { const rows = await call(`solia_reference_jobs?${params({ select: 'id,revision,state,lease_id,lease_until,created_at,updated_at,owner_id', order: 'updated_at.desc', limit: '30' })}`); if (!Array.isArray(rows)) throw new Error('invalid_rows'); return rows.map(own); },
    async get(id) { const rows = await call(`solia_reference_jobs?${params({ id: `eq.${id}`, limit: '1' })}`); return own(rows?.[0]); },
    async create(id, inputHash, state) {
      const row = await call('rpc/create_solia_reference_job', { method: 'POST', body: JSON.stringify({ p_id: id, p_input_hash: inputHash, p_state: state }) }); return own(row);
    },
    async claim(id, revision, token) { return own(await call('rpc/claim_solia_reference_job', { method: 'POST', body: JSON.stringify({ p_id: id, p_revision: revision, p_token: token }) })); },
    async finish(id, revision, token, state) { return own(await call('rpc/save_solia_reference_job', { method: 'POST', body: JSON.stringify({ p_id: id, p_revision: revision, p_token: token, p_state: state }) })); },
    async save(id, revision, state) { return this.finish(id, revision, null, state); },
    async recover(id, revision) { return own(await call('rpc/recover_solia_reference_job', { method: 'POST', body: JSON.stringify({ p_id: id, p_revision: revision }) })); },
    async delete(id, revision) {
      const rows = await call(`solia_reference_jobs?${params({ id: `eq.${id}`, revision: `eq.${revision}`, lease_id: 'is.null' })}`, { method: 'DELETE', headers: { Prefer: 'return=representation' } });
      if (!rows?.length) throw new ReferenceError('revision_conflict', 'Atualize ou aguarde a operação antes de excluir.', 409); return true;
    }
  };
}
