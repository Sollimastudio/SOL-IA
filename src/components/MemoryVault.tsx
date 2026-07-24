import { FormEvent, useEffect, useState } from 'react';
import type { Session } from '@supabase/supabase-js';
import { listMemories } from '../services/memoryRepository';
import { isSecureMemoryEnabled } from '../services/supabaseClient';
import type { MemoryRecord } from '../types/memory';

type MemoryVaultProps = {
  session: Session | null;
  refreshKey: number;
};

function formatDate(value: string): string {
  return new Intl.DateTimeFormat('pt-BR', {
    dateStyle: 'short',
    timeStyle: 'short'
  }).format(new Date(value));
}

export function MemoryVault({ session, refreshKey }: MemoryVaultProps) {
  const [memories, setMemories] = useState<MemoryRecord[]>([]);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('Entre para consultar seu historico.');
  const [busy, setBusy] = useState(false);

  async function loadMemories(term = search) {
    if (!session || !isSecureMemoryEnabled) {
      setMemories([]);
      setStatus('O cofre precisa estar ativo e autenticado.');
      return;
    }

    setBusy(true);
    const result = await listMemories({ search: term, limit: 12 });
    setMemories(result.data || []);
    setStatus(result.message);
    setBusy(false);
  }

  useEffect(() => {
    void loadMemories('');
    // refreshKey sinaliza uma nova captura; session identifica o cofre atual.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session?.user.id, refreshKey]);

  function handleSearch(event: FormEvent) {
    event.preventDefault();
    void loadMemories(search);
  }

  return (
    <section className="panel">
      <div className="panel-heading">
        <div>
          <span className="eyebrow">MEMORIA JARVIS-SOL</span>
          <h2>Memorias recentes</h2>
        </div>
        <span className={`status-badge ${session ? 'safe' : ''}`}>
          {session ? 'SOMENTE VOCE' : 'FECHADO'}
        </span>
      </div>

      <form className="inline-form" onSubmit={handleSearch}>
        <label className="sr-only" htmlFor="memory-search">Buscar memoria</label>
        <input
          id="memory-search"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Buscar dentro do seu cofre"
          disabled={!session || busy}
        />
        <button className="button button-secondary" disabled={!session || busy} type="submit">
          {busy ? 'Consultando...' : 'Buscar'}
        </button>
      </form>
      <p className="status-text">{status}</p>

      <div className="memory-list">
        {memories.map((memory) => (
          <article className="memory-card" key={memory.id}>
            <div className="memory-meta">
              <strong>{memory.title || memory.type}</strong>
              <span>{formatDate(memory.created_at)}</span>
            </div>
            <p>{memory.content}</p>
            <div className="tag-row">
              {memory.tags.map((tag) => <span className="tag" key={tag}>{tag}</span>)}
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
