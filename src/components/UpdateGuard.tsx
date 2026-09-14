import { useCallback, useEffect, useRef, useState } from 'react';

const currentBuild = typeof __JARVIS_BUILD__ === 'string' ? __JARVIS_BUILD__ : 'local';

export function UpdateGuard() {
  const [available, setAvailable] = useState(false);
  const [serverBuild, setServerBuild] = useState('');
  const checking = useRef(false);

  const check = useCallback(async () => {
    if (checking.current || currentBuild === 'local') return;
    checking.current = true;
    try {
      const response = await fetch(`/api/version?t=${Date.now()}`, { cache: 'no-store', headers: { Accept: 'application/json' } });
      if (!response.ok || !response.headers.get('content-type')?.includes('application/json')) return;
      const data = await response.json();
      if (typeof data?.build !== 'string' || !data.build || data.build === 'unknown') return;
      setServerBuild(data.build);
      setAvailable(data.build !== currentBuild);
    } catch {
      // Update checks must never block Jarvis usage.
    } finally {
      checking.current = false;
    }
  }, []);

  useEffect(() => {
    void check();
    const onVisible = () => { if (document.visibilityState === 'visible') void check(); };
    document.addEventListener('visibilitychange', onVisible);
    const timer = window.setInterval(() => { if (document.visibilityState === 'visible') void check(); }, 5 * 60 * 1000);
    return () => { document.removeEventListener('visibilitychange', onVisible); window.clearInterval(timer); };
  }, [check]);

  if (!available) return <span className="jarvis-version" title={`Versão ${currentBuild.slice(0, 7)}`}>v {currentBuild.slice(0, 7)}</span>;

  return <aside className="jarvis-update" role="status" aria-label="Atualização do Jarvis disponível">
    <span>Há uma versão nova do Jarvis disponível.</span>
    <button type="button" onClick={() => window.location.reload()}>ATUALIZAR JARVIS</button>
    <small>{currentBuild.slice(0, 7)} → {serverBuild.slice(0, 7)}</small>
  </aside>;
}
