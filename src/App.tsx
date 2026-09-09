import { useEffect, useState } from 'react';
import type { Session } from '@supabase/supabase-js';
import { AuthPanel } from './components/AuthPanel';
import { JarvisConversation } from './components/JarvisConversation';
import { KnowledgeLibrary } from './components/KnowledgeLibrary';
import { MemoryVault } from './components/MemoryVault';
import { MetaAdsPanel } from './components/MetaAdsPanel';
import { ReadOnlySources } from './components/ReadOnlySources';
import { getCurrentSession, subscribeToAuth } from './services/authService';

export function App() {
  const [session, setSession] = useState<Session | null>(null);
  const [mode, setMode] = useState<'private' | 'public'>('private');
  const [memoryRefreshKey, setMemoryRefreshKey] = useState(0);
  useEffect(() => {
    let mounted = true;
    let authEventReceived = false;
    const unsubscribe = subscribeToAuth(value => {
      authEventReceived = true;
      if (mounted) setSession(value);
    });
    void getCurrentSession().then(value => {
      if (mounted && !authEventReceived) setSession(value);
    }).catch(() => { if (mounted && !authEventReceived) setSession(null); });
    return () => { mounted = false; unsubscribe(); };
  }, []);
  useEffect(() => { setMode('private'); }, [session?.user.id]);

  return <main><section className="shell">
    <header className="hero"><div>
      <p className="eyebrow">JARVIS / SOL.IA</p>
      <h1>Fale comigo.</h1>
      <p className="hero-copy">Você fala do seu jeito. O Jarvis organiza o contexto e coordena os bastidores.</p>
    </div><div className="security-summary"><strong>{mode === 'public' ? 'Performance pública' : session ? 'Privado · conectado' : 'Privado · entre para continuar'}</strong></div></header>

    {!session && mode === 'private' && <AuthPanel session={session} />}

    <JarvisConversation key={session?.user.id ?? 'signed-out'} session={session} onModeChange={setMode}
      onSaved={() => setMemoryRefreshKey(value => value + 1)} />

    {mode === 'private' && session && <details className="panel">
      <summary>Central do Jarvis · projetos, memória e integrações</summary>
      <p className="status-text">Esta área existe para consulta e configuração. Você não precisa usá-la para conversar com o Jarvis.</p>
      <AuthPanel session={session} />
      <KnowledgeLibrary key={session.user.id} session={session} />
      <MemoryVault key={session.user.id} session={session} refreshKey={memoryRefreshKey} />
      <details><summary>Integrações e departamentos técnicos</summary><ReadOnlySources /><MetaAdsPanel key={session.user.id} session={session} /></details>
    </details>}
  </section></main>;
}
