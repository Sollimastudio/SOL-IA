import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const speech = readFileSync(new URL('../src/core/jarvisSpeech.ts', import.meta.url), 'utf8');
const conversation = readFileSync(new URL('../src/components/JarvisConversation.tsx', import.meta.url), 'utf8');
const live = readFileSync(new URL('../src/components/JarvisLiveVoice.tsx', import.meta.url), 'utf8');

test('Veludo profile remains available only as local emergency TTS', () => {
  assert.match(speech, /id: 'veludo-masculino-ptbr-v1'/);
  assert.match(speech, /language: 'pt-BR'/);
  assert.match(speech, /rate: 0\.88/);
  assert.match(speech, /pitch: 0\.78/);
  assert.match(speech, /premium/);
  assert.match(speech, /enhanced/);
  assert.match(speech, /neural/);
});

test('natural Gemini Live is the default voice path and device TTS is opt-in contingency', () => {
  assert.match(conversation, /const \[voiceReply, setVoiceReply\] = useState\(false\)/);
  assert.match(conversation, /Abrir voz natural Gemini Live/);
  assert.match(conversation, /Leitura local de emergência/);
  assert.match(conversation, /Gemini Live com áudio nativo/);
  assert.match(live, /useState<LiveProvider>\(\(\) => stored\('jarvis\.live\.provider', 'gemini'\)/);
  assert.match(live, /Google · Gemini 3\.8 Live/);
  assert.match(conversation, /Sua voz pessoal não é usada para o Jarvis responder/);
});
