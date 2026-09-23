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
    socket.send(JSON.stringify(payload));
    return true;
  }

  function transcriptSnapshot() {
    return transcriptFragments.map(item => `${item.role === 'user' ? 'SOL' : 'JARVIS'}: ${item.delta}`).join(' ').slice(-7000);
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
    if (!started || closing) return;
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
    releaseAudio();
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

  async function handleToolCall(toolCall) {
    const calls = Array.isArray(toolCall?.functionCalls) ? toolCall.functionCalls : [];
    const functionResponses = [];
    for (const call of calls) {
      if (call?.name !== 'consult_jarvis' || !call?.id) {
        functionResponses.push({
          name: call?.name || 'unknown',
          id: call?.id || crypto.randomUUID(),
          response: { error: 'Ferramenta não autorizada.' }
        });
        continue;
      }
      try {
        const request = typeof call?.args?.request === 'string' ? call.args.request : '';
        const result = await onDelegation({
          id: String(call.id),
          transcript: `${transcriptSnapshot()} ${request}`.trim().slice(-7000),
          metadata: call
        });
        functionResponses.push({
          name: call.name,
          id: call.id,
          response: { result: String(result || 'Nenhum resultado adicional confirmado.').slice(0, 1500) }
        });
      } catch {
        functionResponses.push({
          name: call.name,
          id: call.id,
          response: { error: 'O apoio de bastidor não respondeu agora.' }
        });
      }
    }
    if (functionResponses.length) send({ toolResponse: { functionResponses } });
  }

  async function handleMessage(raw) {
    let text;
    try {
      text = typeof raw === 'string' ? raw : raw instanceof Blob ? await raw.text() : new TextDecoder().decode(raw);
    } catch { return; }
    let event;
    try { event = JSON.parse(text); } catch { return; }
    if (!event || typeof event !== 'object' || closed) return;

    if (event.setupComplete) {
      started = true;
      connecting = false;
      setStatus('connected');
      touchIdle();
      return;
    }

    const content = event.serverContent;
    if (content?.inputTranscription?.text) rememberTranscript('user', content.inputTranscription.text);
    if (content?.outputTranscription?.text) rememberTranscript('assistant', content.outputTranscription.text);

    const parts = content?.modelTurn?.parts;
    if (Array.isArray(parts)) {
      for (const part of parts) {
        if (part?.inlineData?.data) playPcm(String(part.inlineData.data));
      }
    }

    if (event.toolCall) {
      touchIdle();
      void handleToolCall(event.toolCall);
    }

    if (event.error) reportError(new Error(String(event.error?.message || 'O Gemini Live informou um erro.')));
  }

  async function prepareMicrophone() {
    if (!navigator?.mediaDevices?.getUserMedia) throw new Error('Este aparelho não oferece acesso ao microfone pelo navegador.');
    const AudioContextCtor = browserAudioContext();
    if (!AudioContextCtor) throw new Error('Este navegador não oferece áudio em tempo real compatível.');

    microphone = await navigator.mediaDevices.getUserMedia({
      audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true, channelCount: 1 },
      video: false
    });
    audioContext = new AudioContextCtor();
    await audioContext.resume();
    if (!audioContext.audioWorklet || typeof AudioWorkletNode === 'undefined') {
      throw new Error('O navegador precisa de AudioWorklet para a conversa ao vivo.');
    }
    await audioContext.audioWorklet.addModule('/gpt-live-capture-processor.js');
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

    try {
      const response = await fetchImpl(TOKEN_URL, {
        method: 'POST',
        headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
        cache: 'no-store'
      });
      const payload = await response.json().catch(() => null);
      if (!response.ok || payload?.ok !== true || typeof payload?.token !== 'string') {
        throw new Error(payload?.error || 'Não consegui obter autorização para o Gemini Live.');
      }

      await prepareMicrophone();
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
        if (socket === currentSocket && !closed) void handleMessage(event.data);
      });
      currentSocket.addEventListener('error', () => {
        if (socket !== currentSocket || closing || closed) return;
        reportError(new Error('A conexão com o Gemini Live encontrou uma falha de transporte.'));
      });
      currentSocket.addEventListener('close', () => {
        if (socket !== currentSocket) return;
        socket = null;
        if (!closing && !closed) reportError(new Error('A sessão Gemini Live foi encerrada pelo provedor.'));
        finishClose();
        setStatus('disconnected');
      });
    } catch (error) {
      try { socket?.close(); } catch { /* no-op */ }
      socket = null;
      finishClose();
      setStatus('error');
      reportError(error);
      throw error;
    }
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
