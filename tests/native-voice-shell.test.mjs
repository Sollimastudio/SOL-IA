import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const swift = fs.readFileSync('ios/JarvisNative/Sources/JarvisNativeApp.swift', 'utf8');
const auth = fs.readFileSync('ios/JarvisNative/Sources/NativeAuth.swift', 'utf8');
const context = fs.readFileSync('ios/JarvisNative/Sources/NativeContext.swift', 'utf8');
const brain = fs.readFileSync('ios/JarvisNative/Sources/NativeBrain.swift', 'utf8');
const diagnostics = fs.readFileSync('ios/JarvisNative/Sources/NativeDiagnostics.swift', 'utf8');
const bootstrap = fs.readFileSync('ios/JarvisNative/PREPARAR-JARVIS.command', 'utf8');
const project = fs.readFileSync('ios/JarvisNative/project.yml', 'utf8');
const nativeBundle = [swift, auth, context, brain, diagnostics, bootstrap].join('\n');

test('native iOS shell exposes a system voice action without provider secrets', () => {
  assert.match(swift, /StartJarvisConversationIntent/);
  assert.match(swift, /openAppWhenRun\s*=\s*true/);
  assert.match(swift, /AppShortcutsProvider/);
  assert.doesNotMatch(nativeBundle, /OPENAI_API_KEY|OPENROUTER_API_KEY|AI_GATEWAY_API_KEY|service_role/i);
});

test('native voice session uses play-and-record, Brazilian speech and explicit stop', () => {
  assert.match(swift, /\.playAndRecord/);
  assert.match(swift, /AVAudioApplication\.requestRecordPermission/);
  assert.match(swift, /pt-BR/);
  assert.match(swift, /Tô aqui\. Pode falar\./);
  assert.match(swift, /Continue falando normalmente/);
  assert.match(swift, /encerrar/);
  assert.match(project, /UIBackgroundModes/);
  assert.match(project, /audio/);
});

test('native private login mirrors web OTP flow and persists only the session in Keychain', () => {
  assert.match(auth, /\/auth\/v1\/otp/);
  assert.match(auth, /create_user/);
  assert.match(auth, /\/auth\/v1\/verify/);
  assert.match(auth, /\/auth\/v1\/token\?grant_type=refresh_token/);
  assert.match(auth, /kSecAttrAccessibleAfterFirstUnlockThisDeviceOnly/);
  assert.match(swift, /Acesso privado — uma vez neste aparelho/);
});

test('native context remains read-only and owner-scoped through authenticated RPCs', () => {
  assert.match(context, /search_solia_continuity/);
  assert.match(context, /search_solia_profile_claims/);
  assert.match(context, /search_solia_assistant_history/);
  assert.match(context, /search_solia_knowledge/);
  assert.match(context, /Authorization/);
  assert.doesNotMatch(context, /import_solia_knowledge|record_solia_|method\s*=\s*"(?:PUT|PATCH|DELETE)"/i);
});

test('native brain uses on-device Foundation Models and keeps imported sources epistemically separate', () => {
  assert.match(brain, /FoundationModels/);
  assert.match(brain, /SystemLanguageModel\.default/);
  assert.match(brain, /LanguageModelSession/);
  assert.match(brain, /supportsLocale\(Locale\(identifier: "pt-BR"\)\)/);
  assert.match(brain, /documento importado/);
  assert.match(brain, /Não afirme que executou ações externas/);
});

test('captured speech now traverses auth, private context, local reasoning and spoken reply', () => {
  assert.match(swift, /auth\.currentSession\(\)/);
  assert.match(swift, /core\.fetch\(query: text, auth: session\)/);
  assert.match(swift, /brain\.answer\(message: text, context: context\)/);
  assert.match(swift, /lastAnswer = response/);
  assert.match(swift, /say\(response\)/);
  assert.match(swift, /self\.listen\(\)/);
});

test('device diagnostics expose each required layer without sending model traffic', () => {
  assert.match(diagnostics, /Microfone/);
  assert.match(diagnostics, /Reconhecimento pt-BR/);
  assert.match(diagnostics, /Cérebro local Apple/);
  assert.match(diagnostics, /Sessão privada/);
  assert.match(diagnostics, /Memória privada/);
  assert.doesNotMatch(diagnostics, /openai|openrouter|ai-gateway/i);
  assert.match(swift, /Diagnóstico deste iPhone/);
});

test('Mac handoff script generates project and typechecks with Apple SDK before Xcode install step', () => {
  assert.match(bootstrap, /xcodegen generate --spec project\.yml/);
  assert.match(bootstrap, /xcodebuild/);
  assert.match(bootstrap, /CODE_SIGNING_ALLOWED=NO/);
  assert.match(bootstrap, /JarvisNative\.xcodeproj/);
  assert.doesNotMatch(bootstrap, /curl\s|wget\s|sudo\s/i);
});
