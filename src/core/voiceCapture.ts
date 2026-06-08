export type VoiceCaptureResult = {
  supported: boolean;
  transcript?: string;
  error?: string;
};

declare global {
  interface Window {
    webkitSpeechRecognition?: any;
    SpeechRecognition?: any;
  }
}

export function isVoiceCaptureSupported(): boolean {
  return Boolean(window.SpeechRecognition || window.webkitSpeechRecognition);
}

export function startVoiceCapture(onResult: (text: string) => void, onError?: (error: string) => void): VoiceCaptureResult {
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

  recognition.onresult = (event: any) => {
    const transcript = Array.from(event.results)
      .map((result: any) => result[0]?.transcript || '')
      .join(' ')
      .trim();
    onResult(transcript);
  };

  recognition.onerror = (event: any) => {
    onError?.(event.error || 'Erro desconhecido na captura de voz.');
  };

  recognition.start();
  return { supported: true };
}
