const preferredMaleNames = [
  'Felipe',
  'Ricardo',
  'Antonio',
  'Antônio',
  'João',
  'Tiago',
  'Rafael',
  'Paulo'
];

function normalized(value: string): string {
  return value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
}

export function prepareJarvisSpeech(utterance: SpeechSynthesisUtterance): SpeechSynthesisUtterance {
  utterance.lang = 'pt-BR';
  utterance.rate = 0.93;
  utterance.pitch = 0.86;
  utterance.volume = 1;

  if (typeof window === 'undefined' || !('speechSynthesis' in window)) return utterance;

  const voices = window.speechSynthesis.getVoices();
  const ptBr = voices.filter(voice => normalized(voice.lang).replace('_', '-') === 'pt-br');
  const preferred = ptBr.find(voice => preferredMaleNames.some(name => normalized(voice.name).includes(normalized(name))));
  const masculineHint = ptBr.find(voice => /male|mascul|homem/.test(normalized(voice.name)));
  const selected = preferred || masculineHint || ptBr[0];
  if (selected) utterance.voice = selected;

  return utterance;
}
