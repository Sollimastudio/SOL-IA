import { FormEvent, useState } from 'react';
import type { Session } from '@supabase/supabase-js';
import { sendMagicLink, signOut } from '../services/authService';
import {
  isSecureMemoryEnabled,
  isSupabaseConfigured
} from '../services/supabaseClient';

type AuthPanelProps = {
  session: Session | null;
};

export function AuthPanel({ session }: AuthPanelProps) {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState('');
  const [busy, setBusy] = useState(false);

  async function handleLogin(event: FormEvent) {
    event.preventDefault();
    setBusy(true);
    const result = await sendMagicLink(email);
    setStatus(result.message);
    setBusy(false);
  }

  async function handleSignOut() {
    setBusy(true);
    const result = await signOut();
    setStatus(result.message);
    setBusy(false);
  }

  if (!isSecureMemoryEnabled) {
    return (
      <section className="panel panel-warning">
        <div className="panel-heading">
          <div>
            <span className="eyebrow">ETAPA DE PROTECAO</span>
            <h2>Cofre aguardando ativacao</h2>
          </div>
          <span className="status-badge warning">BLOQUEADO COM SEGURANCA</span>
        </div>
        <p>
          A tela de login e a gravacao permanecem desligadas ate a migracao RLS ser
          aplicada no Supabase. Assim nenhum dado novo entra em uma tabela ainda desprotegida.
        </p>
      </section>
    );
  }

  if (!isSupabaseConfigured) {
    return (
      <section className="panel panel-warning">
        <h2>Cofre sem conexao</h2>
        <p>Configure VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY na Vercel.</p>
      </section>
    );
  }

  if (session?.user) {
    return (
      <section className="panel panel-secure">
        <div className="panel-heading">
          <div>
            <span className="eyebrow">IDENTIDADE VERIFICADA</span>
            <h2>Cofre privado ativo</h2>
          </div>
          <span className="status-badge safe">PROTEGIDO</span>
        </div>
        <p>
          Conectada como <strong>{session.user.email || 'usuario autenticado'}</strong>.
          O banco aplica isolamento por usuario em cada consulta.
        </p>
        <button className="button button-secondary" disabled={busy} onClick={handleSignOut}>
          Encerrar sessao
        </button>
        {status && <p className="status-text">{status}</p>}
      </section>
    );
  }

  return (
    <section className="panel">
      <div className="panel-heading">
        <div>
          <span className="eyebrow">ACESSO SEM SENHA</span>
          <h2>Entrar no Cofre Sol.IA</h2>
        </div>
        <span className="status-badge">MAGIC LINK</span>
      </div>
      <p>Digite seu email. O Supabase enviara um link temporario de acesso.</p>
      <form className="inline-form" onSubmit={handleLogin}>
        <label className="sr-only" htmlFor="auth-email">Email</label>
        <input
          id="auth-email"
          type="email"
          autoComplete="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          placeholder="seu@email.com"
          required
        />
        <button className="button" disabled={busy} type="submit">
          {busy ? 'Enviando...' : 'Enviar link seguro'}
        </button>
      </form>
      {status && <p className="status-text">{status}</p>}
    </section>
  );
}
