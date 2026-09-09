import { useEffect, useRef, useState } from 'react';
import type { Session } from '@supabase/supabase-js';
import { createVoiceSession } from '../core/voiceSession.mjs';

type Mode = 'private' | 'public';
type Turn = { role: 'user' | 'assistant'; content: string };
type Recognition = {
  lang: string; continuous: boolean; interimResults: boolean;
  onresult: ((event: { resultIndex: number; results: ArrayLike<{ isFinal: boolean; 0: { transcript: string } }> }) => void) | null;
  onend: (() => void) | null;
  onerror: ((event: { error: string }) => void) | null;
  start(): void; abort(): void;
};
type VoiceWindow = Window & { SpeechRecognition?: new () => Recognition; webkitSpeechRecognition?: new () => Recognition };

function boundedHistory(turns: Turn[]): Turn[] {
  const result: Turn[] = [];
  let size = 0;
  for (const turn of turns.slice(-10).reverse()) {
    const content = turn.content.slice(0, 3500);
    if (size + content.length > 10000) break;
    result.unshift({ role: turn.role, content }); size += content.length;
  }
  return result;
}

export function JarvisConversation({ session, onModeChange, onSaved }: {
  session: Session | null; onModeChange(mode: Mode): void; onSaved(): void;
}) {
  const [mode, setMode] = useState<Mode>('private');
  const [text, setText] = useState('');
  const [turns, setTurns] = useState<Turn[]>([]);
  const [status, setStatus] = useState('Microfone desligado. Converse por texto ou inicie uma sessão de voz.');
  const [busy, setBusy] = useState(false);
  const [listening, setListening] = useState(false);
  const [consent, setConsent] = useState(false);
  const [voiceReply, setVoiceReply] = useState(false);
  const [remember, setRemember] = useState(true);
  const gate = useRef(createVoiceSession());
  const recognition = useRef<Recognition | null>(null);
  const request = useRef<AbortController | null>(null);
  const requestEpoch = useRef(0);
  const busyRef = useRef(false);
  const turnsRef = useRef<Turn[]>([]);
  const restart = useRef<ReturnType<typeof setTimeout> | undefined>();
  const idle = useRef<ReturnType<typeof setTimeout> | undefined>();
  const sendRef = useRef<(message: string) => void>(() => {});
  const speechResume = useRef<(() => void) | null>(null);

  function stopHardware() {
    clearTimeout(restart.current); clearTimeout(idle.current);
    gate.current.stop();
    const old = recognition.current; recognition.current = null;
    if (old) { old.onresult = null; old.onend = null; old.onerror = null; try { old.abort(); } catch { /* already stopped */ } }
    speechResume.current = null; window.speechSynthesis?.cancel();
    request.current?.abort(); request.current = null;
    requestEpoch.current += 1; busyRef.current = false;
  }
  function endSession() {
    stopHardware(); setBusy(false); setListening(false);
    setStatus('Conversa de voz encerrada. Microfone desligado; nenhuma escuta de espera está ativa.');
  }
  function resetConversation() {
    stopHardware(); setBusy(false); setListening(false); setText('');
    turnsRef.current = []; setTurns([]);
  }
  useEffect(() => {
    resetConversation();
    const onVisibility = () => { if (document.visibilityState !== 'visible') endSession(); };
    document.addEventListener('visibilitychange', onVisibility);
    return () => { stopHardware(); document.removeEventListener('visibilitychange', onVisibility); };
  }, [session?.user.id]);

  function armIdleTimeout() {
    clearTimeout(idle.current);
    idle.current = setTimeout(endSession, 120000);
  }
  function captureNext() {
    if (!gate.current.isActive() || busyRef.current || recognition.current || document.visibilityState !== 'visible') return;
    const browser = window as VoiceWindow;
    const Constructor = browser.SpeechRecognition || browser.webkitSpeechRecognition;
    if (!Constructor) { endSession(); setStatus('Este navegador não oferece reconhecimento de voz. O texto continua disponível.'); return; }
    const rec = new Constructor(); const ticket = gate.current.ticket();
    recognition.current = rec;
    rec.lang = 'pt-BR'; rec.continuous = false; rec.interimResults = false;
    rec.onresult = event => {
      if (!gate.current.isCurrent(ticket)) return;
      const fragments: string[] = [];
      for (let i = event.resultIndex; i < event.results.length; i++) {
        if (event.results[i].isFinal) fragments.push(event.results[i][0].transcript);
      }
      const decision = gate.current.accept(fragments.join(' '));
      if (decision.kind === 'stop') { endSession(); return; }
      if (decision.kind === 'message') { armIdleTimeout(); sendRef.current(decision.text); }
    };
    rec.onerror = event => {
      if (!gate.current.isCurrent(ticket)) return;
      if (event.error === 'no-speech' || event.error === 'aborted') return;
      endSession(); setStatus('A captura de voz foi interrompida. Verifique a permissão do microfone e a conexão.');
    };
    rec.onend = () => {
      if (recognition.current === rec) recognition.current = null;
      if (gate.current.isCurrent(ticket) && !busyRef.current) restart.current = setTimeout(captureNext, 250);
    };
    try { rec.start(); setListening(true); setStatus('Ouvindo nesta sessão. Diga “Jarvis, encerrar” para desligar.'); }
    catch { endSession(); setStatus('O microfone não pôde iniciar. Nenhuma escuta foi mantida.'); }
  }

  async function send(message: string) {
    if (!session?.access_token || !message.trim() || busyRef.current) return;
    const id = ++requestEpoch.current;
    const controller = new AbortController(); request.current = controller;
    busyRef.current = true; setBusy(true); setListening(false);
    const old = recognition.current; recognition.current = null;
    if (old) { old.onend = null; old.onresult = null; old.onerror = null; try { old.abort(); } catch { /* stopped */ } }
    window.speechSynthesis?.cancel();
    const history = boundedHistory(turnsRef.current);
    turnsRef.current = [...turnsRef.current, { role: 'user', content: message }];
    setTurns(turnsRef.current); setText(''); setStatus('Consultando o assessor. Armazenamento ainda não confirmado.');
    const resume = () => {
      speechResume.current = null;
      if (requestEpoch.current !== id) return;
      busyRef.current = false; setBusy(false);
      if (gate.current.isActive()) { armIdleTimeout(); captureNext(); }
    };
    try {
      const response = await fetch('/api/jarvis-chat', {
        method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session.access_token}` },
        body: JSON.stringify({ message, mode, history, remember: mode === 'private' && remember }), signal: controller.signal
      });
      const data = await response.json();
      if (requestEpoch.current !== id || controller.signal.aborted) return;
      const savedMessage = data.persisted === true ? 'Fala confirmada no cofre.' : 'Fala não salva no cofre.';
      if (data.persisted === true) onSaved();
      if (!response.ok || data.ok !== true || typeof data.answer !== 'string') {
        throw new Error(`${typeof data.error === 'string' ? data.error : 'A conversa não foi concluída.'} ${savedMessage}`);
      }
      turnsRef.current = [...turnsRef.current, { role: 'assistant', content: data.answer }]; setTurns(turnsRef.current);
      const warnings = Array.isArray(data.warnings) ? data.warnings.filter((item: unknown) => typeof item === 'string').join(' ') : '';
      setStatus(`${savedMessage} ${warnings} Resposta de análise/rascunho; nenhuma ação externa executada.`);
      if (voiceReply && 'speechSynthesis' in window) {
        const speech = new SpeechSynthesisUtterance(data.answer); speech.lang = 'pt-BR';
        speechResume.current = resume; speech.onend = resume; speech.onerror = resume;
        window.speechSynthesis.speak(speech);
      } else resume();
    } catch (error) {
      if (requestEpoch.current !== id || controller.signal.aborted) return;
      // A provider/network failure must not restart listening unnoticed.
      endSession();
      setStatus(error instanceof Error ? error.message : 'Falha na conversa. Verifique a gravação no cofre antes de considerar a ideia salva.');
    }
  }
  sendRef.current = message => { void send(message); };

  function changeMode(next: Mode) {
    resetConversation(); setMode(next); onModeChange(next);
    setStatus(next === 'public' ? 'Sessão pública nova. O servidor não consultará nem gravará memórias privadas.' : 'Sessão privada nova. Microfone desligado.');
  }
  function startVoice() {
    if (!session || !gate.current.start(consent)) return;
    setVoiceReply(true); armIdleTimeout(); captureNext();
  }

  return <section className="panel command-panel" aria-labelledby="jarvis-conversation-title">
    <div className="panel-heading"><div><span className="eyebrow">ASSESSOR PESSOAL · PILOTO</span>
      <h2 id="jarvis-conversation-title">Converse com o Jarvis</h2></div>
      <span className="status-badge">{listening ? 'MICROFONE ATIVO' : 'MICROFONE DESLIGADO'}</span></div>
    <p>Uma conversa, especialistas selecionados no servidor e continuidade pelo cofre privado.</p>
    <div className="button-row" role="group" aria-label="Privacidade da conversa">
      <button className="button button-secondary" aria-pressed={mode === 'private'} onClick={() => changeMode('private')}>Privado</button>
      <button className="button button-secondary" aria-pressed={mode === 'public'} onClick={() => changeMode('public')}>Público · sem cofre</button>
      <button className="button button-secondary" onClick={() => { resetConversation(); setStatus('Nova conversa. Microfone desligado.'); }}>Nova conversa</button>
    </div>
    {!session && <p role="status">Entre no cofre acima. A conversa com IA exige uma conta autorizada no piloto.</p>}
    <div role="log" aria-label="Conversa" aria-live="polite" style={{ maxHeight: '55vh', overflowY: 'auto' }}>
      {turns.map((turn, index) => <article key={index} style={{ margin: '1rem 0', padding: '1rem', border: '1px solid #52525b', borderRadius: '0.75rem' }}>
        <strong>{turn.role === 'user' ? 'Você' : 'Jarvis'}</strong>
        <p style={{ whiteSpace: 'pre-wrap', overflowWrap: 'anywhere' }}>{turn.content}</p>
      </article>)}
    </div>
    <form onSubmit={event => { event.preventDefault(); void send(text); }}>
      <label htmlFor="jarvis-message">Fale do seu jeito</label>
      <textarea id="jarvis-message" rows={4} maxLength={8000} value={text} disabled={!session || busy}
        onChange={event => setText(event.target.value)} placeholder="Jarvis, preciso de ajuda com…" />
      {mode === 'private' && <label style={{ display: 'block', margin: '0.75rem 0' }}>
        <input type="checkbox" checked={remember} onChange={event => setRemember(event.target.checked)} /> Guardar minhas novas falas no cofre privado
      </label>}
      <label style={{ display: 'block', margin: '0.75rem 0' }}>
        <input type="checkbox" checked={voiceReply} onChange={event => { setVoiceReply(event.target.checked); if (!event.target.checked) { const resume = speechResume.current; speechResume.current = null; window.speechSynthesis?.cancel(); resume?.(); } }} /> Responder em voz alta
      </label>
      <div className="button-row"><button className="button" type="submit" disabled={!session || busy || !text.trim()}>{busy ? 'Consultando…' : 'Enviar'}</button>
        <button className="button button-secondary" type="button" onClick={endSession}>Encerrar e desligar microfone</button></div>
    </form>
    <details style={{ marginTop: '1rem' }}><summary>Voz nesta etapa de teste</summary>
      <p>A escuta começa por botão, apenas com esta página visível. O reconhecimento do navegador pode enviar áudio ao serviço dele. Isso NÃO é um detector local da palavra “Jarvis”.</p>
      <label><input type="checkbox" checked={consent} onChange={event => { setConsent(event.target.checked); if (!event.target.checked) endSession(); }} /> Autorizo essa captura durante a sessão</label>
      <div className="button-row"><button className="button" disabled={!session || !consent || busy || listening} onClick={startVoice}>Iniciar conversa por voz</button></div>
      <p>“Jarvis, encerrar” desliga a captura. Ocultar a página ou ficar dois minutos sem interação também encerra. Ativação com tela bloqueada, voz biométrica e chamada de vídeo ainda não estão implementadas.</p>
    </details>
    <p className="status-text" role="status">{status}</p>
  </section>;
}
