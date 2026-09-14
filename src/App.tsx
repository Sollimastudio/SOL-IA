import { useEffect, useState } from 'react';
import type { Session } from '@supabase/supabase-js';
import { AuthPanel } from './components/AuthPanel';
import { InstallJarvis } from './components/InstallJarvis';
import { IntegrationHub } from './components/IntegrationHub';
import { NoCostWorkspace } from './components/NoCostWorkspace';
import { meteredAiEnabled } from './core/budgetPolicy';
import { JarvisConversation } from './components/JarvisConversation';
import { KnowledgeLibrary } from './components/KnowledgeLibrary';
import { MemoryVault } from './components/MemoryVault';
import { MetaAdsPanel } from './components/MetaAdsPanel';
import { ReadOnlySources } from './components/ReadOnlySources';
import { getCurrentSession, subscribeToAuth } from './services/authService';
import { isSecureMemoryEnabled, isSupabaseConfigured } from './services/supabaseClient';

type Area = 'chat' | 'knowledge' | 'vault' | 'integrations';

const areaLabels: Record<Area, string> = {
  chat: 'CONVERSAR',
  knowledge: 'CONHECIMENTO',
  vault: 'COFRE',
  integrations: 'INTEGRAÇÕES'
};

export function App() {
  const [session, setSession] = useState<Session | null>(null);
  const [authResolved, setAuthResolved] = useState(false);
  const [mode, setMode] = useState<'private' | 'public'>('private');
  const [area, setArea] = useState<Area>('chat');
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
  useEffect(() => {
    setMode('private');
    setArea('chat');
  }, [session?.user.id]);

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

  const privateArea = area !== 'chat';
  const chooseArea = (next: Area) => {
    if (mode === 'public' && next !== 'chat') return;
    setArea(next);
  };

  return <main><section className="shell">
    <InstallJarvis />
    <header className="hero"><div>
      <p className="eyebrow">JARVIS / SOL.IA</p>
      <h1>{area === 'chat' ? 'Fale comigo.' : areaLabels[area].toLowerCase()}</h1>
      <p className="hero-copy">{area === 'chat'
        ? meteredAiEnabled
          ? 'Você fala do seu jeito. O Jarvis organiza o contexto e coordena os bastidores.'
          : 'Você pode continuar falando e registrando. A resposta inteligente está pausada pelo orçamento zero, mas o chat continua sendo a sua tela principal.'
        : area === 'knowledge'
          ? 'Adicione fontes que o Jarvis poderá consultar sem misturar documento com memória pessoal.'
          : area === 'vault'
            ? 'Veja o que foi realmente confirmado no seu cofre privado.'
            : 'Conecte contas e ferramentas com autorização explícita. O objetivo é evitar copiar tokens manualmente.'}</p>
    </div><div className="security-summary"><strong>{mode === 'public' ? 'Performance pública' : 'Sessão iniciada · modo privado'}</strong></div></header>

    <nav className="jarvis-main-nav" aria-label="Menu principal do Jarvis">
      {(Object.keys(areaLabels) as Area[]).map(key => <button
        key={key}
        type="button"
        className={area === key ? 'active' : ''}
        aria-current={area === key ? 'page' : undefined}
        disabled={mode === 'public' && key !== 'chat'}
        onClick={() => chooseArea(key)}>{areaLabels[key]}</button>)}
    </nav>

    {area === 'chat' && (meteredAiEnabled
      ? <JarvisConversation key={session.user.id} session={session} onModeChange={next => { setMode(next); if (next === 'public') setArea('chat'); }}
          onSaved={() => setMemoryRefreshKey(value => value + 1)} />
      : <NoCostWorkspace key={session.user.id} session={session} />)}

    {privateArea && mode === 'private' && <section className="jarvis-drawer" aria-label={areaLabels[area]}>
      <div className="jarvis-drawer-heading">
        <div><span className="eyebrow">JARVIS · GAVETA</span><h2>{areaLabels[area]}</h2></div>
        <button className="button button-secondary" type="button" onClick={() => setArea('chat')}>VOLTAR PARA CONVERSAR</button>
      </div>
      {area === 'knowledge' && <KnowledgeLibrary key={session.user.id} session={session} />}
      {area === 'vault' && <MemoryVault key={session.user.id} session={session} refreshKey={memoryRefreshKey} />}
      {area === 'integrations' && <>
        <IntegrationHub />
        <details className="panel"><summary>Conta e acesso</summary><AuthPanel session={session} /></details>
        <details className="panel"><summary>Fontes técnicas e departamentos atuais</summary><ReadOnlySources /><MetaAdsPanel key={session.user.id} session={session} /></details>
      </>}
    </section>}
  </section></main>;
}
