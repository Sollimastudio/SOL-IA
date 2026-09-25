export const GEMINI_LIVE_MODEL = 'gemini-3.8-live';
export const GEMINI_LIVE_VOICES = Object.freeze([
  'Kore', 'Puck', 'Zephyr', 'Charon', 'Fenrir', 'Leda', 'Orus', 'Aoede', 'Callirrhoe',
  'Autonoe', 'Enceladus', 'Iapetus', 'Umbriel', 'Algieba', 'Despina', 'Erinome',
  'Algenib', 'Rasalgethi', 'Laomedeia', 'Achernar', 'Alnilam', 'Schedar', 'Gacrux',
  'Pulcherrima', 'Achird', 'Zubenelgenubi', 'Vindemiatrix', 'Sadachbia', 'Sadaltager', 'Sulafat'
]);
const TOKEN_URL = '/api/jarvis-gemini-live-token';
const WS_BASE = 'wss://generativelanguage.googleapis.com/ws/google.ai.generativelanguage.v1beta.GenerativeService.BidiGenerateContentConstrained';
const SAMPLE_RATE = 24000;
const IDLE_CLOSE_MS = 180000;
const SETUP_TIMEOUT_MS = 30000;

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
  return new Int16Array(bytes.buffer, bytes.byteOffset, Math.floor(bytes.byteLength / 2));
}

function browserAudioContext() {
  return globalThis.AudioContext || globalThis.webkitAudioContext;
}

export function createGeminiLiveClient({
  accessToken,
  voice = 'Kore',
  instructions = '',
  keepAlive = false,
  getAccessToken,
  onStatus = () => undefined,
  onTranscript = () => undefined,
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
  let muted = false;
  let closing = false;
  let closed = false;
  let connecting = false;
  let nextPlaybackTime = 0;
  let idleTimer = null;
  let setupTimer = null;
  let resumeTimer = null;
  let resumeHandle = null;
  let goAway = false;
  let connectedAt = 0;
  let resumeAttempts = 0;
  const authorization = new AbortController();
  const toolControllers = new Map();
  const playbackSources = new Set();
  const transcriptFragments = [];

  const setStatus = value => { try { onStatus(value); } catch { /* UI callback */ } };
  const reportError = error => {
    const normalized = error instanceof Error ? error : new Error(String(error ?? 'Falha desconhecida no Gemini Live.'));
    try { onError(normalized); } catch { /* UI callback */ }
  };

  const socketOpen = () => socket && socket.readyState === WebSocketImpl.OPEN;

  function send(payload) {
    if (!socketOpen()) return false;
    try { socket.send(JSON.stringify(payload)); return true; } catch { return false; }
  }

  function transcriptSnapshot() {
    return transcriptFragments.map(item => `${item.role === 'user' ? 'LOCUTOR NÃO VERIFICADO' : 'JARVIS'}: ${item.delta}`).join(' ').slice(-7000);
  }

  function rememberTranscript(role, text) {
    const delta = String(text ?? '').trim();
    if (!delta) return;
    transcriptFragments.push({ role, delta });
    while (transcriptFragments.length > 100 || transcriptSnapshot().length > 7600) transcriptFragments.shift();
    try { onTranscript({ role, delta, startMs: null, endMs: null }); } catch { /* UI callback */ }
    touchIdle();
  }

  function touchIdle() {
    clearTimeout(idleTimer);
    if (!started || closing || keepAlive === true) return;
    idleTimer = setTimeout(() => {
      reportError(new Error('A conversa ao vivo foi encerrada após 3 minutos sem atividade para evitar uma sessão esquecida.'));
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
    if (closed) return;
    closed = true;
    closing = true;
    connecting = false;
    started = false;
    clearTimeout(idleTimer);
    clearTimeout(setupTimer);
    clearTimeout(resumeTimer);
    authorization.abort();
    cancelTools();
    resumeHandle = null;
    const previous = socket;
    socket = null;
    try { previous?.close(); } catch { /* already closed */ }
    releaseAudio();
  }

  function cancelTools() {
    toolControllers.forEach(controller => controller.abort());
    toolControllers.clear();
  }

  function fail(error) {
    if (closed) return;
    finishClose();
    setStatus('error');
    reportError(error);
  }

  function startSetupDeadline() {
    clearTimeout(setupTimer);
    setupTimer = setTimeout(() => fail(new Error('O Gemini Live não iniciou a tempo. Tente abrir a conversa novamente.')), SETUP_TIMEOUT_MS);
  }

  // Resume only a server-approved snapshot. Never silently create a new conversation
  // or replay transcripts/tool results when a snapshot is unavailable.
  function scheduleResume() {
    if (keepAlive !== true || !resumeHandle || closing || closed || connecting) return false;
    if (connectedAt && Date.now() - connectedAt > 60000) resumeAttempts = 0;
    if (resumeAttempts >= 3) return false;
    resumeAttempts++;
    const handle = resumeHandle;
    started = false;
    connecting = true;
    goAway = false;
    clearTimeout(idleTimer);
    cancelTools();
    stopPlayback();
    const previous = socket;
    socket = null;
    try { previous?.close(); } catch { /* no-op */ }
    setStatus('reconnecting');
    resumeTimer = setTimeout(() => {
      if (closed) return;
      startSetupDeadline();
      void openConnection(handle).catch(fail);
    }, 500);
    return true;
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

  async function handleToolCall(toolCall, currentSocket) {
    const calls = Array.isArray(toolCall?.functionCalls) ? toolCall.functionCalls : [];
    const pending = [];
    for (const call of calls) {
      const controller = new AbortController();
      const id = String(call?.id || crypto.randomUUID());
      if (toolControllers.has(id)) continue;
      toolControllers.set(id, controller);
      pending.push({ call, id, controller });
    }
    for (const { call, id, controller } of pending) {
      if (closed || socket !== currentSocket) return;
      if (controller.signal.aborted) { toolControllers.delete(id); continue; }
      let response;
      if (call?.name !== 'consult_jarvis' || !call?.id) {
        response = { error: 'Ferramenta não autorizada.' };
      } else try {
        const request = typeof call?.args?.request === 'string' ? call.args.request : '';
        const result = await onDelegation({
          id: String(call.id),
          transcript: `${transcriptSnapshot()} ${request}`.trim().slice(-7000),
          metadata: call,
          signal: controller.signal
        });
        response = { result: String(result || 'Nenhum resultado adicional confirmado.').slice(0, 1500) };
      } catch {
        response = { error: 'O apoio de bastidor não respondeu agora.' };
      }
      toolControllers.delete(id);
      if (!controller.signal.aborted && !closed && socket === currentSocket) {
        send({ toolResponse: { functionResponses: [{ name: call?.name || 'unknown', id, response }] } });
      }
    }
  }

  async function handleMessage(raw, currentSocket) {
    let text;
    try {
      text = typeof raw === 'string' ? raw : raw instanceof Blob ? await raw.text() : new TextDecoder().decode(raw);
    } catch { return; }
    let event;
    try { event = JSON.parse(text); } catch { return; }
    if (!event || typeof event !== 'object' || closed || socket !== currentSocket) return;

    if (event.setupComplete) {
      started = true;
      connecting = false;
      connectedAt = Date.now();
      clearTimeout(setupTimer);
      setStatus('connected');
      touchIdle();
      return;
    }

    if (event.sessionResumptionUpdate && keepAlive === true) {
      const update = event.sessionResumptionUpdate;
      resumeHandle = update.resumable === true && typeof update.newHandle === 'string' && update.newHandle.length <= 16000
        ? update.newHandle || null : null;
      if (goAway && scheduleResume()) return;
    }
    if (event.goAway) {
      goAway = true;
      if (scheduleResume()) return;
    }
    if (Array.isArray(event.toolCallCancellation?.ids)) {
      for (const id of event.toolCallCancellation.ids) toolControllers.get(String(id))?.abort();
    }

    const content = event.serverContent;
    if (content?.interrupted) stopPlayback();
    if (content?.inputTranscription?.text) rememberTranscript('user', content.inputTranscription.text);
    if (content?.outputTranscription?.text) rememberTranscript('assistant', content.outputTranscription.text);

    const parts = content?.modelTurn?.parts;
    if (!content?.interrupted && Array.isArray(parts)) {
      for (const part of parts) {
        if (part?.inlineData?.data) playPcm(String(part.inlineData.data));
      }
    }

    if (event.toolCall) {
      touchIdle();
      void handleToolCall(event.toolCall, currentSocket);
    }

    if (event.error) fail(new Error('O Gemini Live recusou a sessão. Encerre e tente novamente.'));
  }

  async function prepareMicrophone() {
    if (!navigator?.mediaDevices?.getUserMedia) throw new Error('Este aparelho não oferece acesso ao microfone pelo navegador.');
    const AudioContextCtor = browserAudioContext();
    if (!AudioContextCtor) throw new Error('Este navegador não oferece áudio em tempo real compatível.');

    const stream = await navigator.mediaDevices.getUserMedia({
      audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true, channelCount: 1 },
      video: false
    });
    if (closed) { stream.getTracks().forEach(track => track.stop()); return; }
    microphone = stream;
    audioContext = new AudioContextCtor();
    await audioContext.resume();
    if (closed) return;
    if (!audioContext.audioWorklet || typeof AudioWorkletNode === 'undefined') {
      throw new Error('O navegador precisa de AudioWorklet para a conversa ao vivo.');
    }
    await audioContext.audioWorklet.addModule('/gpt-live-capture-processor.js');
    if (closed) return;
    sourceNode = audioContext.createMediaStreamSource(microphone);
    captureNode = new AudioWorkletNode(audioContext, 'jarvis-gpt-live-capture');
    silentGain = audioContext.createGain();
    silentGain.gain.value = 0;
    sourceNode.connect(captureNode);
    captureNode.connect(silentGain);
    silentGain.connect(audioContext.destination);
    captureNode.port.onmessage = event => {
      if (!started || closing || muted || !socketOpen() || !(event.data instanceof ArrayBuffer)) return;
      send({
        realtimeInput: {
          audio: {
            data: bytesToBase64(event.data),
            mimeType: `audio/pcm;rate=${SAMPLE_RATE}`
          }
        }
      });
    };
  }

  async function connect() {
    if (socket || connecting || closing || closed) throw new Error('Já existe uma tentativa de conversa ao vivo em andamento.');
    if (!accessToken) throw new Error('Sua sessão precisa estar ativa antes de abrir o Gemini Live.');
    connecting = true;
    setStatus('connecting');
    startSetupDeadline();
    try {
      await openConnection();
    } catch (error) {
      if (closed) return;
      fail(error);
      throw error;
    }
  }

  async function openConnection(handle = null) {
      const credential = handle && getAccessToken ? await getAccessToken() : accessToken;
      if (closed) return;
      if (!credential) throw new Error('Sua sessão expirou. Entre novamente para retomar a voz.');
      const response = await fetchImpl(TOKEN_URL, {
        method: 'POST',
        headers: { Authorization: `Bearer ${credential}`, 'Content-Type': 'application/json' },
        cache: 'no-store',
        signal: authorization.signal
      });
      if (closed) return;
      const payload = await response.json().catch(() => null);
      if (closed) return;
      if (!response.ok || payload?.ok !== true || typeof payload?.token !== 'string') {
        throw new Error(payload?.error || 'Não consegui obter autorização para o Gemini Live.');
      }

      if (!microphone) await prepareMicrophone();
      if (closed) return;
      const selectedVoice = GEMINI_LIVE_VOICES.includes(voice) ? voice : 'Kore';
      const url = `${WS_BASE}?access_token=${encodeURIComponent(payload.token)}`;
      const currentSocket = new WebSocketImpl(url);
      socket = currentSocket;
      currentSocket.addEventListener('open', () => {
        if (socket !== currentSocket || closing || closed) return;
        send({
          setup: {
            model: `models/${GEMINI_LIVE_MODEL}`,
            generationConfig: {
              responseModalities: ['AUDIO'],
              speechConfig: {
                voiceConfig: {
                  prebuiltVoiceConfig: { voiceName: selectedVoice }
                }
              }
            },
            systemInstruction: { parts: [{ text: String(instructions || '').slice(0, 8000) }] },
            inputAudioTranscription: {},
            outputAudioTranscription: {},
            ...(keepAlive === true ? {
              sessionResumption: handle ? { handle } : {},
              contextWindowCompression: { slidingWindow: {} }
            } : {}),
            tools: [{
              functionDeclarations: [{
                name: 'consult_jarvis',
                description: 'Consulta a memória, contexto e especialistas autorizados do Jarvis quando a conversa precisa de informação que não está no turno atual.',
                parameters: {
                  type: 'OBJECT',
                  properties: {
                    request: { type: 'STRING', description: 'Pergunta objetiva para os bastidores do Jarvis.' }
                  },
                  required: ['request']
                }
              }]
            }]
          }
        });
      });
      currentSocket.addEventListener('message', event => {
        if (socket === currentSocket && !closed) void handleMessage(event.data, currentSocket);
      });
      currentSocket.addEventListener('error', () => {
        if (socket !== currentSocket || closing || closed) return;
        reportError(new Error('A conexão com o Gemini Live encontrou uma falha de transporte.'));
      });
      currentSocket.addEventListener('close', event => {
        if (socket !== currentSocket) return;
        if ([1000, 1001, 1006, 1011, 1012, 1013].includes(event.code) && scheduleResume()) return;
        socket = null;
        if (!closing && !closed) reportError(new Error('A sessão Gemini Live foi encerrada pelo provedor.'));
        finishClose();
        setStatus('disconnected');
      });
  }

  async function close() {
    if (closed) return;
    closing = true;
    clearTimeout(idleTimer);
    if (started && socketOpen()) {
      send({ realtimeInput: { audioStreamEnd: true } });
    }
    try { socket?.close(); } catch { /* no-op */ }
    socket = null;
    finishClose();
    setStatus('disconnected');
  }

  function disconnect() {
    if (closed) return;
    closing = true;
    try { socket?.close(); } catch { /* no-op */ }
    socket = null;
    finishClose();
    setStatus('disconnected');
  }

  function mute() {
    if (!started || closing || muted) return false;
    microphone?.getAudioTracks().forEach(track => { track.enabled = false; });
    muted = true;
    send({ realtimeInput: { audioStreamEnd: true } });
    return true;
  }

  function unmute() {
    if (!started || closing || !muted) return false;
    microphone?.getAudioTracks().forEach(track => { track.enabled = true; });
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
    hasFinalUsage: () => false
  };
}
