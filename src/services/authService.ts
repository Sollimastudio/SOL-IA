import type { Session } from '@supabase/supabase-js';
import { isSecureMemoryEnabled, supabase } from './supabaseClient';

export type AuthResult = {
  ok: boolean;
  message: string;
};

const JARVIS_PREVIEW_ORIGIN =
  'https://sol-ia-i5wy-git-work-jarvis-neural-co-13a334-sol-limas-projects.vercel.app';

function authUnavailableMessage(): string {
  if (!isSecureMemoryEnabled) {
    return 'O cofre seguro ainda nao foi ativado.';
  }
  return 'Supabase Auth ainda nao esta configurado.';
}

function getAuthRedirectOrigin(): string {
  if (typeof window === 'undefined') return JARVIS_PREVIEW_ORIGIN;

  const hostname = window.location.hostname.toLowerCase();
  const isJarvisVercelPreview =
    hostname.endsWith('.vercel.app') &&
    hostname.startsWith('sol-ia-i5wy-') &&
    !hostname.includes('-git-main-') &&
    hostname !== 'sol-ia-i5wy.vercel.app' &&
    hostname !== 'sol-ia-i5wy-sol-limas-projects.vercel.app';

  return isJarvisVercelPreview ? JARVIS_PREVIEW_ORIGIN : window.location.origin;
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

export async function sendMagicLink(email: string): Promise<AuthResult> {
  if (!isSecureMemoryEnabled || !supabase) {
    return { ok: false, message: authUnavailableMessage() };
  }

  const cleanEmail = email.trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
    return { ok: false, message: 'Digite um email valido.' };
  }

  const { error } = await supabase.auth.signInWithOtp({
    email: cleanEmail,
    options: {
      emailRedirectTo: getAuthRedirectOrigin(),
      shouldCreateUser: false
    }
  });

  if (error) {
    return { ok: false, message: 'Nao foi possivel enviar o link: ' + error.message };
  }

  return {
    ok: true,
    message: 'Link seguro enviado. Abra o email neste mesmo navegador para entrar.'
  };
}

export async function signOut(): Promise<AuthResult> {
  if (!supabase) return { ok: false, message: authUnavailableMessage() };
  const { error } = await supabase.auth.signOut();
  return error
    ? { ok: false, message: 'Nao foi possivel sair: ' + error.message }
    : { ok: true, message: 'Sessao encerrada com seguranca.' };
}
