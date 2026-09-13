// Synthetic transport used ONLY by login.vite.config.mjs; never by production.
let attempts = 0;
let verifications = 0;
const fixtureSession = { access_token: 'synthetic-session', token_type: 'bearer', refresh_token: 'synthetic-refresh',
  user: { id: '11111111-1111-4111-8111-111111111111', email: 'teste@example.invalid' } };
const sessionForCase = () => new URLSearchParams(location.search).get('case') === 'chat' ? fixtureSession : null;
export async function getCurrentSession() { return sessionForCase(); }
export async function refreshCurrentSession() {
  fixtureSession.access_token = 'synthetic-refreshed-session';
  return sessionForCase();
}
export function subscribeToAuth(listener: (session: any) => void) {
  let live = true;
  queueMicrotask(() => { if (live) listener(sessionForCase()); });
  return () => { live = false; };
}
export async function requestEmailCode(_email: string) {
  attempts += 1;
  (window as unknown as { __authAttempts: number }).__authAttempts = attempts;
  await new Promise(resolve => setTimeout(resolve, 100));
  if (new URLSearchParams(location.search).get('case') === 'failure' && attempts === 1) {
    throw new Error('Synthetic network failure');
  }
  return { ok: true, message: 'Código enviado. Digite aqui o código numérico recebido no e-mail.' };
}
export const sendMagicLink = requestEmailCode;
export async function verifyEmailCode(_email: string, code: string) {
  verifications += 1;
  (window as unknown as { __authVerifications: number }).__authVerifications = verifications;
  await new Promise(resolve => setTimeout(resolve, 50));
  if (code !== '12345678') return { ok: false, message: 'Código inválido ou expirado. Solicite um novo código.' };
  return { ok: true, message: 'Acesso confirmado. Entrando no Jarvis…' };
}
export async function signOut() { return { ok: true, message: 'Sessão encerrada.' }; }
