import React, { useState } from 'react';
import { createRoot } from 'react-dom/client';
import type { Session } from '@supabase/supabase-js';
import { JarvisLiveVoice } from '../../src/components/JarvisLiveVoice';
import { fixtureSession, providerStatus, delayAuthentication, releaseAuthentication, clientCount, continuous } from './live-voice.adapters';
import '../../src/styles.css';
function Harness() {
  const [mode, setMode] = useState<'private' | 'public'>('private');
  const [evidence, setEvidence] = useState('Nenhum cliente criado.');
  return <main style={{ maxWidth: 900, margin: 'auto', padding: 16 }}>
    <h1>Teste sintético da interface</h1><p>Sem microfone, rede, conta real ou resposta do Google.</p>
    <JarvisLiveVoice session={fixtureSession as Session} mode={mode} />
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, marginTop: 24 }}>
      <button onClick={() => providerStatus('disconnected')}>Simular fim do provedor</button>
      <button onClick={() => providerStatus('reconnecting')}>Simular retomada</button>
      <button onClick={() => providerStatus('connected')}>Concluir retomada</button>
      <button onClick={delayAuthentication}>Adiar sessão de teste</button>
      <button onClick={releaseAuthentication}>Liberar sessão de teste</button>
      <button onClick={() => setMode(mode === 'private' ? 'public' : 'private')}>Trocar privacidade</button>
      <button onClick={() => setEvidence(`Clientes criados: ${clientCount}. Contínua: ${continuous}.`)}>Conferir clientes criados</button>
    </div><p role="note">{evidence}</p>
  </main>;
}
createRoot(document.getElementById('root')!).render(<Harness />);
