import { useEffect, useState } from 'react';
import type { Session } from '@supabase/supabase-js';
import { AuthPanel } from './components/AuthPanel';
import { InstallJarvis } from './components/InstallJarvis';
import { NoCostWorkspace } from './components/NoCostWorkspace';
import { meteredAiEnabled } from './core/budgetPolicy';
import { JarvisConversation } from './components/JarvisConversation';
import { KnowledgeLibrary } from './components/KnowledgeLibrary';
import { MemoryVault } from './components/MemoryVault';
import { MetaAdsPanel } from './components/MetaAdsPanel';
import { ReadOnlySources } from './components/ReadOnlySources';
import { getCurrentSession, subscribeToAuth } from './services/authService';
import { isSecureMemoryEnabled, isSupabaseConfigured } from './services/supabaseClient';

export function App() {
  const [session, setSession] = useState<Session | null>(null);
  const [authResolved, setAuthResolved] = useState(false);
  const [mode, setMode] = useState<'private' | 'public'>('private');
  const [memoryRefreshKey, setMemoryRefreshKey] = useState(0);
  useEffect(() => {
    let mounted = true;
    let authEventReceived = false;
    const applySession = (value: Session | null) => {
      if (!mounted) return;
      setSession(value);
      setAuthResolved(true);
    };
    const unsubscribe = subscribeToAuth(value => {
      authEventReceived = true;
      applySession(value);
    });
    void getCurrentSession().then(value => {
      if (!authEventReceived) applySession(value);
    }).catch(() => { if (!authEventReceived) applySession(null); });
    return () => { mounted = false; unsubscribe(); };
  }, []);
  useEffect(() => { setMode('private'); }, [session?.user.id]);

  // Do not show a dead chat asking the visitor to find a login that is disabled.
  // The same gate used by authService is retained; no memory policy is bypassed.
  if (!authResolved || !session || !isSecureMemoryEnabled || !isSupabaseConfigured) {
    return <main><section className="shell" style={{ maxWidth: 520 }}>
      <InstallJarvis />
      <header className="hero"><div>
        <p className="eyebrow">SOL.IA</p>
        <h1>Jarvis.</h1>
        <p className="hero-copy">Seu assessor pessoal.</p>
      </div></header>
      {!authResolved
        ? <p className="status-text" role="status">Verificando acesso…</p>
        : <AuthPanel session={session} />}
    </section></main>;
  }

  return <main><section className="shell">
    <InstallJarvis />
    <header className="hero"><div>
      <p className="eyebrow">JARVIS / SOL.IA</p>
      <h1>Fale comigo.</h1>
      <p className="hero-copy">{meteredAiEnabled ? 'Você fala do seu jeito. O Jarvis organiza o contexto e coordena os bastidores.' : 'Suas ideias no cofre, com geração de IA pausada.'}</p>
    </div><div className="security-summary"><strong>{mode === 'public' ? 'Performance pública' : 'Sessão iniciada · modo privado'}</strong></div></header>

    {meteredAiEnabled ? <JarvisConversation key={session.user.id} session={session} onModeChange={setMode}
      onSaved={() => setMemoryRefreshKey(value => value + 1)} /> : <NoCostWorkspace key={session.user.id} session={session} />}

    {mode === 'private' && <details className="panel">
      <summary>Central do Jarvis · projetos, memória e integrações</summary>
      <p className="status-text">Esta área existe para consulta e configuração. Você não precisa usá-la para conversar com o Jarvis.</p>
      <AuthPanel session={session} />
      <KnowledgeLibrary key={session.user.id} session={session} />
      {meteredAiEnabled && <MemoryVault key={session.user.id} session={session} refreshKey={memoryRefreshKey} />}
      <details><summary>Integrações e departamentos técnicos</summary><ReadOnlySources /><MetaAdsPanel key={session.user.id} session={session} /></details>
    </details>}
  </section></main>;
}
