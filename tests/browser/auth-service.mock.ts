// Synthetic transport used ONLY by login.vite.config.mjs; never by production.
let attempts = 0;
export async function getCurrentSession() { return null; }
export function subscribeToAuth(listener: (session: null) => void) {
  let live = true;
  queueMicrotask(() => { if (live) listener(null); });
  return () => { live = false; };
}
export async function sendMagicLink(_email: string) {
  attempts += 1;
  (window as unknown as { __authAttempts: number }).__authAttempts = attempts;
  await new Promise(resolve => setTimeout(resolve, 100));
  if (new URLSearchParams(location.search).get('case') === 'failure' && attempts === 1) {
    throw new Error('Synthetic network failure');
  }
  return { ok: true, message: 'Pedido de acesso enviado. Confira seu e-mail.' };
}
export async function signOut() { return { ok: true, message: 'Sessão encerrada.' }; }
