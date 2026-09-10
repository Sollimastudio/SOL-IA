import type { Session } from '@supabase/supabase-js';
import { isSecureMemoryEnabled, supabase } from './supabaseClient';

export type AuthResult = {
  ok: boolean;
  message: string;
};

function authUnavailableMessage(): string {
  if (!isSecureMemoryEnabled) {
    return 'O cofre seguro ainda nao foi ativado.';
  }
  return 'Supabase Auth ainda nao esta configurado.';
}

function normalizeEmail(email: string): string | null {
  const cleanEmail = email.trim().toLowerCase();
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail) ? cleanEmail : null;
}

export async function getCurrentSession(): Promise<Session | null> {
  if (!isSecureMemoryEnabled || !supabase) return null;
  const { data, error } = await supabase.auth.getSession();
  if (error) throw new Error(error.message);
  return data.session;
}

export function subscribeToAuth(
  listener: (session: Session | null) => void
): () => void {
  if (!isSecureMemoryEnabled || !supabase) return () => undefined;

  const { data } = supabase.auth.onAuthStateChange((_event, session) => {
    listener(session);
  });

  return () => data.subscription.unsubscribe();
}

export async function requestEmailCode(email: string): Promise<AuthResult> {
  if (!isSecureMemoryEnabled || !supabase) {
    return { ok: false, message: authUnavailableMessage() };
  }

  const cleanEmail = normalizeEmail(email);
  if (!cleanEmail) return { ok: false, message: 'Digite um email valido.' };

  const { error } = await supabase.auth.signInWithOtp({
    email: cleanEmail,
    options: {
      shouldCreateUser: false
    }
  });

  if (error) {
    return { ok: false, message: 'Nao foi possivel enviar o codigo: ' + error.message };
  }

  return {
    ok: true,
    message: 'Codigo enviado. Digite aqui o codigo numerico recebido no email.'
  };
}

export async function verifyEmailCode(email: string, code: string): Promise<AuthResult> {
  if (!isSecureMemoryEnabled || !supabase) {
    return { ok: false, message: authUnavailableMessage() };
  }

  const cleanEmail = normalizeEmail(email);
  const cleanCode = code.replace(/\D/g, '');
  if (!cleanEmail) return { ok: false, message: 'Digite um email valido.' };
  if (!/^\d{6,10}$/.test(cleanCode)) {
    return { ok: false, message: 'Digite o codigo numerico completo recebido no email.' };
  }

  const { data, error } = await supabase.auth.verifyOtp({
    email: cleanEmail,
    token: cleanCode,
    type: 'email'
  });

  if (error || !data.session) {
    return { ok: false, message: 'Codigo invalido ou expirado. Solicite um novo codigo.' };
  }

  return { ok: true, message: 'Acesso confirmado. Entrando no Jarvis…' };
}

// Backward-compatible export for older tests/integrations. New UI uses requestEmailCode.
export const sendMagicLink = requestEmailCode;

export async function signOut(): Promise<AuthResult> {
  if (!supabase) return { ok: false, message: authUnavailableMessage() };
  const { error } = await supabase.auth.signOut();
  return error
    ? { ok: false, message: 'Nao foi possivel sair: ' + error.message }
    : { ok: true, message: 'Sessao encerrada com seguranca.' };
}
