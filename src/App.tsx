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
    // A late initial session must not overwrite a newer login/logout event.
    void getCurrentSession().then(value => {
      if (mounted && !authEventReceived) setSession(value);
    }).catch(() => { if (mounted && !authEventReceived) setSession(null); });
    return () => { mounted = false; unsubscribe(); };
  }, []);
  useEffect(() => { setMode('private'); }, [session?.user.id]);
  return <main><section className="shell">
    <header className="hero"><div>
      <p className="eyebrow">JARVIS / SOL.IA · CONVERSA EM ATIVAÇÃO</p>
      <h1>Seu assessor. Seu contexto.</h1>
      <p className="hero-copy">Conversa, memória e especialistas. Uma evolução do Sistema Neural, sem recomeçar sua história.</p>
    </div><div className="security-summary"><strong>{mode === 'public' ? 'Modo público · cofre fora da conversa' : 'Modo privado'}</strong></div></header>
    {mode === 'private' && <AuthPanel session={session} />}
    <JarvisConversation key={session?.user.id ?? 'signed-out'} session={session} onModeChange={setMode}
      onSaved={() => setMemoryRefreshKey(value => value + 1)} />
    {mode === 'private' && <>
      <KnowledgeLibrary key={session?.user.id ?? 'no-user'} session={session} />
      <MemoryVault key={session?.user.id ?? 'no-user'} session={session} refreshKey={memoryRefreshKey} />
      <details className="panel"><summary>Departamentos e integrações existentes</summary><ReadOnlySources /><MetaAdsPanel key={session?.user.id ?? 'no-user'} session={session} /></details>
    </>}
  </section></main>;
}
