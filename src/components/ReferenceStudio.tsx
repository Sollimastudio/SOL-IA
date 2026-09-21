import { useEffect, useRef, useState } from 'react';
import type { Session } from '@supabase/supabase-js';
import { getCurrentSession } from '../services/authService';
import './reference-studio.css';

export type ReferenceIntent = { id: string; message: string; url: string };
type Episode = { id: string; number: number; version: number; title: string; script: string; description: string; copy: string; bridge: string; estimatedSeconds: number; questions: { id: string; text: string }[]; [key: string]: unknown };
type Job = { id: string; revision: number; busy: boolean; lease_until: string | null; state: { brief: { title: string; count: number }; status: string; nextStep: string | null; reference: { status: string; reason?: string; method?: string; coverage?: { audio: boolean; visuals: boolean; captions: boolean }; limitations?: string[] } | null; plan: { summary: string; opportunity: string; priority: string; branches: string[] } | null; episodes: Episode[]; lastError: { message: string } | null; delivery: { episodeCount: number } | null } };
type JobSummary = { id: string; title: string; status: string; generated: number; count: number };
const labels: Record<string, string> = { received: 'Referência recebida', planning: 'Referência obtida', drafting: 'Escrevendo a série', review: 'Pronta para sua revisão', approved: 'Aprovada', delivered: 'Recebida pela Lúcida', blocked: 'Aguardando uma conexão ou correção', uncertain: 'Etapa sem confirmação', cancelled: 'Pausada' };

export function ReferenceStudio({ session, incoming, onConsumed }: { session: Session; incoming?: ReferenceIntent | null; onConsumed?(): void }) {
  const [jobs, setJobs] = useState<JobSummary[]>([]), [job, setJob] = useState<Job | null>(null);
  const [kind, setKind] = useState('url'), [source, setSource] = useState(''), [objective, setObjective] = useState(''), [title, setTitle] = useState('Minutos Magnetus');
  const [status, setStatus] = useState(''), [busy, setBusy] = useState(false), [access, setAccess] = useState(''), [entitlement, setEntitlement] = useState('');
  const [editing, setEditing] = useState<string | null>(null), [script, setScript] = useState('');
  const [themes, setThemes] = useState<Array<{ topic: string; people: number; proposal: string }>>([]);
  const pendingBranch = useRef<{ parentId: string; topic: string; childId: string } | null>(null);
  const lifetime = useRef<AbortController>(new AbortController()), running = useRef(false), pendingCreate = useRef<{ id: string; brief: unknown } | null>(null), incomingStarted = useRef<string | null>(null);
  async function api(body?: Record<string, unknown>, id?: string) {
    const current = await getCurrentSession();
    if (current?.user.id !== session.user.id) throw new Error('A conta mudou. Reabra suas séries na sessão atual.');
    const response = await fetch('/api/jarvis-references' + (body ? '' : `?mode=private${id ? `&id=${encodeURIComponent(id)}` : ''}`), {
      method: body ? 'POST' : 'GET', headers: { Authorization: `Bearer ${current.access_token}`, ...(body ? { 'Content-Type': 'application/json' } : {}) },
      body: body ? JSON.stringify({ ...body, mode: 'private' }) : undefined, cache: 'no-store', signal: AbortSignal.any([lifetime.current.signal, AbortSignal.timeout(65000)])
    });
    const data = await response.json(); if (!response.ok || !data.ok) throw new Error(data.error || 'A operação não foi confirmada. Atualize para conferir.'); return data;
  }
  async function refresh() { const data = await api(); if (!lifetime.current.signal.aborted) setJobs(data.jobs); }
  useEffect(() => {
    lifetime.current = new AbortController();
    void refresh().catch(error => { if (!lifetime.current.signal.aborted) setStatus(error.message); });
    return () => { lifetime.current.abort(); running.current = false; };
  }, [session.user.id]);
  async function run(fn: () => Promise<void>) {
    if (running.current) return; running.current = true; setBusy(true);
    try { await fn(); } catch (error) { if (!lifetime.current.signal.aborted) setStatus(error instanceof Error ? error.message : 'A operação não foi confirmada.'); }
    finally { running.current = false; if (!lifetime.current.signal.aborted) setBusy(false); }
  }
  async function generate(initial: Job) {
    let current = initial;
    for (let step = 0; step < initial.state.brief.count + 2; step++) {
      if (!current.state.nextStep || ['review', 'approved', 'delivered', 'blocked', 'uncertain', 'cancelled'].includes(current.state.status) || lifetime.current.signal.aborted) break;
      setStatus(`Preparando sua série: ${current.state.episodes.length} de ${current.state.brief.count} roteiros salvos.`);
      const data = await api({ action: 'advance', id: current.id, revision: current.revision }); current = data.job;
      if (lifetime.current.signal.aborted) return; setJob(current);
    }
    setStatus(current.state.lastError?.message || `${labels[current.state.status] || current.state.status}. Os roteiros concluídos estão salvos.`);
    await refresh();
  }
  async function create(brief: unknown, fixedId?: string) {
    const existing = pendingCreate.current;
    if (existing && JSON.stringify(existing.brief) !== JSON.stringify(brief)) throw new Error('Há um envio ainda sem confirmação. Atualize a lista antes de alterar essa referência.');
    const pending = existing || { id: fixedId || crypto.randomUUID(), brief }; pendingCreate.current = pending;
    setStatus('Guardando o pedido e obtendo a referência…');
    const data = await api({ action: 'create', ...pending });
    pendingCreate.current = null; setJob(data.job); onConsumed?.(); await refresh(); await generate(data.job);
  }
  useEffect(() => {
    if (!incoming || incomingStarted.current === incoming.id) return;
    const timer = setTimeout(() => {
      incomingStarted.current = incoming.id; setSource(incoming.url); setObjective(incoming.message);
      void run(() => create({ title: 'Minutos Magnetus', objective: incoming.message, count: 9, source: { kind: 'url', title: 'Referência compartilhada', url: incoming.url } }, incoming.id));
    }, 0);
    return () => clearTimeout(timer);
  }, [incoming?.id]);
  async function action(name: string, extra: Record<string, unknown> = {}) {
    if (!job) return;
    const data = await api({ action: name, id: job.id, revision: job.revision, ...extra });
    if (data.job) { setJob(data.job); setStatus(data.job.state.lastError?.message || labels[data.job.state.status] || 'Salvo.'); }
    await refresh(); return data;
  }
  return <section className="reference-studio panel" aria-labelledby="reference-title">
    <div className="panel-heading"><div><span className="eyebrow">JARVIS · CRIAÇÃO COM CONTINUIDADE</span><h2 id="reference-title">Da referência à sua série</h2></div></div>
    <p>Compartilhe a ideia. O Jarvis prepara os roteiros, guarda o progresso e organiza o que a Lúcida precisa conhecer.</p>
    <form onSubmit={event => { event.preventDefault(); void run(() => create({ title, objective, count: 9, source: { kind, title: 'Referência da série', ...(['url', 'channel', 'media'].includes(kind) ? { url: source } : { text: source }) } })); }}>
      <label>Nome da série<input value={title} maxLength={200} onChange={event => setTitle(event.target.value)} required /></label>
      <label>Referência<select value={kind} onChange={event => setKind(event.target.value)}><option value="url">Link de vídeo ou página</option><option value="channel">Canal — amostra identificada</option><option value="text">Texto ou relato fornecido</option><option value="captions">Legendas VTT ou SRT</option><option value="lyrics">Letra fornecida para análise</option></select></label>
      <label>{['url', 'channel'].includes(kind) ? 'Link' : 'Conteúdo'}<textarea value={source} onChange={event => setSource(event.target.value)} rows={3} maxLength={45000} required /></label>
      <label>O que você quer criar?<textarea value={objective} onChange={event => setObjective(event.target.value)} rows={3} maxLength={4000} placeholder="Quero nove áudios complementares para eu falar e gravar…" required /></label>
      <button className="button" disabled={busy} type="submit">Preparar nove roteiros</button>
    </form>
    <p role="status" aria-live="polite">{status}</p>
    <details><summary>O que a audiência está perguntando</summary><p>Relatório da última semana completa, com temas autorizados e grupos de pelo menos cinco pessoas.</p><button disabled={busy} onClick={() => void run(async () => { const value = await api({ action: 'insights' }); setThemes(value.report.themes); setStatus(value.report.themes.length ? 'Temas coletivos disponíveis para revisão.' : 'Ainda não há grupos elegíveis suficientes. Nenhuma demanda foi inventada.'); })}>Consultar dúvidas recorrentes</button>{themes.map(theme => <article key={theme.topic}><p>{theme.proposal} · {theme.people} pessoas</p><button disabled={busy} onClick={() => { setKind('text'); setSource(`Relatório agregado consentido da última semana completa. Tema: ${theme.topic}. Pessoas distintas: ${theme.people}. Hipótese editorial: ${theme.proposal}. Sem comprovação de compras ou receita.`); setObjective(theme.proposal); }}>Preparar novo conteúdo a partir deste tema</button></article>)}</details>
    <div className="reference-actions"><button disabled={busy} onClick={() => void run(async () => {
      await refresh();
      const branch = pendingBranch.current;
      if (branch) { const result = await api(undefined, branch.childId); setJob(result.job); pendingBranch.current = null; return; }
      const pending = pendingCreate.current;
      if (pending) { const result = await api(undefined, pending.id); setJob(result.job); pendingCreate.current = null; onConsumed?.(); }
      else if (job) setJob((await api(undefined, job.id)).job);
    })}>Atualizar tarefas salvas</button></div>
    {jobs.length > 0 && <nav aria-label="Séries salvas" className="reference-jobs">{jobs.map(item => <button disabled={busy} key={item.id} onClick={() => void run(async () => { setJob((await api(undefined, item.id)).job); setEditing(null); })}><strong>{item.title}</strong><span>{item.generated}/{item.count} · {labels[item.status] || item.status}</span></button>)}</nav>}
    {job && <div className="reference-work">
      <h3>{job.state.brief.title}</h3><p><strong>{labels[job.state.status] || job.state.status}</strong> · {job.state.episodes.length}/{job.state.brief.count} roteiros</p>
      {job.state.reference?.reason && <p>{job.state.reference.reason}</p>}
      {job.state.reference?.coverage && <p>Conteúdo obtido: {job.state.reference.coverage.captions ? 'legendas' : job.state.reference.status === 'ready' ? 'texto' : 'ainda não confirmado'}. Áudio processado: {job.state.reference.coverage.audio ? 'sim' : 'não'}. Imagens analisadas: {job.state.reference.coverage.visuals ? 'sim' : 'não'}.</p>}
      {job.state.plan && <details><summary>Compreensão e oportunidades</summary><p>{job.state.plan.summary}</p><p>{job.state.plan.opportunity}</p><p>Próximo passo: {job.state.plan.priority}</p><ul>{job.state.plan.branches.map((branch, i) => <li key={i}>{branch}<button disabled={busy} onClick={() => void run(async () => {
        const pending = pendingBranch.current;
        if (pending && (pending.parentId !== job.id || pending.topic !== branch)) throw new Error('Confira a pauta ainda sem confirmação antes de abrir outra.');
        const next = pending || { parentId: job.id, topic: branch, childId: crypto.randomUUID() }; pendingBranch.current = next;
        await action('branch', next); pendingBranch.current = null; setStatus('Nova pauta salva e ligada à série original. Continue quando quiser desenvolvê-la.');
      })}>Abrir esta pauta preservando a origem</button></li>)}</ul></details>}
      <div className="reference-actions">
        {!job.busy && ['planning', 'drafting', 'received'].includes(job.state.status) && <button disabled={busy} onClick={() => void run(() => generate(job))}>Continuar de onde parou</button>}
        {!job.busy && ['blocked', 'uncertain'].includes(job.state.status) && <button disabled={busy} onClick={() => void run(async () => { const data = await action('retry', { confirmRetry: true }); if (data) await generate(data.job); })}>Retomar a etapa após conferir o aviso</button>}
        {job.busy && <button disabled={busy} onClick={() => void run(async () => { await action('recover'); })}>Verificar etapa interrompida</button>}
      </div>
      {job.state.status === 'uncertain' && <p>A etapa anterior não confirmou o resultado. Retomá-la pode consumir novamente a franquia do modelo; os roteiros já salvos serão preservados.</p>}
      {job.state.episodes.map(episode => <article key={`${episode.id}:${episode.version}`} className="reference-episode">
        <h4>{episode.number}. {episode.title}</h4><small>Versão {episode.version} · cerca de {Math.ceil(episode.estimatedSeconds / 60)} min</small>
        {editing === episode.id ? <><label>Roteiro<textarea rows={15} value={script} maxLength={10000} onChange={event => setScript(event.target.value)} /></label><button disabled={busy} onClick={() => void run(async () => { await action('edit_episode', { episodeId: episode.id, episodeVersion: episode.version, episode: { ...episode, script } }); setEditing(null); })}>Salvar revisão</button><button onClick={() => setEditing(null)}>Cancelar edição</button></> : <><p className="reference-script">{episode.script}</p><button disabled={busy || Boolean(job.state.delivery)} onClick={() => { setEditing(episode.id); setScript(episode.script); }}>Editar roteiro</button></>}
        <details><summary>Perguntas e chamada</summary><ol>{episode.questions.map(q => <li key={q.id}>{q.text}</li>)}</ol><p>{episode.copy}</p><p>{episode.bridge}</p></details>
      </article>)}
      {job.state.status === 'review' && <fieldset><legend>Revisão da série</legend><label>Acesso<select value={access} onChange={event => setAccess(event.target.value)}><option value="">Escolha o acesso desta série</option><option value="free">Livre no app</option><option value="entitled">Incluído em um produto</option></select></label>{access === 'entitled' && <label>Identificador do produto<input value={entitlement} onChange={event => setEntitlement(event.target.value)} /></label>}<button disabled={busy || !access || (access === 'entitled' && !entitlement)} onClick={() => void run(async () => { await action('approve', { reviewed: true, access, entitlementId: entitlement }); })}>Revisei e aprovo estes roteiros</button><p>Essa aprovação prepara o conhecimento da Lúcida. A publicação dos áudios continua separada.</p></fieldset>}
      {job.state.status === 'approved' && <button disabled={busy} onClick={() => void run(async () => { await action('deliver'); })}>Disponibilizar a versão aprovada para a Lúcida</button>}
      {job.state.delivery && <p>A Lúcida confirmou o recebimento de {job.state.delivery.episodeCount} episódios. Nenhum áudio foi publicado no Telegram por esta ação.</p>}
      {job.state.delivery && <button disabled={busy} onClick={() => void run(async () => { await action('new_revision'); })}>Preparar nova revisão preservando a anterior</button>}
    </div>}
    <p className="reference-note">Você pode sair e retomar os resultados salvos. A geração avança enquanto esta tela estiver aberta; referências restritas dependem de acesso permitido.</p>
  </section>;
}
