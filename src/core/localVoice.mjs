export function selectLocalPortugueseVoice(voices) {
  const local = voices.filter(voice => voice.localService === true && /^pt(?:[-_]|$)/i.test(voice.lang));
  return local.find(voice => /^pt[-_]br$/i.test(voice.lang)) ?? local[0] ?? null;
}
