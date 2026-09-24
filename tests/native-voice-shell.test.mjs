import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const swift = fs.readFileSync('ios/JarvisNative/Sources/JarvisNativeApp.swift', 'utf8');
const live = fs.readFileSync('ios/JarvisNative/Sources/NativeGeminiLive.swift', 'utf8');
const auth = fs.readFileSync('ios/JarvisNative/Sources/NativeAuth.swift', 'utf8');
const context = fs.readFileSync('ios/JarvisNative/Sources/NativeContext.swift', 'utf8');
const brain = fs.readFileSync('ios/JarvisNative/Sources/NativeBrain.swift', 'utf8');
const diagnostics = fs.readFileSync('ios/JarvisNative/Sources/NativeDiagnostics.swift', 'utf8');
const bootstrap = fs.readFileSync('ios/JarvisNative/PREPARAR-JARVIS.command', 'utf8');
const project = fs.readFileSync('ios/JarvisNative/project.yml', 'utf8');
const nativeBundle = [swift, live, auth, context, brain, diagnostics, bootstrap].join('\n');

test('native iOS shell exposes a system voice action without provider secrets', () => {
  assert.match(swift, /StartJarvisConversationIntent/);
  assert.match(swift, /openAppWhenRun\s*=\s*true/);
  assert.match(swift, /AppShortcutsProvider/);
  assert.match(swift, /tá aí/);
  assert.doesNotMatch(nativeBundle, /OPENAI_API_KEY|OPENROUTER_API_KEY|AI_GATEWAY_API_KEY|GEMINI_API_KEY|GOOGLE_GEMINI_API_KEY|service_role/i);
});

test('native hands-free path uses play-and-record, Gemini Live, explicit stop and background audio', () => {
  assert.match(swift, /\.playAndRecord/);
  assert.match(swift, /AVAudioApplication\.requestRecordPermission/);
  assert.match(swift, /JarvisNativeGeminiLive/);
  assert.match(swift, /Gemini 3\.8 Live/);
  assert.match(swift, /encerrar/);
  assert.match(live, /models\/gemini-3\.8-live/);
  assert.match(live, /jarvis-gemini-live-token/);
  assert.match(project, /UIBackgroundModes/);
  assert.match(project, /audio/);
  assert.doesNotMatch(swift, /AVSpeechSynthesizer|speechSynthesis/);
});

test('native private login mirrors web OTP flow and persists only the session in Keychain', () => {
  assert.match(auth, /\/auth\/v1\/otp/);
  assert.match(auth, /create_user/);
  assert.match(auth, /\/auth\/v1\/verify/);
  assert.match(auth, /\/auth\/v1\/token\?grant_type=refresh_token/);
  assert.match(auth, /kSecAttrAccessibleAfterFirstUnlockThisDeviceOnly/);
  assert.match(swift, /Acesso privado — uma vez neste aparelho/);
  assert.match(swift, /Keychain/);
});

test('Gemini Live consults Jarvis Core for private context without a second model', () => {
  assert.match(live, /consult_jarvis/);
  assert.match(live, /\/api\/jarvis-core/);
  assert.match(live, /Authorization/);
  assert.match(live, /contexto privado/i);
});

test('legacy native context remains read-only and owner-scoped through authenticated RPCs', () => {
  assert.match(context, /search_solia_continuity/);
  assert.match(context, /search_solia_profile_claims/);
  assert.match(context, /search_solia_assistant_history/);
  assert.match(context, /search_solia_knowledge/);
  assert.match(context, /Authorization/);
  assert.doesNotMatch(context, /import_solia_knowledge|record_solia_|method\s*=\s*"(?:PUT|PATCH|DELETE)"/i);
});

test('local Apple brain remains available only as legacy/fallback code, not the primary speaking path', () => {
  assert.match(brain, /FoundationModels/);
  assert.match(brain, /SystemLanguageModel\.default/);
  assert.match(brain, /LanguageModelSession/);
  assert.doesNotMatch(swift, /JarvisNativeBrain\(/);
  assert.doesNotMatch(swift, /brain\.answer|say\(response\)/);
});

test('speaker identity is explicitly unverified until a real voice verifier exists', () => {
  assert.match(swift, /Locutor não verificado/);
  assert.match(swift, /Speaker ID\/voiceprint ainda é um módulo separado/);
  assert.match(diagnostics, /Reconhecimento da voz da Sol/);
  assert.match(diagnostics, /Pendente: transcrição não equivale a speaker verification\/voiceprint/);
});

test('device diagnostics expose current live readiness, session and memory without provider secrets', () => {
  assert.match(diagnostics, /Microfone/);
  assert.match(diagnostics, /Gemini Live/);
  assert.match(diagnostics, /Sessão privada/);
  assert.match(diagnostics, /Memória privada/);
  assert.doesNotMatch(diagnostics, /GEMINI_API_KEY|OPENAI_API_KEY|OPENROUTER_API_KEY|AI_GATEWAY_API_KEY/);
  assert.match(swift, /Diagnóstico deste iPhone/);
});

test('Mac handoff script generates project and typechecks with Apple SDK before Xcode install step', () => {
  assert.match(bootstrap, /xcodegen generate --spec project\.yml/);
  assert.match(bootstrap, /xcodebuild/);
  assert.match(bootstrap, /CODE_SIGNING_ALLOWED=NO/);
  assert.match(bootstrap, /JarvisNative\.xcodeproj/);
  assert.doesNotMatch(bootstrap, /curl\s|wget\s|sudo\s/i);
});
