export const JARVIS_VOICE_PROFILE = Object.freeze({
  id: 'veludo-masculino-ptbr-v1',
  label: 'Veludo',
  language: 'pt-BR',
  rate: 0.88,
  pitch: 0.78,
  volume: 1
});

const preferredMaleNames = [
  'Felipe',
  'Thiago',
  'Tiago',
  'Ricardo',
  'Antonio',
  'Antônio',
  'João',
  'Rafael',
  'Paulo',
  'Daniel',
  'Bruno',
  'Alex'
];

const qualityHints = [
  'premium',
  'enhanced',
  'neural',
  'natural',
  'high quality',
  'alta qualidade'
];

const lowQualityHints = [
  'compact',
  'espeak',
  'festival'
];

function normalized(value: string): string {
  return value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
}

function isPtBr(voice: SpeechSynthesisVoice): boolean {
  return normalized(voice.lang).replace('_', '-') === 'pt-br';
}

function scoreVoice(voice: SpeechSynthesisVoice): number {
  const name = normalized(voice.name);
  let score = 0;
  if (isPtBr(voice)) score += 100;
  else if (normalized(voice.lang).startsWith('pt')) score += 35;

  if (preferredMaleNames.some(candidate => name.includes(normalized(candidate)))) score += 55;
  if (/\bmale\b|masculino|\bhomem\b/.test(name)) score += 45;
  if (qualityHints.some(hint => name.includes(hint))) score += 25;
  if (voice.localService) score += 10;
  if (lowQualityHints.some(hint => name.includes(hint))) score -= 35;
  return score;
}

export function selectJarvisVoice(voices: SpeechSynthesisVoice[]): SpeechSynthesisVoice | undefined {
  return [...voices]
    .filter(voice => normalized(voice.lang).startsWith('pt'))
    .sort((a, b) => scoreVoice(b) - scoreVoice(a))[0];
}

export function describeJarvisVoice(voices: SpeechSynthesisVoice[]): { profile: string; voiceName: string | null; language: string | null } {
  const selected = selectJarvisVoice(voices);
  return {
    profile: JARVIS_VOICE_PROFILE.label,
    voiceName: selected?.name ?? null,
    language: selected?.lang ?? null
  };
}

export function prepareJarvisSpeech(utterance: SpeechSynthesisUtterance): SpeechSynthesisUtterance {
  utterance.lang = JARVIS_VOICE_PROFILE.language;
  utterance.rate = JARVIS_VOICE_PROFILE.rate;
  utterance.pitch = JARVIS_VOICE_PROFILE.pitch;
  utterance.volume = JARVIS_VOICE_PROFILE.volume;

  if (typeof window === 'undefined' || !('speechSynthesis' in window)) return utterance;
  const selected = selectJarvisVoice(window.speechSynthesis.getVoices());
  if (selected) utterance.voice = selected;
  return utterance;
}
