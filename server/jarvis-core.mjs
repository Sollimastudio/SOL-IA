import { trustedExcerpts } from './knowledge-contract.mjs';

export const JARVIS_CORE_VERSION = 'jarvis-core-read-v1';

const json = (status, body) => Response.json(body, {
  status,
  headers: {
    'Cache-Control': 'private, no-store',
    'X-Content-Type-Options': 'nosniff',
    'X-Jarvis-Core-Version': JARVIS_CORE_VERSION,
    'X-Jarvis-Core-Mode': 'read-only'
  }
});

function parseBase(value) {
  const parsed = new URL(value);
  if (parsed.protocol !== 'https:' || parsed.username || parsed.password || parsed.search || parsed.hash) throw new Error('config');
  return parsed.origin;
}

async function readQuery(request) {
  if (!request.headers.get('content-type')?.toLowerCase().startsWith('application/json')) throw new Error('content_type');
  const text = await request.text();
  if (new TextEncoder().encode(text).length > 12000) throw new Error('size');
  const body = JSON.parse(text);
  if (!body || typeof body !== 'object' || Array.isArray(body) || typeof body.query !== 'string') throw new Error('input');
  const query = body.query.trim();
  if (!query || query.length > 1000 || /\u0000/.test(query)) throw new Error('input');
  return query;
}

const cleanText = (value, max) => String(value ?? '').slice(0, max);

function safeContinuity(rows) {
  if (!Array.isArray(rows)) throw new Error('response');
  return rows.slice(0, 20).filter(row => row && typeof row.id === 'string').map(row => ({
    id: row.id,
    relation: cleanText(row.relation, 40),
    scope: cleanText(row.scope, 40),
    topicHint: cleanText(row.topic_hint, 160),
    deltaHint: cleanText(row.delta_hint, 500),
    content: cleanText(row.content, 1600),
    createdAt: row.created_at ?? null,
    matchKind: cleanText(row.match_kind, 40),
    signals: row.signals && typeof row.signals === 'object' && !Array.isArray(row.signals) ? {
      priorEventId: typeof row.signals.priorEventId === 'string' ? row.signals.priorEventId.slice(0, 80) : null,
      rootTopic: typeof row.signals.rootTopic === 'string' ? row.signals.rootTopic.slice(0, 160) : null,
      currentBranch: typeof row.signals.currentBranch === 'string' ? row.signals.currentBranch.slice(0, 160) : null,
      returnNeeded: row.signals.returnNeeded === true,
      profileKind: typeof row.signals.profileKind === 'string' ? row.signals.profileKind.slice(0, 40) : null
    } : null
  }));
}

function safeProfile(rows) {
  if (!Array.isArray(rows)) throw new Error('response');
  return rows.slice(0, 20).filter(row => row && typeof row.id === 'string').map(row => ({
    id: row.id,
    kind: cleanText(row.kind, 40),
    topicHint: cleanText(row.topic_hint, 160),
    content: cleanText(row.content, 1600),
    createdAt: row.created_at ?? null,
    matchKind: cleanText(row.match_kind, 40)
  }));
}

function safeAssistantHistory(rows) {
  if (!Array.isArray(rows)) throw new Error('response');
  return rows.slice(0, 12).filter(row => row && typeof row.id === 'string').map(row => ({
    id: row.id,
    specialist: cleanText(row.specialist, 80),
    answer: cleanText(row.answer, 1800),
    createdAt: row.created_at ?? null,
    matchKind: cleanText(row.match_kind, 40)
  }));
}

function currentThread(continuity) {
  const anchor = continuity.find(row => row.matchKind === 'match') ?? continuity[0] ?? null;
  return {
    rootTopic: anchor?.signals?.rootTopic ?? null,
    currentBranch: anchor?.signals?.currentBranch ?? anchor?.topicHint ?? null,
    returnNeeded: continuity.some(row => row?.signals?.returnNeeded === true)
  };
}

export function createJarvisCoreHandler({ env = {}, fetchImpl = globalThis.fetch } = {}) {
  return async function handle(request) {
    if (request.method !== 'POST') return json(405, { ok: false, error: 'Use POST.' });

    const url = env.SUPABASE_URL || env.VITE_SUPABASE_URL;
    const key = env.SUPABASE_ANON_KEY || env.VITE_SUPABASE_ANON_KEY;
    const allowed = (env.JARVIS_ALLOWED_USER_IDS || '').split(',').map(id => id.trim()).filter(Boolean);
    let base;
    try {
      if (!url || !key || !allowed.length) throw new Error('config');
      base = parseBase(url);
    } catch {
      return json(503, { ok: false, error: 'Jarvis Core ainda não está configurado no servidor.' });
    }

    const authorization = request.headers.get('authorization') || '';
    if (!/^Bearer [^\s]+$/.test(authorization)) return json(401, { ok: false, error: 'Entre na conta autorizada.' });

    let query;
    try {
      query = await readQuery(request);
    } catch (error) {
      const status = error.message === 'content_type' ? 415 : error.message === 'size' ? 413 : 400;
      return json(status, { ok: false, error: status === 415 ? 'Envie JSON.' : 'Consulta inválida ou grande demais.' });
    }

    const headers = { apikey: key, Authorization: authorization, 'Content-Type': 'application/json' };
    const call = (path, options = {}, timeout = 7000) => fetchImpl(`${base}${path}`, {
      ...options,
      headers,
      cache: 'no-store',
      redirect: 'error',
      signal: AbortSignal.any([request.signal, AbortSignal.timeout(timeout)])
    });

    let user;
    try {
      const auth = await call('/auth/v1/user');
      if (!auth.ok) return json(auth.status === 401 ? 401 : 503, {
        ok: false,
        error: auth.status === 401 ? 'Sessão expirada ou inválida.' : 'Não foi possível verificar sua sessão.'
      });
      user = await auth.json();
      if (!user || typeof user.id !== 'string') throw new Error('auth');
    } catch {
      return json(503, { ok: false, error: 'Não foi possível verificar sua sessão.' });
    }
    if (!allowed.includes(user.id)) return json(403, { ok: false, error: 'Conta fora do Jarvis privado autorizado.' });
    if (request.signal.aborted) return json(499, { ok: false, error: 'Consulta encerrada.' });

    const warnings = [];
    const rpc = async (name, body) => {
      const response = await call(`/rest/v1/rpc/${name}`, { method: 'POST', body: JSON.stringify(body) });
      if (!response.ok) throw new Error(name);
      return response.json();
    };
    const partial = async (label, fn, fallback = []) => {
      try { return await fn(); }
      catch {
        warnings.push(`${label} indisponível nesta leitura; nada foi inventado para substituir a fonte ausente.`);
        return fallback;
      }
    };

    const [continuityRows, profileRows, assistantRows, knowledgeRows] = await Promise.all([
      partial('Continuidade', () => rpc('search_solia_continuity', { p_query: query, p_limit: 12 })),
      partial('Perfil DNA', () => rpc('search_solia_profile_claims', { p_query: query, p_limit: 12 })),
      partial('Histórico do Jarvis', () => rpc('search_solia_assistant_history', { p_query: query, p_limit: 8 })),
      env.JARVIS_KNOWLEDGE_ENABLED === 'true'
        ? partial('Biblioteca de conhecimento', () => rpc('search_solia_knowledge', { p_query: query }))
        : Promise.resolve([])
    ]);

    let continuity = [];
    let profile = [];
    let assistantHistory = [];
    let knowledge = [];
    try { continuity = safeContinuity(continuityRows); } catch { warnings.push('Resposta de continuidade inválida foi descartada.'); }
    try { profile = safeProfile(profileRows); } catch { warnings.push('Resposta de Perfil DNA inválida foi descartada.'); }
    try { assistantHistory = safeAssistantHistory(assistantRows); } catch { warnings.push('Resposta de histórico inválida foi descartada.'); }
    try { knowledge = trustedExcerpts(knowledgeRows, user.id); } catch { warnings.push('Resposta da biblioteca inválida foi descartada.'); }

    if (env.JARVIS_KNOWLEDGE_ENABLED !== 'true') warnings.push('Biblioteca de conhecimento está desativada neste ambiente; memória e continuidade continuam disponíveis.');

    console.info('[JARVIS_CORE_SAFE]', JSON.stringify({
      version: JARVIS_CORE_VERSION,
      mode: 'read_only',
      counts: { continuity: continuity.length, profile: profile.length, assistantHistory: assistantHistory.length, knowledge: knowledge.length },
      warningCount: warnings.length
    }));

    return json(200, {
      ok: true,
      version: JARVIS_CORE_VERSION,
      mode: 'read_only',
      query,
      thread: currentThread(continuity),
      context: { continuity, profile, assistantHistory, knowledge },
      counts: { continuity: continuity.length, profile: profile.length, assistantHistory: assistantHistory.length, knowledge: knowledge.length },
      warnings
    });
  };
}
