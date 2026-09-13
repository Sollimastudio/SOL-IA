import { parseSource, trustedExcerpts } from './knowledge-contract.mjs';
const json = (status, body) => Response.json(body, { status,
  headers: { 'Cache-Control': 'private, no-store', 'X-Content-Type-Options': 'nosniff' } });

async function readLimited(request) {
  const reader = request.body?.getReader();
  if (!reader) throw new Error('input');
  let size = 0; const chunks = [];
  try {
    while (true) {
      const { done, value } = await reader.read(); if (done) break;
      size += value.byteLength;
      if (size > 1000000) { await reader.cancel(); throw new Error('size'); }
      chunks.push(value);
    }
  } finally { reader.releaseLock(); }
  const bytes = new Uint8Array(size); let offset = 0;
  for (const chunk of chunks) { bytes.set(chunk, offset); offset += chunk.length; }
  return JSON.parse(new TextDecoder('utf-8', { fatal: true }).decode(bytes));
}

export function createKnowledgeHandler({ env = {}, fetchImpl = globalThis.fetch } = {}) {
  return async request => {
    if (!['GET', 'POST'].includes(request.method)) return json(405, { ok: false, error: 'Use GET ou POST.' });
    if (env.JARVIS_KNOWLEDGE_ENABLED !== 'true') return json(503, { ok: false, error: 'Biblioteca em ativação controlada. Nenhum texto foi importado.' });
    const url = env.SUPABASE_URL || env.VITE_SUPABASE_URL;
    const key = env.SUPABASE_ANON_KEY || env.VITE_SUPABASE_ANON_KEY;
    const allowed = (env.JARVIS_ALLOWED_USER_IDS || '').split(',').map(id => id.trim()).filter(Boolean);
    let base;
    try {
      const parsed = new URL(url);
      if (parsed.protocol !== 'https:' || parsed.username || parsed.password || parsed.search || parsed.hash || !key || !allowed.length) throw new Error();
      base = parsed.origin;
    } catch { return json(503, { ok: false, error: 'Biblioteca ainda não configurada no servidor.' }); }
    const authorization = request.headers.get('authorization') || '';
    if (!/^Bearer [^\s]+$/.test(authorization)) return json(401, { ok: false, error: 'Entre na conta autorizada.' });
    let source;
    let searchQuery = null;
    try {
      if (request.method === 'GET') {
        const params = new URL(request.url).searchParams;
        if (params.get('mode') !== 'private') throw new Error('private');
        if (params.has('q')) {
          searchQuery = params.get('q')?.trim() ?? '';
          if (!searchQuery || searchQuery.length > 500 || /\u0000/.test(searchQuery)) throw new Error('search');
        }
      } else {
        if (!request.headers.get('content-type')?.toLowerCase().startsWith('application/json')) return json(415, { ok: false, error: 'Envie JSON.' });
        source = parseSource(await readLimited(request));
      }
    } catch (error) { return json(error.message === 'private' ? 403 : error.message === 'size' ? 413 : 400, { ok: false, error: error.message === 'search' ? 'Busca inválida ou grande demais.' : 'Fonte inválida, grande demais ou fora de uma sessão privada.' }); }
    const headers = { apikey: key, Authorization: authorization, 'Content-Type': 'application/json' };
    const call = (path, options = {}) => fetchImpl(`${base}${path}`, { ...options, headers, cache: 'no-store', redirect: 'error',
      signal: AbortSignal.any([request.signal, AbortSignal.timeout(10000)]) });
    let user;
    try {
      const auth = await call('/auth/v1/user');
      if (!auth.ok) return json(401, { ok: false, error: 'Sessão expirada ou inválida.' });
      user = await auth.json();
      if (!user || !allowed.includes(user.id)) return json(403, { ok: false, error: 'Conta fora do piloto autorizado.' });
    } catch { return json(503, { ok: false, error: 'Não foi possível verificar sua conta.' }); }
    if (request.signal.aborted) return json(499, { ok: false, error: 'Solicitação cancelada; confirme o estado na biblioteca.' });
    try {
      if (request.method === 'GET' && searchQuery !== null) {
        const response = await call('/rest/v1/rpc/search_solia_knowledge', { method: 'POST', body: JSON.stringify({ p_query: searchQuery }) });
        if (!response.ok) return json(503, { ok: false, error: 'A busca da biblioteca está indisponível.' });
        const rows = await response.json();
        const matches = trustedExcerpts(rows, user.id);
        return json(200, { ok: true, query: searchQuery, matches });
      }
      if (request.method === 'GET') {
        // All revisions remain visible; this bounded query is complete under the DB's 200-revision quota.
        const query = new URLSearchParams({ owner_id: `eq.${user.id}`, order: 'created_at.desc', limit: '201',
          select: 'id,owner_id,project_key,source_key,title,version,checksum,created_at,status' });
        const response = await call(`/rest/v1/solia_knowledge_documents?${query}`);
        if (!response.ok) throw new Error();
        const rows = await response.json(); if (!Array.isArray(rows)) throw new Error();
        const sources = rows.filter(row => row && row.owner_id === user.id).map(({ owner_id, ...row }) => row);
        return json(200, { ok: true, sources });
      }
      const response = await call('/rest/v1/rpc/import_solia_knowledge', { method: 'POST', body: JSON.stringify(source) });
      const result = await response.json();
      if (!response.ok) {
        const status = result?.code === '40001' ? 409 : result?.code === '54000' ? 429 : result?.code === '22023' ? 400 : 503;
        return json(status, { ok: false, error: status === 409 ? 'A fonte mudou. Atualize a lista antes de enviar outra versão.' : status === 429 ? 'Limite de armazenamento do piloto atingido.' : 'Importação recusada. Nenhuma confirmação de gravação foi recebida.' });
      }
      if (!result || typeof result.id !== 'string' || !Number.isInteger(result.version) || !Number.isInteger(result.latestVersion) || typeof result.duplicate !== 'boolean') throw new Error();
      return json(result.duplicate ? 200 : 201, { ok: true, source: { id: result.id, version: result.version,
        latestVersion: result.latestVersion, duplicate: result.duplicate, status: 'imported_unverified' } });
    } catch { return json(503, { ok: false, error: 'Conexão interrompida. Atualize a lista para verificar se a fonte foi salva; repetir a mesma fonte não cria cópia duplicada.' }); }
  };
}
