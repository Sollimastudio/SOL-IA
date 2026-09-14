import test from 'node:test';
import assert from 'node:assert/strict';
import { SOL_PRESENCE_PROFILE, SOL_PRESENCE_PROFILE_VERSION } from '../core/presence-profile.mjs';
import { SOLIA_PROMPT_AUTOPILOT_DIRECTIVE } from '../core/prompt-autopilot.mjs';

test('Sol presence profile is versioned and active in Jarvis prompt', () => {
  assert.match(SOL_PRESENCE_PROFILE_VERSION, /^\d{4}-\d{2}-\d{2}\.\d+$/);
  assert.ok(SOLIA_PROMPT_AUTOPILOT_DIRECTIVE.includes(SOL_PRESENCE_PROFILE));
});

test('public content hides internal archetype engineering by default', () => {
  assert.match(SOL_PRESENCE_PROFILE, /não mencionar estes eixos, arquétipos/i);
  assert.match(SOL_PRESENCE_PROFILE, /sem que o conteúdo nomeie arquétipos/i);
});

test('profile uses ethical persuasion instead of covert manipulation', () => {
  assert.match(SOL_PRESENCE_PROFILE, /PERSUASÃO PERMITIDA/);
  assert.match(SOL_PRESENCE_PROFILE, /manipulação subliminar ou encoberta/i);
  assert.match(SOL_PRESENCE_PROFILE, /falsa escassez/i);
  assert.match(SOL_PRESENCE_PROFILE, /prova verdadeira/i);
});

test('profile coaches Sol without turning every conversation into a lesson', () => {
  assert.match(SOL_PRESENCE_PROFILE, /Corrigir uma coisa por vez/);
  assert.match(SOL_PRESENCE_PROFILE, /não transformar toda interação em aula/i);
});
