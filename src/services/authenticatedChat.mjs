export class UnsentMessageError extends Error {}

function parsePrivateRememberedMessage(body) {
  try {
    const data = JSON.parse(body);
    if (!data || typeof data !== 'object' || data.mode !== 'private' || data.remember !== true || typeof data.message !== 'string' || !data.message.trim()) return null;
    return { message: data.message };
  } catch {
    return null;
  }
}

async function maybeCaptureBudgetFallback({ response, endpoint, body, userId, signal, getSession, fetchImpl, currentSession }) {
  if (endpoint !== '/api/jarvis-chat' || response.status !== 403 || !response.headers.get('content-type')?.includes('application/json')) return response;
  let failure;
  try { failure = await response.clone().json(); } catch { return response; }
  if (failure?.ok !== false || failure?.stage !== 'budget' || failure?.errorCode !== 'ai_budget_paused' || failure?.persisted !== false) return response;

  const input = parsePrivateRememberedMessage(body);
  if (!input) return response;
  const captureId = globalThis.crypto?.randomUUID?.();
  if (typeof captureId !== 'string') return response;
  const session = await currentSession(getSession);
  signal.throwIfAborted();
  let captured;
  try {
    captured = await fetchImpl('/api/jarvis-capture', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session.access_token}` },
      body: JSON.stringify({ message: input.message, mode: 'private', remember: true, history: [], captureId }),
      signal
    });
  } catch {
    return response;
  }
  if (!captured.headers.get('content-type')?.includes('application/json')) return response;
  let receipt;
  try { receipt = await captured.json(); } catch { return response; }
  if (!captured.ok || receipt?.ok !== true || receipt?.persisted !== true || receipt?.memoryId !== captureId) return response;

  return Response.json({
    ok: true,
    answer: 'A resposta inteligente está temporariamente indisponível, mas sua fala foi guardada no cofre e no Diário. Continue falando normalmente; o conteúdo não foi perdido.',
    specialist: 'vault_memory',
    mode: 'private',
    persisted: true,
    memoryId: captureId,
    modelUsed: 'none',
    promptVersion: '',
    execution: 'capture_only_budget_fallback',
    continuityPersisted: receipt.continuityPersisted === true,
    continuity: receipt.continuity ?? null,
    warnings: ['Nenhum modelo de IA foi chamado nesta tentativa. A captura privada foi confirmada pelo cofre.']
  }, { status: 200, headers: { 'Cache-Control': 'private, no-store', 'Content-Type': 'application/json' } });
}

// Use the SDK's current session, not a token captured when the component rendered.
// Only the explicit pre-write access contract permits one refresh and POST replay.
export async function sendAuthenticatedChat({ body, userId, signal, getSession, refreshSession, fetchImpl = globalThis.fetch, endpoint = '/api/jarvis-chat', extraHeaders = {} }) {
  if (!['/api/jarvis-chat', '/api/jarvis-capture'].includes(endpoint)) throw new UnsentMessageError('Destino de envio inválido.');
  async function currentSession(read) {
    signal.throwIfAborted();
    let session;
    let onAbort;
    try {
      const cancelled = new Promise((_, reject) => {
        onAbort = () => reject(signal.reason);
        signal.addEventListener('abort', onAbort, { once: true });
      });
      // SDK refresh has its own lifecycle. Do not leave the composer busy if it stalls.
      session = await Promise.race([read(), cancelled]);
    } catch {
      signal.throwIfAborted();
      throw new UnsentMessageError('Não foi possível renovar o acesso agora. Seu texto não foi enviado; não peça outro código por tentativa.');
    } finally {
      signal.removeEventListener('abort', onAbort);
    }
    signal.throwIfAborted();
    if (!session?.access_token || session.user?.id !== userId) {
      throw new UnsentMessageError('A sessão mudou ou não está disponível. Seu texto não foi enviado. Confira a conta antes de continuar.');
    }
    return session;
  }
  const post = session => {
    signal.throwIfAborted();
    return fetchImpl(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${session.access_token}`,
        ...extraHeaders
      },
      body, signal
    });
  };

  let response = await post(await currentSession(getSession));
  if (response.status === 401 && response.headers.get('content-type')?.includes('application/json')) {
    let failure;
    try { failure = await response.clone().json(); } catch { failure = null; }
    if (failure?.ok === false && failure?.stage === 'access' && failure?.errorCode === 'session_invalid' && failure?.persisted === false) {
      await currentSession(refreshSession);
      // Re-read after refresh so a changed account is never sent with the old conversation.
      response = await post(await currentSession(getSession));
    }
  }

  return maybeCaptureBudgetFallback({ response, endpoint, body, userId, signal, getSession, fetchImpl, currentSession });
}
