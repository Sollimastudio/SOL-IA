import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const swift = fs.readFileSync('ios/JarvisNative/Sources/JarvisNativeApp.swift', 'utf8');
const project = fs.readFileSync('ios/JarvisNative/project.yml', 'utf8');

test('native iOS shell exposes a system voice action without provider secrets', () => {
  assert.match(swift, /StartJarvisConversationIntent/);
  assert.match(swift, /openAppWhenRun\s*=\s*true/);
  assert.match(swift, /AppShortcutsProvider/);
  assert.doesNotMatch(swift, /OPENAI_API_KEY|OPENROUTER_API_KEY|AI_GATEWAY_API_KEY|service_role/i);
});

test('native voice session uses play-and-record, Brazilian speech and explicit stop', () => {
  assert.match(swift, /\.playAndRecord/);
  assert.match(swift, /pt-BR/);
  assert.match(swift, /Tô aqui\. Pode falar\./);
  assert.match(swift, /encerrar/);
  assert.match(project, /UIBackgroundModes/);
  assert.match(project, /audio/);
});
