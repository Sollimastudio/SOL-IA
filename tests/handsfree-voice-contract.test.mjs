import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const read = relative => readFile(new URL(`../${relative}`, import.meta.url), 'utf8');

test('primary web microphone hands off to natural Gemini Live', async () => {
  const conversation = await read('src/components/JarvisConversation.tsx');
  const live = await read('src/components/JarvisLiveVoice.tsx');
  assert.match(conversation, /jarvis:start-natural-voice/);
  assert.match(conversation, /Abrir voz natural Gemini Live/);
  assert.match(live, /jarvis:start-natural-voice/);
  assert.match(live, /id="jarvis-live-voice"/);
  assert.match(live, /LOCUTOR · NÃO VERIFICADO/);
});

test('capture-only contingency never presents model none', async () => {
  const source = await read('src/services/authenticatedChat.mjs');
  assert.doesNotMatch(source, /modelUsed:\s*['"]none['"]/);
  assert.match(source, /modelUsed:\s*['"]capture-only['"]/);
});

test('text chat has a Gemini intelligent path instead of budget-only capture', async () => {
  const api = await read('api/jarvis-chat.ts');
  const adapter = await read('server/gemini-chat.mjs');
  assert.match(api, /createGeminiChatFetch/);
  assert.match(api, /GEMINI_CHAT_MODEL/);
  assert.match(adapter, /gemini-3\.8-flash/);
  assert.match(adapter, /x-goog-api-key/);
});

test('native iPhone path uses Gemini Live and keeps distance wake/background contracts', async () => {
  const app = await read('ios/JarvisNative/Sources/JarvisNativeApp.swift');
  const live = await read('ios/JarvisNative/Sources/NativeGeminiLive.swift');
  const project = await read('ios/JarvisNative/project.yml');
  assert.match(app, /JarvisNativeGeminiLive/);
  assert.match(app, /tá aí/);
  assert.doesNotMatch(app, /AVSpeechSynthesizer/);
  assert.match(live, /gemini-3\.8-live/);
  assert.match(live, /jarvis-gemini-live-token/);
  assert.match(live, /jarvis-core/);
  assert.match(project, /UIBackgroundModes:[\s\S]*- audio/);
});

test('native speaker identity is local, fail-closed and still gated by physical proof', async () => {
  const app = await read('ios/JarvisNative/Sources/JarvisNativeApp.swift');
  const identity = await read('ios/JarvisNative/Sources/NativeSpeakerIdentity.swift');
  const live = await read('ios/JarvisNative/Sources/NativeGeminiLive.swift');
  const project = await read('ios/JarvisNative/project.yml');
  const health = await read('api/jarvis-runtime-health.ts');

  assert.match(project, /FluidInference\/FluidAudio/);
  assert.match(identity, /import FluidAudio/);
  assert.match(identity, /extractSpeakerEmbedding/);
  assert.match(identity, /SpeakerManager\.cosineDistance/);
  assert.match(identity, /kSecAttrAccessibleAfterFirstUnlockThisDeviceOnly/);
  assert.match(identity, /case sol/);
  assert.match(identity, /case guest/);
  assert.match(identity, /case unknown/);
  assert.match(app, /Cadastrar minha voz neste iPhone/);
  assert.match(live, /guard speakerIdentity == \.sol/);
  assert.match(live, /Contexto privado bloqueado/);
  assert.match(health, /speakerVerificationImplementation:\s*'fluid-audio-local-voiceprint'/);
  assert.match(health, /speakerVerificationOperational:\s*false/);
  assert.match(health, /guestAuthorizationOperational:\s*false/);
});


test('speech-style learning accepts only voiceprint-verified Sol turns and stores no raw transcript history', async () => {
  const app = await read('ios/JarvisNative/Sources/JarvisNativeApp.swift');
  const style = await read('ios/JarvisNative/Sources/NativeSpeechStyle.swift');
  assert.match(app, /speakerIdentity\.lastResult == \.sol/);
  assert.match(app, /observeVerifiedSolTranscript/);
  assert.match(style, /verifiedTurns/);
  assert.match(style, /markerCounts/);
  assert.doesNotMatch(style, /\[String\]\s*=\s*\[\]|rawTranscripts|transcriptHistory/);
  assert.match(style, /PERFIL_DE_FALA_LOCAL_DA_SOL/);
});
