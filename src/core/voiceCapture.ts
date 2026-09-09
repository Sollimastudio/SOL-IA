export type VoiceCaptureResult = {
  supported: boolean;
  transcript?: string;
  error?: string;
};

// Complete shared browser contract: both the legacy capture and the new
// conversational session need end/abort and final-result metadata.
type SpeechRecognitionConstructor = new () => {
  lang: string;
  interimResults: boolean;
  continuous: boolean;
  onresult: ((event: {
    resultIndex: number;
    results: ArrayLike<{ isFinal: boolean; 0: { transcript: string } }>;
  }) => void) | null;
  onerror: ((event: { error: string }) => void) | null;
  onend: (() => void) | null;
  start: () => void;
  abort: () => void;
};

declare global {
  interface Window {
    webkitSpeechRecognition?: SpeechRecognitionConstructor;
    SpeechRecognition?: SpeechRecognitionConstructor;
  }
}

export function isVoiceCaptureSupported(): boolean {
  if (typeof window === 'undefined') return false;
  return Boolean(window.SpeechRecognition || window.webkitSpeechRecognition);
}

export function startVoiceCapture(onResult: (text: string) => void, onError?: (error: string) => void): VoiceCaptureResult {
  if (typeof window === 'undefined') {
    return { supported: false, error: 'Janela do navegador indisponivel.' };
  }

  const Recognition = window.SpeechRecognition || window.webkitSpeechRecognition;

  if (!Recognition) {
    return {
      supported: false,
      error: 'Reconhecimento de voz nao suportado neste navegador.'
    };
  }

  const recognition = new Recognition();
  recognition.lang = 'pt-BR';
  recognition.interimResults = false;
  recognition.continuous = false;

  recognition.onresult = (event) => {
    const transcript = Array.from(event.results)
      .map((result) => result[0]?.transcript || '')
      .join(' ')
      .trim();
    onResult(transcript);
  };

  recognition.onerror = (event) => {
    onError?.(event.error || 'Erro desconhecido na captura de voz.');
  };

  recognition.start();
  return { supported: true };
}
