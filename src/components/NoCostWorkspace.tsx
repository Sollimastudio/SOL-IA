import { useEffect, useRef, useState } from 'react';
import type { Session } from '@supabase/supabase-js';
import { getCurrentSession, refreshCurrentSession } from '../services/authService';
import { sendAuthenticatedChat } from '../services/authenticatedChat.mjs';
import { selectLocalPortugueseVoice } from '../core/localVoice.mjs';
import { MemoryVault } from './MemoryVault';

type CaptureReceipt = {
  answer: string;
  continuityPersisted: boolean;
  relation?: string;
  scope?: string;
  topicHint?: string;
};

const relationLabels: Record<string, string> = {
  repeat: 'assunto já conhecido',
  detail: 'novo detalhe',
  correction: 'correção',
  decision: 'decisão',
  branch: 'novo galho',
  new_topic: 'novo assunto'
};

const scopeLabels: Record<string, string> = {
  raw_statement: 'fala original',
  temporary_state: 'estado momentâneo',
  exploration: 'reflexão / exploração',
  explicit_update: 'atualização explícita',
  profile_statement: 'perfil / preferência'
};

export function NoCostWorkspace({ session }: { session: Session }) {
  const [text, setText] = useState('');
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState('Digite ou dite uma ideia. Ela só entra no cofre depois de GUARDAR NO COFRE.');
  const [voiceStatus, setVoiceStatus] = useState('');
  const [receipt, setReceipt] = useState<CaptureReceipt | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const pending = useRef<{ id: string; text: string } | null>(null);
  const request = useRef<AbortController | null>(null);
  const live = useRef(true);
  useEffect(() => {
    live.current = true;
    const silence = () => { if (document.visibilityState !== 'visible') window.speechSynthesis?.cancel(); };
    document.addEventListener('visibilitychange', silence);
    return () => { live.current = false; request.current?.abort(); window.speechSynthesis?.cancel(); document.removeEventListener('visibilitychange', silence); };
  }, []);

  async function save() {
    if (!text.trim() || request.current) return;
    const original = text;
    if (!pending.current || pending.current.text !== original) pending.current = { id: crypto.randomUUID(), text: original };
    const capture = pending.current;
    const controller = new AbortController(); request.current = controller;
    const timeout = setTimeout(() => controller.abort(), 45000);
    setBusy(true); setReceipt(null); setStatus('Confirmando o salvamento…');
    try {
      const response = await sendAuthenticatedChat({ endpoint: '/api/jarvis-capture',
        userId: session.user.id, getSession: getCurrentSession, refreshSession: refreshCurrentSession,
        signal: controller.signal, body: JSON.stringify({ message: original, mode: 'private', remember: true, captureId: capture.id }) });
      if (!response.headers.get('content-type')?.includes('application/json')) throw new Error('A hospedagem não confirmou o salvamento. Seu texto continua na tela.');
      const data = await response.json();
      if (!live.current || controller.signal.aborted) return;
      if (!response.ok || data.ok !== true || data.persisted !== true || data.memoryId !== capture.id || data.execution !== 'capture_only') {
        throw new Error(typeof data.error === 'string' ? data.error : 'Salvamento não confirmado. Confira o cofre; o texto continua na tela.');
      }
      pending.current = null; setText(''); setRefreshKey(value => value + 1);
      setReceipt({
        answer: typeof data.answer === 'string' && data.answer.trim() ? data.answer : 'Fala confirmada no cofre.',
        continuityPersisted: data.continuityPersisted === true,
        relation: typeof data.continuity?.relation === 'string' ? data.continuity.relation : undefined,
        scope: typeof data.continuity?.scope === 'string' ? data.continuity.scope : undefined,
        topicHint: typeof data.continuity?.topicHint === 'string' ? data.continuity.topicHint : undefined
      });
      setStatus(data.continuityPersisted === true
        ? 'Salvo no cofre e registrado no Diário de Continuidade.'
        : 'Salvo no cofre. O Diário de Continuidade não confirmou a indexação desta fala.');
    } catch (error) {
      if (live.current) setStatus(controller.signal.aborted
        ? 'A confirmação demorou demais. O texto continua na tela; confira Minhas notas. Repetir o mesmo envio conserva seu identificador.'
        : error instanceof Error ? error.message : 'Salvamento não confirmado. O texto continua na tela.');
    } finally {
      clearTimeout(timeout); if (request.current === controller) request.current = null;
      if (live.current) setBusy(false);
    }
  }

  function readText() {
    if (!('speechSynthesis' in window)) { setVoiceStatus('Este navegador não oferece leitura de texto.'); return; }
    const voice = selectLocalPortugueseVoice(window.speechSynthesis.getVoices());
    if (!voice) { setVoiceStatus('Nenhuma voz local em português está disponível neste navegador. Nenhum serviço remoto foi chamado.'); return; }
    window.speechSynthesis.cancel();
    const speech = new SpeechSynthesisUtterance(text);
    speech.voice = voice; speech.lang = voice.lang;
    speech.onerror = () => { if (live.current) setVoiceStatus('A leitura foi interrompida. Seu texto continua na tela.'); };
    window.speechSynthesis.speak(speech);
    setVoiceStatus('Leitura com a voz do aparelho usada pelo Jarvis.');
  }

  return <section className="panel" aria-labelledby="no-cost-title">
    <div className="panel-heading"><div><span className="eyebrow">JARVIS · COFRE PRIVADO</span><h2 id="no-cost-title">Guardar sem chamar IA</h2></div></div>
    <p>Geração de respostas inteligentes está pausada pelo orçamento zero. Aqui você guarda e consulta suas ideias no cofre existente.</p>
    <form onSubmit={event => { event.preventDefault(); void save(); }}>
      <label htmlFor="jarvis-message">Sua ideia ou anotação</label>
      <textarea id="jarvis-message" rows={5} maxLength={8000} value={text} disabled={busy}
        onChange={event => setText(event.target.value)} placeholder="Escreva ou dite do seu jeito…" />
      <p className="status-text">Texto ainda no campo não é uma cópia de segurança. Toque em GUARDAR NO COFRE para confirmar.</p>
      <div className="neural-options">
        <button className="button button-primary" type="submit" disabled={busy || !text.trim()}>{busy ? 'GUARDANDO…' : 'GUARDAR NO COFRE'}</button>
        <button className="button button-secondary" type="button" disabled={busy || !text.trim()} onClick={readText}>Ouvir texto</button>
        <button className="button button-secondary" type="button" onClick={() => { window.speechSynthesis?.cancel(); setVoiceStatus('Leitura interrompida.'); }}>Parar voz</button>
      </div>
    </form>
    <p role="status" className="status-text">{status}</p>
    {voiceStatus ? <p className="status-text">{voiceStatus}</p> : null}
    {receipt ? <article className="memory-card" aria-label="Resultado do registro no Jarvis">
      <div className="memory-meta"><strong>JARVIS · REGISTRO CONFIRMADO</strong><span>SEM GERAÇÃO DE IA</span></div>
      <p>{receipt.answer}</p>
      {receipt.topicHint ? <p><strong>Assunto reconhecido:</strong> {receipt.topicHint}</p> : null}
      <div className="tag-row">
        {receipt.relation ? <span className="tag">{relationLabels[receipt.relation] ?? receipt.relation}</span> : null}
        {receipt.scope ? <span className="tag">{scopeLabels[receipt.scope] ?? receipt.scope}</span> : null}
        <span className="tag">{receipt.continuityPersisted ? 'diário atualizado' : 'diário pendente'}</span>
      </div>
      <p className="status-text">Sua fala foi guardada. Uma resposta inteligente sobre o conteúdo não foi gerada porque este modo está sem chamada de modelo.</p>
    </article> : null}
    <details><summary>Minhas notas · consultar sem IA</summary><MemoryVault session={session} refreshKey={refreshKey} /></details>
    <details><summary>Como funciona nesta etapa</summary><p>Salvar e consultar usam internet e o Supabase já existente, sujeito aos limites desse serviço. A leitura usa apenas vozes que o navegador identifica como locais. A anotação só é confirmada depois da resposta do banco. O aviso de voz é separado da confirmação do cofre para não esconder se sua fala foi salva.</p></details>
  </section>;
}
