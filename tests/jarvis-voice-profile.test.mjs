import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const speech = readFileSync(new URL('../src/core/jarvisSpeech.ts', import.meta.url), 'utf8');
const conversation = readFileSync(new URL('../src/components/JarvisConversation.tsx', import.meta.url), 'utf8');

test('Veludo profile stays masculine pt-BR with calm lower prosody', () => {
  assert.match(speech, /id: 'veludo-masculino-ptbr-v1'/);
  assert.match(speech, /language: 'pt-BR'/);
  assert.match(speech, /rate: 0\.88/);
  assert.match(speech, /pitch: 0\.78/);
  assert.match(speech, /premium/);
  assert.match(speech, /enhanced/);
  assert.match(speech, /neural/);
});

test('Jarvis spoken replies are enabled by default without using Sol cloned voice', () => {
  assert.match(conversation, /const \[voiceReply, setVoiceReply\] = useState\(true\)/);
  assert.match(conversation, /Voz Jarvis · \{JARVIS_VOICE_PROFILE\.label\}/);
  assert.match(conversation, /Sua voz pessoal não é usada para o Jarvis responder/);
});
