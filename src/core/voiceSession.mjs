/**
 * Foreground voice-session gate.
 *
 * This is intentionally NOT a true ambient/background wake-word engine: it has
 * no microphone access by itself and only evaluates transcripts while the UI
 * has an explicitly authorized foreground recognition session running.
 */
export const VOICE_WAKE_PHRASE = 'Jarvis, tá aí?';

const WAKE_RAW = /^\s*jarvis\b[\s,;:!?.-]*(?:(?:t[aá]\s*a[ií]|ta[ií])|(?:est[aá]\s*a[ií])|(?:voc[eê]\s+(?:t[aá]\s*a[ií]|ta[ií])))[\s,;:!?.-]*(.*)$/i;

export function createVoiceSession() {
  let active = false;
  let engaged = false;
  let epoch = 0;

  const stop = () => {
    active = false;
    engaged = false;
    epoch += 1;
  };

  return {
    start(consent) {
      if (consent !== true) return false;
      active = true;
      engaged = false;
      epoch += 1;
      return true;
    },
    stop,
    isActive: () => active,
    isEngaged: () => active && engaged,
    ticket: () => epoch,
    isCurrent: (ticket) => active && ticket === epoch,
    accept(text) {
      if (!active) return { kind: 'ignored' };

      const raw = String(text ?? '').trim();
      const normalized = raw.normalize('NFD').replace(/[\u0300-\u036f]/g, '')
        .toLowerCase().replace(/[.,!?;:]/g, ' ').replace(/\s+/g, ' ').trim();

      if (/^(?:jarvis )?(?:encerrar|encerrar conversa|parar de ouvir|silencio)$/.test(normalized)) {
        stop();
        return { kind: 'stop' };
      }

      const wake = raw.match(WAKE_RAW);
      if (!engaged) {
        if (!wake) return { kind: 'ignored' };
        engaged = true;
        const command = String(wake[1] ?? '').trim();
        return command ? { kind: 'message', text: command } : { kind: 'ignored' };
      }

      // Repeating the wake phrase while already engaged is harmless. If a command
      // follows it, strip the wake phrase instead of sending it as user content.
      if (wake) {
        const command = String(wake[1] ?? '').trim();
        return command ? { kind: 'message', text: command } : { kind: 'ignored' };
      }

      return raw ? { kind: 'message', text: raw } : { kind: 'ignored' };
    }
  };
}
