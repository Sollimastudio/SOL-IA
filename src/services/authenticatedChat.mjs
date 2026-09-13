export class UnsentMessageError extends Error {}

// Use the SDK's current session, not a token captured when the component rendered.
// Only the explicit pre-write access contract permits one refresh and POST replay.
export async function sendAuthenticatedChat({ body, userId, signal, getSession, refreshSession, fetchImpl = globalThis.fetch }) {
  async function currentSession(read) {
    signal.throwIfAborted();
    let session;
    try { session = await read(); }
    catch { throw new UnsentMessageError('Não foi possível renovar o acesso agora. Seu texto não foi enviado; não peça outro código por tentativa.'); }
    signal.throwIfAborted();
    if (!session?.access_token || session.user?.id !== userId) {
      throw new UnsentMessageError('A sessão mudou ou não está disponível. Seu texto não foi enviado. Confira a conta antes de continuar.');
    }
    return session;
  }
  const post = session => {
    signal.throwIfAborted();
    return fetchImpl('/api/jarvis-chat', {
      method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session.access_token}` },
      body, signal
    });
  };
  const response = await post(await currentSession(getSession));
  if (response.status !== 401 || !response.headers.get('content-type')?.includes('application/json')) return response;
  let failure;
  try { failure = await response.clone().json(); } catch { return response; }
  if (failure?.ok !== false || failure?.stage !== 'access' || failure?.errorCode !== 'session_invalid' || failure?.persisted !== false) return response;
  await currentSession(refreshSession);
  // Re-read after refresh so a changed account is never sent with the old conversation.
  return post(await currentSession(getSession));
}
