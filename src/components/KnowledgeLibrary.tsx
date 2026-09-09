import { useEffect, useRef, useState } from 'react';
import type { Session } from '@supabase/supabase-js';

type Source = { id: string; project_key: string; source_key: string; title: string; version: number; status: string };
const projects = [
  ['morte-em-vida', 'Morte em Vida'], ['reposicione-se', 'Reposicione-se'],
  ['fuga-identitaria', 'Fuga Identitária'], ['feminicidio-emocional', 'Feminicídio Emocional'],
  ['eu-nao-desapareco', 'Eu Não Desapareço'], ['marca-e-negocios', 'Marca e negócios'],
  ['pessoal', 'Pessoal'], ['geral', 'Outros projetos']
];

/** Private-only surface. Parent unmounts it when entering public mode. */
export function KnowledgeLibrary({ session }: { session: Session | null }) {
  const [project, setProject] = useState('geral');
  const [sourceKey, setSourceKey] = useState('');
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [sources, setSources] = useState<Source[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState('Biblioteca privada. Carregue a lista antes de importar.');
  const alive = useRef(true);
  const locked = useRef(false);
  const request = useRef<AbortController | null>(null);
  const fileEpoch = useRef(0);
  const identity = session?.user.id;
  useEffect(() => {
    alive.current = true;
    return () => { alive.current = false; fileEpoch.current += 1; request.current?.abort(); };
  }, [identity]);

  async function call(body?: unknown) {
    if (!session?.access_token) throw new Error('Entre na conta autorizada.');
    const controller = new AbortController(); request.current = controller;
    const timer = setTimeout(() => controller.abort(), 20000);
    try {
      const response = await fetch(body ? '/api/jarvis-knowledge' : '/api/jarvis-knowledge?mode=private', {
        method: body ? 'POST' : 'GET',
        headers: { Authorization: `Bearer ${session.access_token}`, ...(body ? { 'Content-Type': 'application/json' } : {}) },
        body: body ? JSON.stringify(body) : undefined, signal: controller.signal
      });
      const data = await response.json();
      if (!response.ok || data.ok !== true) throw new Error(typeof data.error === 'string' ? data.error : 'A biblioteca não confirmou a operação.');
      return data;
    } finally { clearTimeout(timer); }
  }
  async function load() {
    if (locked.current) return;
    locked.current = true; setBusy(true);
    try {
      const data = await call();
      if (!alive.current) return;
      if (!Array.isArray(data.sources)) throw new Error('Resposta inválida da biblioteca.');
      setSources(data.sources); setLoaded(true);
      setStatus(`${data.sources.length} versão(ões) encontrada(s). Nenhum material foi importado automaticamente.`);
    } catch (error) {
      if (alive.current) { setLoaded(false); setStatus(error instanceof Error ? error.message : 'Biblioteca indisponível.'); }
    } finally { locked.current = false; if (alive.current) setBusy(false); }
  }
  async function importSource() {
    if (!loaded || locked.current) return;
    const expectedVersion = Math.max(0, ...sources.filter(s => s.project_key === project && s.source_key === sourceKey).map(s => s.version));
    locked.current = true; setBusy(true);
    try {
      const data = await call({ mode: 'private', projectKey: project, sourceKey, title, content, expectedVersion });
      if (!alive.current) return;
      setStatus(data.source.duplicate
        ? `Essa fonte já existe na versão ${data.source.version}. A versão atual continua sendo ${data.source.latestVersion}.`
        : `Fonte salva como versão ${data.source.version}, ainda não validada. Versões anteriores preservadas.`);
      // Keep the text until the user clears it; refresh is required before a subsequent import.
      setLoaded(false);
    } catch (error) {
      if (alive.current) { setLoaded(false); setStatus(error instanceof Error ? error.message : 'Confirmação indisponível; atualize a lista antes de repetir.'); }
    } finally { locked.current = false; if (alive.current) setBusy(false); }
  }
  async function selectFile(file?: File) {
    const epoch = ++fileEpoch.current;
    if (!file) return;
    if (!/\.(txt|md)$/i.test(file.name) || file.size > 160000) {
      setStatus('Nesta etapa, use TXT ou Markdown UTF-8 de até 160.000 bytes. PDF e DOCX ainda não são importados.'); return;
    }
    try {
      const text = new TextDecoder('utf-8', { fatal: true }).decode(await file.arrayBuffer());
      if (!alive.current || epoch !== fileEpoch.current) return;
      setContent(text); setTitle(file.name.replace(/\.(txt|md)$/i, '').slice(0, 160));
      setSourceKey(file.name.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9._-]/g, '-').replace(/^[^a-z0-9]+/, '').slice(0, 120) || 'fonte');
      setStatus('Arquivo lido apenas nesta página. Revise o projeto e clique em importar para enviar ao cofre.');
    } catch { if (alive.current && epoch === fileEpoch.current) setStatus('O arquivo não pôde ser lido como texto UTF-8.'); }
  }
  return <details className="panel" data-testid="knowledge-library">
    <summary>Biblioteca dos projetos · fontes e versões</summary>
    <p>O Jarvis consulta trechos das fontes importadas. Importar não aprova fatos nem publica conteúdo. Esta biblioteca não aparece no modo público.</p>
    <button className="button button-secondary" disabled={!session || busy} onClick={() => void load()}>Atualizar lista de fontes</button>
    <form onSubmit={event => { event.preventDefault(); void importSource(); }}>
      <fieldset disabled={!session || busy} style={{ border: 0, padding: 0, marginTop: '1rem' }}>
        <label htmlFor="knowledge-project">Projeto</label>{' '}
        <select id="knowledge-project" value={project} onChange={event => setProject(event.target.value)}>
          {projects.map(([key, label]) => <option key={key} value={key}>{label}</option>)}
        </select>
        <p><label htmlFor="knowledge-file">Texto ou capítulo em TXT/Markdown</label><br />
          <input id="knowledge-file" type="file" accept=".txt,.md,text/plain,text/markdown" onChange={event => void selectFile(event.target.files?.[0])} /></p>
        <p><label htmlFor="knowledge-key">Identificador da fonte (mantenha o mesmo nas revisões)</label><br />
          <input id="knowledge-key" required maxLength={120} pattern="[a-z0-9][a-z0-9._\-]{0,119}" value={sourceKey} onChange={event => setSourceKey(event.target.value)} placeholder="capitulo-01.txt" /></p>
        <p><label htmlFor="knowledge-title">Título</label><br />
          <input id="knowledge-title" required maxLength={160} value={title} onChange={event => setTitle(event.target.value)} /></p>
        <label htmlFor="knowledge-content">Conteúdo da fonte</label>
        <textarea id="knowledge-content" required rows={5} value={content} onChange={event => setContent(event.target.value)} />
        <button className="button" type="submit" disabled={!loaded || !content.trim()}>Importar versão sem apagar anteriores</button>
      </fieldset>
    </form>
    <p role="status">{status}</p>
    <div className="memory-list">{sources.filter(s => s.project_key === project).map(source => <article className="memory-card" key={source.id}>
      <strong>{source.title}</strong><p>Versão {source.version} · fonte importada, não validada</p><small>{source.source_key}</small>
    </article>)}</div>
  </details>;
}
