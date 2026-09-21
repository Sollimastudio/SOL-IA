import { useEffect, useRef, useState } from 'react';
import type { Session } from '@supabase/supabase-js';
import { createVoiceSession } from '../core/voiceSession.mjs';
import { JARVIS_VOICE_PROFILE, prepareJarvisSpeech } from '../core/jarvisSpeech';
import { getCurrentSession, refreshCurrentSession } from '../services/authService';
import { sendAuthenticatedChat, UnsentMessageError } from '../services/authenticatedChat.mjs';
import type { ReferenceIntent } from './ReferenceStudio';

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
type ChatAttachment = {
  id: string;
  kind: 'image' | 'text';
  name: string;
  mimeType: string;
  size: number;
  dataUrl?: string;
  text?: string;
};
type SendOptions = {
  forcedAttachments?: ChatAttachment[];
  rememberOverride?: boolean;
  visibleMessage?: string;
};
type SensoryCommand = 'view' | 'ambient_analyze' | 'ambient_save' | 'ambient_clear' | 'normal';

const MAX_ATTACHMENTS = 3;
const MAX_TEXT_ATTACHMENT_CHARS = 16000;
const MAX_IMAGE_DATA_URL_CHARS = 900000;
const MAX_AMBIENT_CHARS = 12000;
const WAKE_PHRASE = 'Jarvis, tá aí?';
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

function attachmentSummary(attachments: ChatAttachment[]) {
  return attachments.map(item => `📎 ${item.name}`).join('\n');
}

function normalizeVoiceCommand(value: string) {
  return String(value ?? '').normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .toLowerCase().replace(/[.,!?;:]/g, ' ').replace(/\s+/g, ' ').trim()
    .replace(/^jarvis\s+/, '');
}

function sensoryCommand(value: string): SensoryCommand {
  const text = normalizeVoiceCommand(value);
  if (/\b(guarda|guarde|salva|salve)\b.*\b(conversa|ambiente)\b/.test(text)) return 'ambient_save';
  if (/\b(limpa|limpe|apaga|apague)\b.*\b(conversa|ambiente|buffer)\b/.test(text)) return 'ambient_clear';
  if ((/\b(analisa|analise|resume|resuma)\b.*\b(conversa|ambiente)\b/.test(text)) || /\bo que voce percebeu\b/.test(text)) return 'ambient_analyze';
  if ((/\b(olha|olhe|ve|veja|analisa|analise)\b.*\b(isso|isto|aqui|camera|cena)\b/.test(text)) || /\bo que (?:voce )?(?:ve|esta vendo|tem aqui)\b/.test(text)) return 'view';
  return 'normal';
}

async function compressImage(file: File): Promise<string> {
  if (!/^image\/(jpeg|png|webp)$/i.test(file.type)) throw new Error('Use JPG, PNG ou WEBP.');
  const objectUrl = URL.createObjectURL(file);
  try {
    const image = await new Promise<HTMLImageElement>((resolve, reject) => {
      const candidate = new Image();
      candidate.onload = () => resolve(candidate);
      candidate.onerror = () => reject(new Error('Não consegui abrir essa imagem.'));
      candidate.src = objectUrl;
    });
    const maxSide = 1280;
    const scale = Math.min(1, maxSide / Math.max(image.naturalWidth, image.naturalHeight));
    const canvas = document.createElement('canvas');
    canvas.width = Math.max(1, Math.round(image.naturalWidth * scale));
    canvas.height = Math.max(1, Math.round(image.naturalHeight * scale));
    const context = canvas.getContext('2d');
    if (!context) throw new Error('O navegador não conseguiu preparar a imagem.');
    context.drawImage(image, 0, 0, canvas.width, canvas.height);
    let quality = 0.82;
    let dataUrl = canvas.toDataURL('image/jpeg', quality);
    while (dataUrl.length > MAX_IMAGE_DATA_URL_CHARS && quality > 0.5) {
      quality -= 0.08;
      dataUrl = canvas.toDataURL('image/jpeg', quality);
    }
    if (dataUrl.length > MAX_IMAGE_DATA_URL_CHARS) throw new Error('A imagem continua grande demais mesmo após redução.');
    return dataUrl;
  } finally { URL.revokeObjectURL(objectUrl); }
}

async function prepareAttachment(file: File): Promise<ChatAttachment> {
  const id = typeof crypto?.randomUUID === 'function' ? crypto.randomUUID() : `${Date.now()}-${Math.random()}`;
  if (/^image\//i.test(file.type)) {
    return { id, kind: 'image', name: file.name.slice(0, 160), mimeType: 'image/jpeg', size: file.size, dataUrl: await compressImage(file) };
  }
  if (/\.(txt|md|csv|json)$/i.test(file.name) || /^(text\/|application\/json)/i.test(file.type)) {
    const text = await file.text();
    if (!text.trim()) throw new Error(`${file.name}: o arquivo está vazio.`);
    if (text.length > MAX_TEXT_ATTACHMENT_CHARS) throw new Error(`${file.name}: reduza para até ${MAX_TEXT_ATTACHMENT_CHARS.toLocaleString('pt-BR')} caracteres nesta etapa.`);
    return { id, kind: 'text', name: file.name.slice(0, 160), mimeType: file.type || 'text/plain', size: file.size, text };
  }
  throw new Error(`${file.name}: nesta etapa o chat aceita imagens, TXT, Markdown, CSV e JSON. PDF e DOCX entram na próxima camada de importação.`);
}

export function JarvisConversation({ session, onModeChange, onSaved, onReference }: {
  session: Session | null; onModeChange(mode: Mode): void; onSaved(): void;
  onReference?(intent: ReferenceIntent): void;
}) {
  const [mode, setMode] = useState<Mode>('private');
  const [text, setText] = useState('');
  const [turns, setTurns] = useState<Turn[]>([]);
  const [attachments, setAttachments] = useState<ChatAttachment[]>([]);
  const [attachmentBusy, setAttachmentBusy] = useState(false);
  const [status, setStatus] = useState('Conta conectada. Envie uma mensagem para iniciar. Microfone desligado.');
  const [busy, setBusy] = useState(false);
  const [accessState, setAccessState] = useState<'local' | 'verified' | 'check'>('local');
  const [listening, setListening] = useState(false);
  const [consent, setConsent] = useState(false);
  const [voiceReply, setVoiceReply] = useState(true);
  const [remember, setRemember] = useState(true);
  const [activeSpecialist, setActiveSpecialist] = useState('jarvis_executive');
  const [callActive, setCallActive] = useState(false);
  const [ambientMode, setAmbientMode] = useState(false);
  const [ambientCount, setAmbientCount] = useState(0);
  const [cameraFacing, setCameraFacing] = useState<'user' | 'environment'>('user');
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
  const fileInput = useRef<HTMLInputElement | null>(null);
  const videoPreview = useRef<HTMLVideoElement | null>(null);
  const cameraStream = useRef<MediaStream | null>(null);
  const callActiveRef = useRef(false);
  const ambientModeRef = useRef(false);
  const ambientTranscript = useRef<string[]>([]);

  function stopCameraHardware() {
    const stream = cameraStream.current;
    cameraStream.current = null;
    stream?.getTracks().forEach(track => track.stop());
    if (videoPreview.current) videoPreview.current.srcObject = null;
    callActiveRef.current = false;
    setCallActive(false);
  }

  function stopVoiceHardware() {
    clearTimeout(restart.current); clearTimeout(idle.current);
    gate.current.stop();
    const old = recognition.current; recognition.current = null;
    if (old) { old.onresult = null; old.onend = null; old.onerror = null; try { old.abort(); } catch { /* already stopped */ } }
    clearTimeout(speechWatchdog.current);
    speechResume.current = null; window.speechSynthesis?.cancel();
  }

  function stopHardware() {
    stopVoiceHardware(); stopCameraHardware();
    request.current?.abort(); request.current = null;
    requestEpoch.current += 1; busyRef.current = false;
  }

  function endSession() {
    stopHardware(); setBusy(false); setListening(false);
    ambientModeRef.current = false; setAmbientMode(false);
    ambientTranscript.current = []; setAmbientCount(0);
    setStatus('Sessão encerrada. Microfone e câmera desligados; nenhuma escuta de espera está ativa.');
  }

  function resetConversation() {
    stopHardware(); setBusy(false); setListening(false); setText(''); setAttachments([]); setActiveSpecialist('jarvis_executive');
    ambientModeRef.current = false; setAmbientMode(false); ambientTranscript.current = []; setAmbientCount(0);
    turnsRef.current = []; setTurns([]);
  }

  useEffect(() => {
    resetConversation();
    setAccessState('local');
    if ('speechSynthesis' in window) window.speechSynthesis.getVoices();
    const onVisibility = () => {
      if (document.visibilityState !== 'visible') {
        const resumeSpeech = speechResume.current;
        stopVoiceHardware(); stopCameraHardware(); setListening(false);
        ambientModeRef.current = false; setAmbientMode(false);
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

  function acknowledgeWake() {
    setStatus('Tô aqui. Pode falar.');
    try { navigator.vibrate?.(35); } catch { /* optional haptic */ }
  }

  function appendAmbient(textValue: string) {
    const clean = textValue.trim();
    if (!clean) return;
    let next = [...ambientTranscript.current, clean];
    while (next.length > 1 && next.join('\n').length > MAX_AMBIENT_CHARS) next = next.slice(1);
    ambientTranscript.current = next;
    setAmbientCount(next.length);
    armIdleTimeout();
    setStatus(`Modo ambiente temporário: ${next.length} trecho(s) em memória local. Nada foi salvo no Cofre.`);
  }

  async function captureCameraFrame(): Promise<ChatAttachment> {
    const video = videoPreview.current;
    if (!callActiveRef.current || !video || !video.videoWidth || !video.videoHeight) throw new Error('A câmera ainda não está pronta para análise.');
    const maxSide = 1280;
    const scale = Math.min(1, maxSide / Math.max(video.videoWidth, video.videoHeight));
    const canvas = document.createElement('canvas');
    canvas.width = Math.max(1, Math.round(video.videoWidth * scale));
    canvas.height = Math.max(1, Math.round(video.videoHeight * scale));
    const context = canvas.getContext('2d');
    if (!context) throw new Error('Não consegui preparar o quadro da câmera.');
    context.drawImage(video, 0, 0, canvas.width, canvas.height);
    let quality = 0.82;
    let dataUrl = canvas.toDataURL('image/jpeg', quality);
    while (dataUrl.length > MAX_IMAGE_DATA_URL_CHARS && quality > 0.5) {
      quality -= 0.08;
      dataUrl = canvas.toDataURL('image/jpeg', quality);
    }
    if (dataUrl.length > MAX_IMAGE_DATA_URL_CHARS) throw new Error('O quadro da câmera ficou grande demais para análise.');
    return {
      id: typeof crypto?.randomUUID === 'function' ? crypto.randomUUID() : `${Date.now()}-camera`,
      kind: 'image', name: `camera-${Date.now()}.jpg`, mimeType: 'image/jpeg', size: dataUrl.length, dataUrl
    };
  }

  async function startCamera(facing: 'user' | 'environment') {
    if (!navigator.mediaDevices?.getUserMedia) {
      setStatus('Este navegador não oferece câmera para o modo chamada.');
      return false;
    }
    cameraStream.current?.getTracks().forEach(track => track.stop());
    cameraStream.current = null;
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: facing }, width: { ideal: 1280 }, height: { ideal: 720 } }, audio: false
      });
      cameraStream.current = stream;
      callActiveRef.current = true; setCallActive(true); setCameraFacing(facing);
      if (videoPreview.current) {
        videoPreview.current.srcObject = stream;
        await videoPreview.current.play().catch(() => undefined);
      }
      return true;
    } catch {
      stopCameraHardware(); setStatus('A câmera não pôde iniciar. Confira a permissão do aparelho.'); return false;
    }
  }

  async function startVideoCall() {
    if (!session || busyRef.current) return;
    ambientModeRef.current = false; setAmbientMode(false); ambientTranscript.current = []; setAmbientCount(0);
    const cameraOk = await startCamera('user');
    if (!cameraOk) return;
    if (!gate.current.isActive()) startVoice();
    setStatus(`Videochamada iniciada. Diga “${WAKE_PHRASE}”. Depois use “Jarvis, olha isso” quando quiser analisar o quadro atual.`);
  }

  async function switchCamera() {
    if (!callActiveRef.current) return;
    await startCamera(cameraFacing === 'user' ? 'environment' : 'user');
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
      for (let i = event.resultIndex; i < event.results.length; i++) if (event.results[i].isFinal) fragments.push(event.results[i][0].transcript);
      const transcript = fragments.join(' ').trim();
      const wasEngaged = gate.current.isEngaged();
      const decision = gate.current.accept(transcript);
      if (decision.kind === 'stop') { endSession(); return; }
      if (!wasEngaged && gate.current.isEngaged()) acknowledgeWake();
      if (decision.kind === 'message') {
        armIdleTimeout();
        const command = sensoryCommand(decision.text);
        if (command === 'view') { void analyzeCurrentView(decision.text); return; }
        if (command === 'ambient_analyze') { void analyzeAmbient(false); return; }
        if (command === 'ambient_save') { void analyzeAmbient(true); return; }
        if (command === 'ambient_clear') {
          ambientTranscript.current = []; setAmbientCount(0); setStatus('Buffer temporário do ambiente limpo. Nada foi salvo.'); return;
        }
        if (ambientModeRef.current) { appendAmbient(decision.text); return; }
        sendRef.current(decision.text); return;
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
      rec.start(); setListening(true);
      if (!gate.current.isEngaged()) setStatus(`Escuta de espera ativa. Diga “${WAKE_PHRASE}” para falar comigo.`);
      else if (ambientModeRef.current) setStatus(`Modo ambiente temporário ativo. ${ambientTranscript.current.length} trecho(s) locais; nada é salvo automaticamente.`);
      else setStatus('Conversa de voz ativa. Diga “encerrar” quando quiser desligar o microfone.');
    } catch { endSession(); setStatus('O microfone não pôde iniciar. Nenhuma escuta foi mantida.'); }
  }

  async function addAttachments(files?: FileList | null) {
    if (!files?.length || attachmentBusy) return;
    const room = Math.max(0, MAX_ATTACHMENTS - attachments.length);
    if (!room) { setStatus(`O chat aceita até ${MAX_ATTACHMENTS} anexos por mensagem nesta etapa.`); return; }
    setAttachmentBusy(true);
    try {
      const next: ChatAttachment[] = [];
      for (const file of Array.from(files).slice(0, room)) next.push(await prepareAttachment(file));
      setAttachments(current => [...current, ...next]);
      setStatus(`${next.length} anexo(s) pronto(s). Você pode escrever uma instrução ou enviar apenas os anexos.`);
    } catch (error) { setStatus(error instanceof Error ? error.message : 'Não consegui preparar o anexo.'); }
    finally { setAttachmentBusy(false); if (fileInput.current) fileInput.current.value = ''; }
  }

  async function send(message: string, options: SendOptions = {}) {
    const currentAttachments = options.forcedAttachments ?? attachments;
    const normalizedMessage = message.trim() || (currentAttachments.length ? 'Analise os anexos desta mensagem.' : '');
    if (!session?.access_token || !normalizedMessage || busyRef.current || attachmentBusy) return;
    const referenceLink = normalizedMessage.match(/https:\/\/[^\s<>]+/)?.[0];
    if (mode === 'private' && onReference && referenceLink && !currentAttachments.length &&
      (normalizedMessage === referenceLink || /\b(entenda|transcreva|analise|leia|crie|serie|roteiros|referencia)\b/.test(normalizeVoiceCommand(normalizedMessage)))) {
      stopHardware();
      onReference({ id: crypto.randomUUID(), message: normalizedMessage, url: referenceLink.replace(/[.,;)]+$/, '') });
      return;
    }
    const id = ++requestEpoch.current;
    const controller = new AbortController(); request.current = controller;
    busyRef.current = true; setBusy(true); setListening(false);
    clearTimeout(speechWatchdog.current); speechResume.current = null;
    let timedOut = false; let knownUnsent = false;
    const deadline = setTimeout(() => { timedOut = true; controller.abort(); }, 90000);
    const old = recognition.current; recognition.current = null;
    if (old) { old.onend = null; old.onresult = null; old.onerror = null; try { old.abort(); } catch { /* stopped */ } }
    window.speechSynthesis?.cancel();
    const history = boundedHistory(turnsRef.current);
    const displayText = options.visibleMessage ?? normalizedMessage;
    const visibleMessage = currentAttachments.length ? `${displayText}\n${attachmentSummary(currentAttachments)}` : displayText;
    turnsRef.current = [...turnsRef.current, { role: 'user', content: visibleMessage }];
    setTurns(turnsRef.current); setText(''); setStatus('Jarvis analisando e encaminhando ao especialista adequado…');
    const resume = () => {
      clearTimeout(speechWatchdog.current); speechResume.current = null;
      if (requestEpoch.current !== id) return;
      busyRef.current = false; request.current = null; setBusy(false);
      if (gate.current.isActive()) { armIdleTimeout(); captureNext(); }
    };
    try {
      const response = await sendAuthenticatedChat({
        userId: session.user.id, getSession: getCurrentSession, refreshSession: refreshCurrentSession,
        body: JSON.stringify({
          message: normalizedMessage, mode, history,
          remember: mode === 'private' && (options.rememberOverride ?? remember),
          attachments: currentAttachments.map(({ id: _id, size: _size, ...item }) => item)
        }), signal: controller.signal
      });
      if (!response.headers.get('content-type')?.includes('application/json')) throw new Error('A hospedagem devolveu uma página de acesso em vez da resposta da IA. Não apague sua sessão nem peça vários códigos.');
      const data = await response.json(); clearTimeout(deadline);
      if (!data || typeof data !== 'object') throw new Error('O servidor devolveu uma resposta inválida. Seu login não foi alterado.');
      if (requestEpoch.current !== id || controller.signal.aborted) return;
      const savedMessage = data.persisted === true ? 'Fala confirmada no cofre.' : data.persisted === false ? 'Fala não salva no cofre.' : 'Gravação não confirmada; confira o cofre antes de reenviar.';
      if (data.persisted === true) onSaved();
      if (!response.ok || data.ok !== true || typeof data.answer !== 'string') {
        knownUnsent = data.stage === 'access' && data.persisted === false;
        if (knownUnsent) setAccessState('check');
        throw new Error(`${typeof data.error === 'string' ? data.error : 'A conversa não foi concluída.'} ${savedMessage}`);
      }
      if (!options.forcedAttachments) setAttachments([]);
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
        if (!options.visibleMessage) setText(message);
        setAccessState('check');
        turnsRef.current = turnsRef.current.map((turn, index) => index === turnsRef.current.length - 1 ? { ...turn, isError: true } : turn);
      }
      const errorMessage = timedOut ? 'A resposta demorou demais. O envio foi interrompido; a gravação não está confirmada. Confira o cofre antes de reenviar uma ideia.' : error instanceof Error ? error.message : 'Falha na conversa. Confira o cofre antes de considerar a ideia salva.';
      setActiveSpecialist('jarvis_executive');
      turnsRef.current = [...turnsRef.current, { role: 'assistant', content: errorMessage, isError: true }]; setTurns(turnsRef.current);
      busyRef.current = false; request.current = null;
      stopVoiceHardware(); setBusy(false); setListening(false); setStatus(errorMessage);
    } finally { clearTimeout(deadline); }
  }

  async function analyzeCurrentView(command = 'O que você vê agora?') {
    if (!callActiveRef.current) { setStatus('Para eu olhar o ambiente, inicie a VIDEOCHAMADA primeiro.'); return; }
    try {
      const frame = await captureCameraFrame();
      await send(`Estou em uma chamada com a Sol. Analise somente o quadro atual da câmera anexado e responda ao pedido: ${command}. Descreva apenas o que está visível e relevante. Não tente identificar pessoas e não infira características sensíveis. Se algo não estiver claro, diga que não está claro.`, { forcedAttachments: [frame], rememberOverride: false, visibleMessage: 'Analisar o que estou mostrando pela câmera' });
    } catch (error) { setStatus(error instanceof Error ? error.message : 'Não consegui analisar o quadro atual.'); }
  }

  async function analyzeAmbient(save: boolean) {
    const transcript = ambientTranscript.current.join('\n').trim();
    if (!transcript) { setStatus('O modo ambiente ainda não capturou nenhum trecho para analisar.'); return; }
    const instruction = save ? 'A usuária pediu explicitamente para guardar esta conversa depois da análise.' : 'Esta transcrição é temporária: não a transforme em memória pessoal nem em fato permanente.';
    await send(`Analise a transcrição temporária abaixo como contexto de ambiente/conversa. ${instruction} Separe observações do texto de hipóteses. Não diagnostique, não tente reconhecer pessoas pela voz e não atribua fala a um locutor específico sem indicação textual.\n\nTRANSCRICAO_TEMPORARIA:\n${transcript}`, { rememberOverride: save, visibleMessage: save ? `Analisar e guardar conversa ambiente (${ambientTranscript.current.length} trechos)` : `Analisar conversa ambiente (${ambientTranscript.current.length} trechos temporários)` });
  }

  sendRef.current = message => { void send(message); };

  function changeMode(next: Mode) {
    resetConversation(); setMode(next); onModeChange(next);
    setStatus(next === 'public' ? 'Modo Performance iniciado. O cofre privado fica fora desta conversa.' : 'Modo privado iniciado. Memória automática das suas falas ligada por padrão.');
  }

  function startVoice() {
    if (!session || gate.current.isActive() || !gate.current.start(true)) return;
    setConsent(true); armIdleTimeout(); setStatus(`Escuta de espera autorizada. Diga “${WAKE_PHRASE}” para ativar a conversa.`); captureNext();
  }

  function toggleAmbient() {
    const next = !ambientModeRef.current;
    ambientModeRef.current = next; setAmbientMode(next);
    if (next) {
      ambientTranscript.current = []; setAmbientCount(0);
      if (!gate.current.isActive()) startVoice();
      setStatus(`Modo ambiente temporário ligado. Diga “${WAKE_PHRASE}” para começar. As falas ficam apenas no buffer local até você pedir análise ou salvamento.`);
    } else { ambientTranscript.current = []; setAmbientCount(0); setStatus('Modo ambiente desligado e buffer temporário apagado.'); }
  }

  return <section className="neural-assessor" aria-labelledby="jarvis-conversation-title">
    <div className="neural-grid" aria-hidden="true" />
    <header className="neural-toolbar">
      <div className="neural-brand"><div className={`neural-orb ${busy ? 'thinking' : ''} ${listening ? 'listening' : ''}`}><span /></div><div><span className="eyebrow">SOL.IA · SISTEMA NEURAL</span><h2 id="jarvis-conversation-title">JARVIS</h2><small>ASSESSOR PESSOAL · PORTA ÚNICA</small></div></div>
      <div className="neural-indicators">
        <span className={`neural-pill ${session && accessState === 'verified' ? 'online' : ''}`}>{!session ? 'ACESSO BLOQUEADO' : accessState === 'verified' ? 'ACESSO VALIDADO' : accessState === 'check' ? 'ACESSO A VERIFICAR' : 'SESSÃO LOCAL'}</span>
        <span className={`neural-pill ${listening ? 'mic-live' : ''}`}>{listening ? 'MIC ATIVO' : 'MIC OFF'}</span>
        <span className={`neural-pill ${callActive ? 'online' : ''}`}>{callActive ? 'CAM ATIVA' : 'CAM OFF'}</span>
        <span className="neural-pill">VOZ · {JARVIS_VOICE_PROFILE.label.toUpperCase()}</span><span className="neural-pill">LOCUTOR NÃO VERIFICADO</span><span className="neural-pill specialist">{specialistLabels[activeSpecialist] ?? 'ASSESSORIA EXECUTIVA'}</span>
      </div>
    </header>
    <div className="neural-modebar" role="group" aria-label="Privacidade da conversa">
      <button className={mode === 'private' ? 'active' : ''} aria-pressed={mode === 'private'} onClick={() => changeMode('private')}>PRIVADO</button>
      <button className={mode === 'public' ? 'active public' : ''} aria-pressed={mode === 'public'} onClick={() => changeMode('public')}>MODO PERFORMANCE</button>
      <button onClick={() => { resetConversation(); setStatus('Nova conversa. Microfone e câmera desligados.'); }}>NOVA CONVERSA</button><div className="neural-mode-spacer" /><span>{mode === 'public' ? 'Sem acesso ao cofre privado' : 'Memória privada isolada por usuário'}</span>
    </div>
    <div className="neural-stage">
      <aside className="neural-rail" aria-label="Departamentos do Jarvis"><span>JARVIS</span><span>MEMÓRIA</span><span>EDITORIAL</span><span>CONTEÚDO</span><span>TRÁFEGO</span><span>JURÍDICO</span><span>VÍDEO</span><span>ROTINA</span><small>O roteamento é automático. Você não precisa escolher agente.</small></aside>
      <div className="neural-chat">
        {!session && <div className="neural-empty"><strong>ASSISTENTE EM ESPERA</strong><p>Entre no cofre seguro acima para habilitar a conversa privada com memória. Nenhuma chave de IA é entregue ao navegador.</p></div>}
        {session && turns.length === 0 && <div className="neural-empty"><strong>CONTA CONECTADA</strong><p>Digite, anexe ou ligue a escuta. Para voz contínua em primeiro plano, toque no microfone e diga “{WAKE_PHRASE}”.</p><div className="neural-suggestions"><button onClick={() => setText('Jarvis, organize minhas prioridades de hoje.')}>Organizar meu dia</button><button onClick={() => setText('Jarvis, continue meu projeto mais importante do ponto onde paramos.')}>Retomar projeto</button><button onClick={() => setText('Jarvis, tive uma ideia. Analise o potencial e me diga onde ela se encaixa.')}>Guardar uma ideia</button></div></div>}
        <div className="neural-log" role="log" aria-label="Conversa" aria-live="polite">
          {turns.map((turn, index) => <article key={index} className={`neural-message ${turn.role}`}><div className="neural-message-head"><strong>{turn.role === 'user' ? 'SOL' : turn.isError ? 'AVISO DO SISTEMA' : 'JARVIS'}</strong>{turn.specialist && <span>{specialistLabels[turn.specialist] ?? turn.specialist}</span>}</div><p>{turn.content}</p>{turn.modelUsed && <small>Modelo: {turn.modelUsed}</small>}</article>)}
          {busy && <article className="neural-message assistant thinking-card"><div className="neural-message-head"><strong>JARVIS</strong><span>ORQUESTRANDO</span></div><p className="neural-thinking"><i /><i /><i /> consultando o núcleo seguro…</p></article>}
        </div>
      </div>
    </div>
    <div hidden={!callActive} style={{ margin: '14px 0', border: '1px solid #31233b', borderRadius: 16, padding: 12, background: '#09060d' }} aria-label="Videochamada com Jarvis">
      <video ref={videoPreview} autoPlay muted playsInline style={{ width: '100%', maxHeight: '56vh', objectFit: 'cover', borderRadius: 12, background: '#000' }} />
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 10 }}><button className="button button-secondary" type="button" onClick={() => void analyzeCurrentView('O que você vê agora e o que é relevante para mim?')}>ANALISAR O QUE ESTOU MOSTRANDO</button><button className="button button-secondary" type="button" onClick={() => void switchCamera()}>TROCAR CÂMERA</button><button className="button button-secondary" type="button" onClick={endSession}>ENCERRAR CHAMADA</button></div>
      <p className="neural-status">A câmera fica visível. O Jarvis analisa um quadro somente quando você pede; visão contínua ainda não está ativa.</p>
    </div>
    <div className="neural-console">
      <form onSubmit={event => { event.preventDefault(); void send(text); }}>
        {attachments.length > 0 && <div className="neural-attachments" aria-label="Anexos selecionados">{attachments.map(item => <span className="neural-attachment" key={item.id}>📎 {item.name}<button type="button" aria-label={`Remover ${item.name}`} onClick={() => setAttachments(current => current.filter(candidate => candidate.id !== item.id))}>×</button></span>)}</div>}
        <div className="neural-input-wrap"><button className={`neural-icon-button ${listening ? 'danger' : ''}`} type="button" disabled={!session || busy} onClick={listening ? endSession : startVoice} title={listening ? 'Encerrar voz' : 'Ativar escuta'} aria-label={listening ? 'Encerrar voz' : 'Ativar escuta'}>◉</button><button className="neural-icon-button" type="button" disabled={!session || busy || attachmentBusy || attachments.length >= MAX_ATTACHMENTS} onClick={() => fileInput.current?.click()} title="Anexar arquivo" aria-label="Anexar arquivo">＋</button><input ref={fileInput} hidden type="file" multiple accept="image/jpeg,image/png,image/webp,.txt,.md,.csv,.json,text/plain,text/markdown,text/csv,application/json" onChange={event => void addAttachments(event.target.files)} /><textarea id="jarvis-message" rows={2} maxLength={8000} value={text} disabled={!session || busy} onChange={event => setText(event.target.value)} placeholder={listening ? `Escuta ativa… diga “${WAKE_PHRASE}”.` : 'Converse com o Jarvis…'} /><button className="neural-send" type="submit" disabled={!session || busy || attachmentBusy || (!text.trim() && !attachments.length)}>{busy ? 'ANALISANDO' : 'ENVIAR'}</button></div>
        <div className="neural-options">
          {mode === 'private' && <label><input type="checkbox" checked={remember} onChange={event => setRemember(event.target.checked)} /> Memória automática — guardar minhas falas</label>}
          <label><input type="checkbox" checked={voiceReply} onChange={event => { setVoiceReply(event.target.checked); if (!event.target.checked) { const resume = speechResume.current; speechResume.current = null; window.speechSynthesis?.cancel(); resume?.(); } }} /> Voz Jarvis · {JARVIS_VOICE_PROFILE.label} — responder em voz alta</label>
          <label><input type="checkbox" checked={consent} onChange={event => { setConsent(event.target.checked); if (!event.target.checked) endSession(); }} /> Autorizar microfone nesta sessão</label>
          <button type="button" disabled={!session || busy} onClick={() => void (callActive ? Promise.resolve(endSession()) : startVideoCall())}>{callActive ? 'ENCERRAR VIDEOCHAMADA' : 'INICIAR VIDEOCHAMADA'}</button><button type="button" disabled={!session || busy} onClick={toggleAmbient}>{ambientMode ? `AMBIENTE ON · ${ambientCount}` : 'MODO AMBIENTE'}</button><button type="button" onClick={endSession}>ENCERRAR / MIC OFF</button>
        </div>
      </form>
      <p className="neural-status" role="status">{status}</p>
      <p className="neural-status">Voz do Jarvis: perfil {JARVIS_VOICE_PROFILE.label}, masculino pt-BR, grave moderado e cadência calma. O timbre final depende da melhor voz instalada no aparelho.</p>
      <p className="neural-status">Identificação de locutor ainda não está ativa: transcrição de voz não prova que quem falou foi você. Voz nunca substituirá login/biometria do aparelho como autorização.</p>
      <p className="neural-status">Sua voz pessoal não é usada para o Jarvis responder. Ela fica reservada para criação de conteúdos quando você pedir explicitamente.</p>
      <details className="neural-disclosure"><summary>Limites desta etapa</summary><p>A palavra de ativação “{WAKE_PHRASE}” funciona somente enquanto a página está visível e o microfone foi autorizado. O iPhone não permite que este web app mantenha um wake word confiável com a tela bloqueada. A videochamada desta etapa usa câmera local + conversa de voz e consegue enviar um quadro atual para análise sob comando; ainda não é visão contínua em streaming. O modo ambiente mantém um buffer temporário local e não salva fala de terceiros automaticamente. Identificação biométrica de locutor ainda precisa do motor de verificação de voz apropriado.</p></details>
    </div>
  </section>;
}
