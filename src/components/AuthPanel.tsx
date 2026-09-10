import { FormEvent, useRef, useState } from 'react';
import type { Session } from '@supabase/supabase-js';
import { requestEmailCode, signOut, verifyEmailCode } from '../services/authService';
import { isSecureMemoryEnabled, isSupabaseConfigured } from '../services/supabaseClient';

type AuthPanelProps = { session: Session | null };

export function AuthPanel({ session }: AuthPanelProps) {
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [codeRequested, setCodeRequested] = useState(false);
  const [status, setStatus] = useState('');
  const [busy, setBusy] = useState(false);
  const pending = useRef(false);
  const codeLengthValid = code.length >= 6 && code.length <= 10;

  async function handleRequestCode(event: FormEvent) {
    event.preventDefault();
    if (pending.current || !isSecureMemoryEnabled || !isSupabaseConfigured) return;
    pending.current = true;
    setBusy(true);
    setStatus('');
    try {
      const result = await requestEmailCode(email);
      setStatus(result.message);
      if (result.ok) {
        setCodeRequested(true);
        setCode('');
      }
    } catch {
      setStatus('Não foi possível enviar o código. Tente novamente.');
    } finally {
      pending.current = false;
      setBusy(false);
    }
  }

  async function handleVerifyCode(event: FormEvent) {
    event.preventDefault();
    if (pending.current) return;
    pending.current = true;
    setBusy(true);
    setStatus('Verificando código…');
    try {
      const result = await verifyEmailCode(email, code);
      setStatus(result.message);
      if (!result.ok) setBusy(false);
    } catch {
      setStatus('Não foi possível confirmar o código. Tente novamente.');
      setBusy(false);
    } finally {
      pending.current = false;
      setBusy(false);
    }
  }

  async function handleSignOut() {
    if (pending.current) return;
    pending.current = true;
    setBusy(true);
    try {
      const result = await signOut();
      setStatus(result.message);
    } catch {
      setStatus('Não foi possível sair agora. Tente novamente.');
    } finally {
      pending.current = false;
      setBusy(false);
    }
  }

  if (!isSecureMemoryEnabled || !isSupabaseConfigured) {
    return <section id="jarvis-access" className="panel" aria-labelledby="jarvis-access-title">
      <h2 id="jarvis-access-title">Acesso ainda não liberado</h2>
      <p>Esta prévia ainda não está pronta para login. A configuração do acesso precisa ser concluída antes de você entrar.</p>
      <p>Não falta nenhuma ação sua nesta tela.</p>
      <details>
        <summary>Detalhes da ativação</summary>
        <p>{!isSecureMemoryEnabled
          ? 'A liberação do acesso privado ainda está desativada nesta versão.'
          : 'A conexão de autenticação ainda não foi configurada nesta versão.'}</p>
        <p>O responsável técnico precisa validar a autenticação e a proteção dos dados antes de liberar o acesso. Nenhuma senha ou chave deve ser informada no chat.</p>
      </details>
    </section>;
  }

  if (session?.user) {
    return <section id="jarvis-access" className="panel" aria-labelledby="jarvis-access-title">
      <h2 id="jarvis-access-title">Sua conta</h2>
      <p>Conectada como <strong>{session.user.email || 'usuário autenticado'}</strong>.</p>
      <p className="status-text">O login não confirma, por si só, a disponibilidade da IA ou do armazenamento.</p>
      <button className="button button-secondary" disabled={busy} onClick={handleSignOut}>Sair da conta</button>
      <p className="status-text" role="status" aria-live="polite">{status}</p>
    </section>;
  }

  return <section id="jarvis-access" className="panel" aria-labelledby="jarvis-access-title">
    <h2 id="jarvis-access-title">Entrar no Jarvis</h2>
    {!codeRequested ? <>
      <p>Digite seu e-mail. O Jarvis vai enviar um código numérico para você entrar sem senha e sem sair desta tela.</p>
      <form onSubmit={handleRequestCode} aria-busy={busy}>
        <label htmlFor="auth-email">Seu e-mail</label>
        <input id="auth-email" type="email" autoComplete="email" inputMode="email"
          autoCapitalize="none" spellCheck={false} value={email}
          onChange={event => setEmail(event.target.value)} placeholder="seu@email.com"
          required disabled={busy} style={{ display: 'block', width: '100%', marginTop: 8, fontSize: '1rem' }} />
        <button className="button" disabled={busy} type="submit" style={{ width: '100%', marginTop: 14 }}>
          {busy ? 'Enviando…' : 'Enviar código'}
        </button>
      </form>
    </> : <>
      <p>Enviamos um código para <strong>{email}</strong>. Volte aqui e digite o código numérico completo recebido no e-mail.</p>
      <form onSubmit={handleVerifyCode} aria-busy={busy}>
        <label htmlFor="auth-code">Código de acesso</label>
        <input id="auth-code" type="text" inputMode="numeric" autoComplete="one-time-code"
          pattern="[0-9]{6,10}" minLength={6} maxLength={10} value={code}
          onChange={event => setCode(event.target.value.replace(/\D/g, '').slice(0, 10))}
          placeholder="00000000" required disabled={busy}
          style={{ display: 'block', width: '100%', marginTop: 8, fontSize: '1.3rem', letterSpacing: '0.2em' }} />
        <button className="button" disabled={busy || !codeLengthValid} type="submit" style={{ width: '100%', marginTop: 14 }}>
          {busy ? 'Verificando…' : 'Entrar no Jarvis'}
        </button>
      </form>
      <button className="button button-secondary" type="button" disabled={busy}
        onClick={() => { setCodeRequested(false); setCode(''); setStatus(''); }} style={{ width: '100%', marginTop: 10 }}>
        Usar outro e-mail ou pedir novo código
      </button>
    </>}
    <p className="status-text" role="status" aria-live="polite">{status}</p>
  </section>;
}
