/** Session gate, NOT an ambient wake-word detector. No microphone access here. */
export function createVoiceSession() {
  let active = false;
  let epoch = 0;
  const stop = () => { active = false; epoch += 1; };
  return {
    start(consent) { if (consent !== true) return false; active = true; epoch += 1; return true; },
    stop,
    isActive: () => active,
    ticket: () => epoch,
    isCurrent: (ticket) => active && ticket === epoch,
    accept(text) {
      if (!active) return { kind: 'ignored' };
      const normalized = text.normalize('NFD').replace(/[\u0300-\u036f]/g, '')
        .toLowerCase().replace(/[.,!?;:]/g, ' ').replace(/\s+/g, ' ').trim();
      if (/^(?:jarvis )?(?:encerrar|encerrar conversa|parar de ouvir|silencio)$/.test(normalized)) {
        stop(); return { kind: 'stop' };
      }
      return text.trim() ? { kind: 'message', text: text.trim() } : { kind: 'ignored' };
    }
  };
}
