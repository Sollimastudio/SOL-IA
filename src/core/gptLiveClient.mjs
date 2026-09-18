export const GPT_LIVE_MODEL = 'openai/gpt-live-1';
export const GPT_LIVE_PRICE_USD_PER_SECOND = 3 / 3600;
export const GPT_LIVE_VOICES = Object.freeze([
  'marin', 'alloy', 'ash', 'ballad', 'beacon', 'bossa', 'cedar', 'cinder', 'coral', 'delta', 'echo',
  'gleam', 'meridian', 'quartz', 'ripple', 'sage', 'shimmer', 'stone', 'tempo', 'verse', 'vesper', 'willow'
]);

const LIVE_WS_URL = 'wss://ai-gateway.vercel.sh/v1/live/sessions';
const LIVE_TOKEN_URL = '/api/jarvis-live-token';
const SAMPLE_RATE = 24000;
const IDLE_CLOSE_MS = 180000;
const DELEGATION_APPEND_MAX_CHARS = 1600;

function clampText(value, max = DELEGATION_APPEND_MAX_CHARS) {
  const text = String(value ?? '').trim();
  return text.length <= max ? text : `${text.slice(0, max - 1)}…`;
}

export function estimateLiveVoiceCost(seconds) {
  const safeSeconds = Number.isFinite(Number(seconds)) ? Math.max(0, Number(seconds)) : 0;
  return safeSeconds * GPT_LIVE_PRICE_USD_PER_SECOND;
}

export function buildGptLiveSessionStart({ voice = 'marin', instructions = '' } = {}) {
  const selectedVoice = GPT_LIVE_VOICES.includes(voice) ? voice : 'marin';
  return {
    type: 'session.start',
    session: {
      model: GPT_LIVE_MODEL,
      store: false,
      delegation: { type: 'client' },
      audio: {
        format: { type: 'audio/pcm', rate: SAMPLE_RATE },
        output: { voice: selectedVoice }
      },
      instructions: String(instructions ?? '').trim()
    }
  };
}

function bytesToBase64(buffer) {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let index = 0; index < bytes.length; index += 1) binary += String.fromCharCode(bytes[index]);
  return btoa(binary);
}

function base64ToInt16(value) {
  const binary = atob(value);
  const bytes = new Uint8Array(binary.length);
  for (let index = 0; index < binary.length; index += 1) bytes[index] = binary.charCodeAt(index);
  const aligned = bytes.byteOffset % 2 === 0
    ? bytes
    : new Uint8Array(bytes.slice().buffer);
  return new Int16Array(aligned.buffer, aligned.byteOffset, Math.floor(aligned.byteLength / 2));
}

function browserAudioContext() {
  return globalThis.AudioContext || globalThis.webkitAudioContext;
}

export function createGptLiveClient({
  accessToken,
  voice = 'marin',
  instructions = '',
  onStatus = () => undefined,
  onTranscript = () => undefined,
  onUsage = () => undefined,
  onDelegation = async () => '',
  onError = () => undefined,
  fetchImpl = globalThis.fetch,
  WebSocketImpl = globalThis.WebSocket
} = {}) {
  let socket = null;
  let microphone = null;
  let audioContext = null;
  let sourceNode = null;
  let captureNode = null;
  let silentGain = null;
  let started = false;
  let closing = false;
  let closed = false;
  let connecting = false;
  let connectionController = null;
  let muted = false;
  let finalUsageConfirmed = false;
  let nextPlaybackTime = 0;
  let closeResolve = null;
  let closeTimer = null;
  let idleTimer = null;
  const playbackSources = new Set();
  const delegationIds = new Set();
  const transcriptFragments = [];

  function assertOpening() {
    if (closing || closed || connectionController?.signal.aborted) {
      throw new DOMException('A abertura da conversa foi cancelada.', 'AbortError');
    }
  }

  function reportUsage(event, final) {
    const seconds = event?.usage?.seconds;
    if (typeof seconds !== 'number' || !Number.isFinite(seconds) || seconds < 0) return false;
    try { onUsage(seconds, { final }); } catch { /* UI callbacks never own transport */ }
    return true;
  }

  function setStatus(value) {
    try { onStatus(value); } catch { /* UI callbacks never own transport */ }
  }

  function reportError(error) {
    const normalized = error instanceof Error ? error : new Error(String(error ?? 'Falha desconhecida no GPT-Live.'));
    try { onError(normalized); } catch { /* UI callback */ }
  }

  function socketOpen() {
    return socket && socket.readyState === WebSocketImpl.OPEN;
  }

  function send(event) {
    if (!socketOpen()) return false;
    socket.send(JSON.stringify(event));
    return true;
  }

  function transcriptSnapshot() {
    return transcriptFragments.map(item => `${item.role === 'user' ? 'SOL' : 'JARVIS'}: ${item.delta}`).join(' ').slice(-7000);
  }

  function rememberTranscript(role, event) {
    const delta = String(event?.delta ?? '');
    if (!delta) return;
    transcriptFragments.push({ role, delta, startMs: event?.start_ms ?? null, endMs: event?.end_ms ?? null });
    while (transcriptFragments.length > 120 || transcriptSnapshot().length > 7600) transcriptFragments.shift();
    try { onTranscript({ role, delta, startMs: event?.start_ms ?? null, endMs: event?.end_ms ?? null }); } catch { /* UI callback */ }
    touchIdle();
  }

  function touchIdle() {
    clearTimeout(idleTimer);
    if (!started || closing) return;
    idleTimer = setTimeout(() => {
      reportError(new Error('A conversa ao vivo foi encerrada após 3 minutos sem fala detectada para evitar gasto esquecido.'));
      void close();
    }, IDLE_CLOSE_MS);
  }

  function stopCapture() {
    if (captureNode) {
      try { captureNode.port.onmessage = null; } catch { /* no-op */ }
      try { captureNode.disconnect(); } catch { /* no-op */ }
      captureNode = null;
    }
    if (sourceNode) {
      try { sourceNode.disconnect(); } catch { /* no-op */ }
      sourceNode = null;
    }
    if (silentGain) {
      try { silentGain.disconnect(); } catch { /* no-op */ }
      silentGain = null;
    }
    microphone?.getTracks().forEach(track => track.stop());
    microphone = null;
  }

  function stopPlayback() {
    for (const source of playbackSources) {
      try { source.stop(); } catch { /* already ended */ }
    }
    playbackSources.clear();
    nextPlaybackTime = 0;
  }

  function releaseAudio() {
    stopCapture();
    stopPlayback();
    if (audioContext) {
      const current = audioContext;
      audioContext = null;
      void current.close().catch(() => undefined);
    }
  }

  function finishClose() {
    closed = true;
    closing = true;
    connecting = false;
    started = false;
    connectionController?.abort();
    clearTimeout(closeTimer);
    clearTimeout(idleTimer);
    releaseAudio();
    const resolve = closeResolve;
    closeResolve = null;
    resolve?.();
  }

  function playPcm(base64) {
    if (!audioContext || !base64) return;
    const pcm = base64ToInt16(base64);
    if (!pcm.length) return;
    const buffer = audioContext.createBuffer(1, pcm.length, SAMPLE_RATE);
    const channel = buffer.getChannelData(0);
    for (let index = 0; index < pcm.length; index += 1) channel[index] = pcm[index] / 32768;
    const source = audioContext.createBufferSource();
    source.buffer = buffer;
    source.connect(audioContext.destination);
    playbackSources.add(source);
    source.onended = () => playbackSources.delete(source);
    const startAt = Math.max(audioContext.currentTime + 0.015, nextPlaybackTime || 0);
    source.start(startAt);
    nextPlaybackTime = startAt + buffer.duration;
    touchIdle();
  }

  async function handleDelegation(event) {
    const id = String(event?.delegation?.id ?? '').trim();
    if (!id || closing || delegationIds.has(id)) return;
    delegationIds.add(id);
    send({
      type: 'session.thinking.append',
      delegation_id: id,
      content: 'Consultando os recursos privados e especialistas autorizados do Jarvis.'
    });
    try {
      const result = await onDelegation({
        id,
        transcript: transcriptSnapshot(),
        metadata: event?.delegation ?? null
      });
      if (!closing && socketOpen()) {
        send({
          type: 'session.commentary.append',
          delegation_id: id,
          content: clampText(result || 'Não há resultado adicional confirmado para esta tarefa.')
        });
      }
    } catch {
      if (!closing && socketOpen()) {
        send({
          type: 'session.commentary.append',
          delegation_id: id,
          content: 'O apoio de bastidor não respondeu agora. Continue a conversa sem inventar informações ausentes.'
        });
      }
    } finally {
      delegationIds.delete(id);
    }
  }

  async function handleMessage(raw) {
    let text;
    try {
      text = typeof raw === 'string' ? raw : raw instanceof Blob ? await raw.text() : new TextDecoder().decode(raw);
    } catch { return; }
    if (closed) return;
    let event;
    try { event = JSON.parse(text); } catch { return; }
    if (!event || typeof event !== 'object') return;
    if (closing && event.type !== 'session.closed' && event.type !== 'session.usage.updated') return;

    if (event.type === 'session.started') {
      started = true;
      setStatus('connected');
      touchIdle();
      return;
    }
    if (event.type === 'session.input_transcript.delta') {
      rememberTranscript('user', event);
      return;
    }
    if (event.type === 'session.output_transcript.delta') {
      rememberTranscript('assistant', event);
      return;
    }
    if (event.type === 'session.output_audio.delta') {
      playPcm(String(event.delta ?? ''));
      return;
    }
    if (event.type === 'session.delegation.created') {
      touchIdle();
      void handleDelegation(event);
      return;
    }
    if (event.type === 'session.input_audio.muted') {
      muted = true;
      return;
    }
    if (event.type === 'session.input_audio.unmuted') {
      muted = false;
      return;
    }
    if (event.type === 'session.usage.updated') {
      reportUsage(event, false);
      return;
    }
    if (event.type === 'session.closed') {
      finalUsageConfirmed = reportUsage(event, true);
      started = false;
      closing = true;
      setStatus('disconnected');
      try { socket?.close(); } catch { /* no-op */ }
      finishClose();
      return;
    }
    if (event.type === 'error') {
      reportError(new Error(String(event?.error?.message ?? 'O provedor de voz informou um erro.')));
    }
  }

  async function prepareMicrophone() {
    if (!navigator?.mediaDevices?.getUserMedia) throw new Error('Este aparelho não oferece acesso ao microfone pelo navegador.');
    const AudioContextCtor = browserAudioContext();
    if (!AudioContextCtor) throw new Error('Este navegador não oferece áudio em tempo real compatível.');

    const acquiredMicrophone = await navigator.mediaDevices.getUserMedia({
      audio: {
        echoCancellation: true,
        noiseSuppression: true,
        autoGainControl: true,
        channelCount: 1
      },
      video: false
    });
    // Permission can resolve after the user already pressed stop or left the page.
    if (closing || closed || connectionController?.signal.aborted) {
      acquiredMicrophone.getTracks().forEach(track => track.stop());
      assertOpening();
    }
    microphone = acquiredMicrophone;
    audioContext = new AudioContextCtor();
    await audioContext.resume();
    assertOpening();
    if (!audioContext.audioWorklet || typeof AudioWorkletNode === 'undefined') {
      throw new Error('O navegador precisa de AudioWorklet para a conversa GPT‑Live.');
    }
    await audioContext.audioWorklet.addModule('/gpt-live-capture-processor.js');
    assertOpening();
    sourceNode = audioContext.createMediaStreamSource(microphone);
    captureNode = new AudioWorkletNode(audioContext, 'jarvis-gpt-live-capture');
    silentGain = audioContext.createGain();
    silentGain.gain.value = 0;
    sourceNode.connect(captureNode);
    captureNode.connect(silentGain);
    silentGain.connect(audioContext.destination);
    captureNode.port.onmessage = event => {
      if (!started || closing || muted || !socketOpen() || !(event.data instanceof ArrayBuffer)) return;
      send({ type: 'session.input_audio.append', audio: bytesToBase64(event.data) });
    };
  }

  async function connect() {
    if (socket || connecting || closing || closed) throw new Error('Já existe uma tentativa de conversa ao vivo em andamento.');
    if (!accessToken) throw new Error('Sua sessão precisa estar ativa antes de abrir o GPT‑Live.');
    connecting = true;
    connectionController = new AbortController();
    setStatus('connecting');
    try {
      await prepareMicrophone();
      assertOpening();
      const response = await fetchImpl(LIVE_TOKEN_URL, {
        method: 'POST',
        headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
        cache: 'no-store',
        signal: connectionController.signal
      });
      assertOpening();
      const payload = await response.json().catch(() => null);
      assertOpening();
      if (!response.ok || !payload?.token || !payload?.expiresAt) {
        throw new Error(payload?.error || 'Não consegui obter autorização para o GPT‑Live.');
      }
      if (!Number.isFinite(Number(payload.expiresAt)) || Date.now() >= Number(payload.expiresAt) * 1000) throw new Error('A autorização de voz expirou antes da conexão.');

      const currentSocket = new WebSocketImpl(LIVE_WS_URL, [
        'ai-gateway-realtime.v1',
        `ai-gateway-auth.${payload.token}`
      ]);
      socket = currentSocket;
      connecting = false;
      socket.addEventListener('open', () => {
        if (socket !== currentSocket || closing || closed) return;
        send(buildGptLiveSessionStart({ voice, instructions }));
      });
      socket.addEventListener('message', event => {
        if (socket === currentSocket && !closed) void handleMessage(event.data);
      });
      socket.addEventListener('error', () => {
        if (socket !== currentSocket || closing || closed) return;
        reportError(new Error('A conexão de voz encontrou uma falha de transporte.'));
      });
      socket.addEventListener('close', () => {
        if (socket !== currentSocket) return;
        const wasClosing = closing;
        socket = null;
        started = false;
        setStatus('disconnected');
        if (!wasClosing && !finalUsageConfirmed) reportError(new Error('A sessão de voz terminou sem confirmação final de uso.'));
        finishClose();
      });
    } catch (error) {
      const cancelled = closing || closed || connectionController?.signal.aborted;
      try { socket?.close(); } catch { /* no-op */ }
      socket = null;
      finishClose();
      if (cancelled) return;
      setStatus('error');
      reportError(error);
      throw error;
    }
  }

  async function close() {
    if (closed) return;
    if (closing) return new Promise(resolve => {
      const previous = closeResolve;
      closeResolve = () => { previous?.(); resolve(); };
    });
    closing = true;
    connectionController?.abort();
    setStatus('closing');
    stopCapture();
    clearTimeout(idleTimer);
    if (!socketOpen() || !started) {
      try { socket?.close(); } catch { /* no-op */ }
      socket = null;
      started = false;
      setStatus('disconnected');
      finishClose();
      return;
    }
    return new Promise(resolve => {
      closeResolve = resolve;
      closeTimer = setTimeout(() => {
        try { socket?.close(); } catch { /* no-op */ }
        socket = null;
        started = false;
        setStatus('disconnected');
        finishClose();
      }, 5000);
      send({ type: 'session.close' });
    });
  }

  function disconnect() {
    if (closed) return;
    closing = true;
    connectionController?.abort();
    clearTimeout(closeTimer);
    clearTimeout(idleTimer);
    try { socket?.close(); } catch { /* no-op */ }
    socket = null;
    started = false;
    setStatus('disconnected');
    finishClose();
  }

  function mute() {
    if (!started || closing || muted) return false;
    microphone?.getAudioTracks().forEach(track => { track.enabled = false; });
    muted = send({ type: 'session.input_audio.mute' });
    return muted;
  }

  function unmute() {
    if (!started || closing || !muted) return false;
    microphone?.getAudioTracks().forEach(track => { track.enabled = true; });
    if (!send({ type: 'session.input_audio.unmute' })) return false;
    muted = false;
    return true;
  }

  return {
    connect,
    close,
    disconnect,
    mute,
    unmute,
    isConnected: () => started && socketOpen() && !closing,
    isMuted: () => muted,
    hasFinalUsage: () => finalUsageConfirmed
  };
}
