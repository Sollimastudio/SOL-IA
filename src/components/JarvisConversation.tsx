import { useEffect, useRef, useState } from 'react';
import type { Session } from '@supabase/supabase-js';
import { createVoiceSession } from '../core/voiceSession.mjs';
import { prepareJarvisSpeech } from '../core/jarvisSpeech';
import { getCurrentSession, refreshCurrentSession } from '../services/authService';
import { sendAuthenticatedChat, UnsentMessageError } from '../services/authenticatedChat.mjs';

type Mode = 'private' | 'public';
type Turn = { role: 'user' | 'assistant'; content: string; specialist?: string; isError?: boolean; modelUsed?: string };
type Recognition = {
  lang: string; continuous: boolean; interimResults: boolean;
  onresult: ((event: { resultIndex: number; results: ArrayLike<{ isFinal: boolean; 0: { transcript: string } }> }) => void) | null;
  onend: (() => void) | null;
  onerror: ((event: { error: string }) => void) | null;
  start(): void; abort(): void;
};
type VoiceWindow = Window & { SpeechRecognition?: new () => Recognition; webkitSpeechRecognition?: new () => Recognition };

const specialistLabels: Record<string, string> = {
  jarvis_executive: 'ASSESSORIA EXECUTIVA',
  vault_memory: 'MEMÓRIA & CONTINUIDADE',
  publisher_editorial: 'EDITORIAL',
  chronoscribe_content: 'CONTEÚDO & COPY',
  mentor_posicionamento: 'MENTORIA & AUTORREFLEXÃO',
  motion_video: 'AUDIOVISUAL',
  meta_ads_strategist: 'TRÁFEGO & PERFORMANCE',
  lex_vanguard: 'APOIO JURÍDICO',
  daily_guardian: 'ROTINA & CONTINUIDADE'
};

function boundedHistory(turns: Turn[]): Array<{ role: 'user' | 'assistant'; content: string }> {
  const result: Array<{ role: 'user' | 'assistant'; content: string }> = [];
  let size = 0;
  for (const turn of turns.filter(turn => !turn.isError).slice(-10).reverse()) {
    const content = turn.content.slice(0, 3500);
    if (size + content.length > 10000) break;
    result.unshift({ role: turn.role, content });
    size += content.length;
  }
  return result;
}

export function JarvisConversation({ session, onModeChange, onSaved }: {
  session: Session | null; onModeChange(mode: Mode): void; onSaved(): void;
}) {
  const [mode, setMode] = useState<Mode>('private');
  const [text, setText] = useState('');
  const [turns, setTurns] = useState<Turn[]>([]);
  const [status, setStatus] = useState('Conta conectada. Envie uma mensagem para iniciar. Microfone desligado.');
  const [busy, setBusy] = useState(false);
  const [accessState, setAccessState] = useState<'local' | 'verified' | 'check'>('local');
  const [listening, setListening] = useState(false);
  const [consent, setConsent] = useState(false);
  const [voiceReply, setVoiceReply] = useState(false);
  // Private conversations preserve the user's own statements by default; the user can still pause capture.
  const [remember, setRemember] = useState(true);
  const [activeSpecialist, setActiveSpecialist] = useState('jarvis_executive');
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
  const speechWatchdog = useRef<ReturnType<typeof setTimeout> | undefined>();

  function stopVoiceHardware() {
    clearTimeout(restart.current); clearTimeout(idle.current);
    gate.current.stop();
    const old = recognition.current; recognition.current = null;
    if (old) { old.onresult = null; old.onend = null; old.onerror = null; try { old.abort(); } catch { /* already stopped */ } }
    clearTimeout(speechWatchdog.current);
    speechResume.current = null; window.speechSynthesis?.cancel();
  }
  function stopHardware() {
    stopVoiceHardware();
    request.current?.abort(); request.current = null;
    requestEpoch.current += 1; busyRef.current = false;
  }
  function endSession() {
    stopHardware(); setBusy(false); setListening(false);
    setStatus('Conversa de voz encerrada. Microfone desligado; nenhuma escuta de espera está ativa.');
  }
  function resetConversation() {
    stopHardware(); setBusy(false); setListening(false); setText(''); setActiveSpecialist('jarvis_executive');
    turnsRef.current = []; setTurns([]);
  }
  useEffect(() => {
    resetConversation();
    setAccessState('local');
    const onVisibility = () => {
      if (document.visibilityState !== 'visible') {
        const resumeSpeech = speechResume.current;
        stopVoiceHardware(); setListening(false);
        resumeSpeech?.();
      }
    };
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
      if (decision.kind === 'message') { armIdleTimeout(); sendRef.current(decision.text); return; }
      if (gate.current.isEngaged()) {
        armIdleTimeout();
        setStatus('Jarvis ativado. Pode falar; diga “Jarvis, encerrar” para desligar.');
      }
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
    try {
      rec.start();
      setListening(true);
      setStatus(gate.current.isEngaged()
        ? 'Jarvis ativado. Pode falar; diga “Jarvis, encerrar” para desligar.'
        : 'Sessão de voz em primeiro plano. Diga “Jarvis” para ativar; “Jarvis, encerrar” desliga.');
    }
    catch { endSession(); setStatus('O microfone não pôde iniciar. Nenhuma escuta foi mantida.'); }
  }

  async function send(message: string) {
    if (!session?.access_token || !message.trim() || busyRef.current) return;
    const id = ++requestEpoch.current;
    const controller = new AbortController(); request.current = controller;
    busyRef.current = true; setBusy(true); setListening(false);
    clearTimeout(speechWatchdog.current);
    speechResume.current = null;
    let timedOut = false;
    let knownUnsent = false;
    const deadline = setTimeout(() => { timedOut = true; controller.abort(); }, 90000);
    const old = recognition.current; recognition.current = null;
    if (old) { old.onend = null; old.onresult = null; old.onerror = null; try { old.abort(); } catch { /* stopped */ } }
    window.speechSynthesis?.cancel();
    const history = boundedHistory(turnsRef.current);
    turnsRef.current = [...turnsRef.current, { role: 'user', content: message }];
    setTurns(turnsRef.current); setText(''); setStatus('Jarvis analisando e encaminhando ao especialista adequado…');
    const resume = () => {
      clearTimeout(speechWatchdog.current);
      speechResume.current = null;
      if (requestEpoch.current !== id) return;
      busyRef.current = false; setBusy(false);
      if (gate.current.isActive()) { armIdleTimeout(); captureNext(); }
    };
    try {
      const response = await sendAuthenticatedChat({
        userId: session.user.id, getSession: getCurrentSession, refreshSession: refreshCurrentSession,
        body: JSON.stringify({ message, mode, history, remember: mode === 'private' && remember }), signal: controller.signal
      });
      if (!response.headers.get('content-type')?.includes('application/json')) {
        throw new Error('A hospedagem devolveu uma página de acesso em vez da resposta da IA. Não apague sua sessão nem peça vários códigos.');
      }
      const data = await response.json();
      clearTimeout(deadline);
      if (!data || typeof data !== 'object') throw new Error('O servidor devolveu uma resposta inválida. Seu login não foi alterado.');
      if (requestEpoch.current !== id || controller.signal.aborted) return;
      const savedMessage = data.persisted === true ? 'Fala confirmada no cofre.'
        : data.persisted === false ? 'Fala não salva no cofre.' : 'Gravação não confirmada; confira o cofre antes de reenviar.';
      if (data.persisted === true) onSaved();
      if (!response.ok || data.ok !== true || typeof data.answer !== 'string') {
        knownUnsent = data.stage === 'access' && data.persisted === false;
        if (knownUnsent) setAccessState('check');
        throw new Error(`${typeof data.error === 'string' ? data.error : 'A conversa não foi concluída.'} ${savedMessage}`);
      }
      setAccessState('verified');
      const specialist = typeof data.specialist === 'string' ? data.specialist : 'jarvis_executive';
      setActiveSpecialist(specialist);
      turnsRef.current = [...turnsRef.current, { role: 'assistant', content: data.answer, specialist, modelUsed: typeof data.modelUsed === 'string' ? data.modelUsed : undefined }]; setTurns(turnsRef.current);
      const warnings = Array.isArray(data.warnings) ? data.warnings.filter((item: unknown) => typeof item === 'string').join(' ') : '';
      setStatus(`${savedMessage} ${warnings} ${specialistLabels[specialist] ?? 'ASSESSORIA'} respondeu. Nenhuma ação externa foi declarada sem execução.`);
      if (voiceReply && document.visibilityState === 'visible' && 'speechSynthesis' in window) {
        const speech = prepareJarvisSpeech(new SpeechSynthesisUtterance(data.answer));
        speechResume.current = resume; speech.onend = resume; speech.onerror = resume;
        speechWatchdog.current = setTimeout(() => { window.speechSynthesis.cancel(); resume(); }, 60000);
        window.speechSynthesis.speak(speech);
      } else resume();
    } catch (error) {
      if (requestEpoch.current !== id || (controller.signal.aborted && !timedOut)) return;
      if (knownUnsent || error instanceof UnsentMessageError) {
        setText(message);
        setAccessState('check');
        turnsRef.current = turnsRef.current.map((turn, index) => index === turnsRef.current.length - 1 ? { ...turn, isError: true } : turn);
      }
      const errorMessage = timedOut ? 'A resposta demorou demais. O envio foi interrompido; a gravação não está confirmada. Confira o cofre antes de reenviar uma ideia.' : error instanceof Error ? error.message : 'Falha na conversa. Confira o cofre antes de considerar a ideia salva.';
      setActiveSpecialist('jarvis_executive');
      turnsRef.current = [...turnsRef.current, { role: 'assistant', content: errorMessage, isError: true }];
      setTurns(turnsRef.current);
      endSession();
      setStatus(errorMessage);
    } finally {
      clearTimeout(deadline);
    }
  }
  sendRef.current = message => { void send(message); };

  function changeMode(next: Mode) {
    resetConversation(); setMode(next); onModeChange(next);
    setStatus(next === 'public' ? 'Modo Performance iniciado. O cofre privado fica fora desta conversa.' : 'Modo privado iniciado. Memória automática das suas falas ligada por padrão.');
  }
  function startVoice() {
    if (!session || !gate.current.start(true)) return;
    setConsent(true);
    setVoiceReply(true); armIdleTimeout(); captureNext();
  }

  return <section className="neural-assessor" aria-labelledby="jarvis-conversation-title">
    <div className="neural-grid" aria-hidden="true" />
    <header className="neural-toolbar">
      <div className="neural-brand">
        <div className={`neural-orb ${busy ? 'thinking' : ''} ${listening ? 'listening' : ''}`}><span /></div>
        <div><span className="eyebrow">SOL.IA · SISTEMA NEURAL</span><h2 id="jarvis-conversation-title">JARVIS</h2><small>ASSESSOR PESSOAL · PORTA ÚNICA</small></div>
      </div>
      <div className="neural-indicators">
        <span className={`neural-pill ${session && accessState === 'verified' ? 'online' : ''}`}>{!session ? 'ACESSO BLOQUEADO' : accessState === 'verified' ? 'ACESSO VALIDADO' : accessState === 'check' ? 'ACESSO A VERIFICAR' : 'SESSÃO LOCAL'}</span>
        <span className={`neural-pill ${listening ? 'mic-live' : ''}`}>{listening ? 'MIC ATIVO' : 'MIC OFF'}</span>
        <span className="neural-pill specialist">{specialistLabels[activeSpecialist] ?? 'ASSESSORIA EXECUTIVA'}</span>
      </div>
    </header>

    <div className="neural-modebar" role="group" aria-label="Privacidade da conversa">
      <button className={mode === 'private' ? 'active' : ''} aria-pressed={mode === 'private'} onClick={() => changeMode('private')}>PRIVADO</button>
      <button className={mode === 'public' ? 'active public' : ''} aria-pressed={mode === 'public'} onClick={() => changeMode('public')}>MODO PERFORMANCE</button>
      <button onClick={() => { resetConversation(); setStatus('Nova conversa. Microfone desligado.'); }}>NOVA CONVERSA</button>
      <div className="neural-mode-spacer" />
      <span>{mode === 'public' ? 'Sem acesso ao cofre privado' : 'Memória privada isolada por usuário'}</span>
    </div>

    <div className="neural-stage">
      <aside className="neural-rail" aria-label="Departamentos do Jarvis">
        <span>JARVIS</span><span>MEMÓRIA</span><span>EDITORIAL</span><span>CONTEÚDO</span><span>TRÁFEGO</span><span>JURÍDICO</span><span>VÍDEO</span><span>ROTINA</span>
        <small>O roteamento é automático. Você não precisa escolher agente.</small>
      </aside>

      <div className="neural-chat">
        {!session && <div className="neural-empty"><strong>ASSISTENTE EM ESPERA</strong><p>Entre no cofre seguro acima para habilitar a conversa privada com memória. Nenhuma chave de IA é entregue ao navegador.</p></div>}
        {session && turns.length === 0 && <div className="neural-empty"><strong>CONTA CONECTADA</strong><p>Fale como você fala. No modo privado, suas falas são guardadas no cofre por padrão; eu recupero contexto permitido e encaminho internamente para o especialista adequado.</p><div className="neural-suggestions"><button onClick={() => setText('Jarvis, organize minhas prioridades de hoje.')}>Organizar meu dia</button><button onClick={() => setText('Jarvis, continue meu projeto mais importante do ponto onde paramos.')}>Retomar projeto</button><button onClick={() => setText('Jarvis, tive uma ideia. Analise o potencial e me diga onde ela se encaixa.')}>Guardar uma ideia</button></div></div>}
        <div className="neural-log" role="log" aria-label="Conversa" aria-live="polite">
          {turns.map((turn, index) => <article key={index} className={`neural-message ${turn.role}`}>
            <div className="neural-message-head"><strong>{turn.role === 'user' ? 'SOL' : turn.isError ? 'AVISO DO SISTEMA' : 'JARVIS'}</strong>{turn.specialist && <span>{specialistLabels[turn.specialist] ?? turn.specialist}</span>}</div>
            <p>{turn.content}</p>
            {turn.modelUsed && <small>Modelo: {turn.modelUsed}</small>}
          </article>)}
          {busy && <article className="neural-message assistant thinking-card"><div className="neural-message-head"><strong>JARVIS</strong><span>ORQUESTRANDO</span></div><p className="neural-thinking"><i /><i /><i /> consultando o núcleo seguro…</p></article>}
        </div>
      </div>
    </div>

    <div className="neural-console">
      <form onSubmit={event => { event.preventDefault(); void send(text); }}>
        <div className="neural-input-wrap">
          <button className={`neural-icon-button ${listening ? 'danger' : ''}`} type="button" disabled={!session || busy} onClick={listening ? endSession : startVoice} title={listening ? 'Encerrar voz' : 'Iniciar voz'} aria-label={listening ? 'Encerrar voz' : 'Iniciar voz'}>◉</button>
          <textarea id="jarvis-message" rows={2} maxLength={8000} value={text} disabled={!session || busy} onChange={event => setText(event.target.value)} placeholder={listening ? 'Ouvindo… diga “Jarvis, encerrar” para parar.' : 'Fale com seu assessor…'} />
          <button className="neural-send" type="submit" disabled={!session || busy || !text.trim()}>{busy ? 'ANALISANDO' : 'ENVIAR'}</button>
        </div>
        <div className="neural-options">
          {mode === 'private' && <label><input type="checkbox" checked={remember} onChange={event => setRemember(event.target.checked)} /> Memória automática — guardar minhas falas</label>}
          <label><input type="checkbox" checked={voiceReply} onChange={event => { setVoiceReply(event.target.checked); if (!event.target.checked) { const resume = speechResume.current; speechResume.current = null; window.speechSynthesis?.cancel(); resume?.(); } }} /> Responder em voz alta</label>
          <label><input type="checkbox" checked={consent} onChange={event => { setConsent(event.target.checked); if (!event.target.checked) endSession(); }} /> Autorizar microfone nesta sessão</label>
          <button type="button" onClick={endSession}>ENCERRAR / MIC OFF</button>
        </div>
      </form>
      <p className="neural-status" role="status">{status}</p>
      <details className="neural-disclosure"><summary>Limites desta etapa</summary><p>“Jarvis” funciona como gatilho somente dentro de uma sessão de voz autorizada e com a página em primeiro plano. O reconhecimento depende do navegador e pode usar processamento remoto de áudio; não é detecção local garantida. Ainda não há ativação com tela bloqueada, biometria de voz ou videochamada. O modo público não consulta o cofre privado.</p></details>
    </div>
  </section>;
}
