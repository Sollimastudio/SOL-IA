import assert from 'node:assert/strict';
import test from 'node:test';
import { PROFILE_PACKS } from '../core/profile-packs.mjs';
import {
  CORE_SKILLS,
  SKILL_PACKS,
  assertGlobalSkillPacksNeutral,
  getSkillPack,
  resolveCoreSkills,
  resolveSkillPacks
} from '../core/skill-packs.mjs';

test('global skill packs are client-neutral and reference only known core skills', () => {
  assert.equal(assertGlobalSkillPacksNeutral(), true);
  for (const item of Object.values(SKILL_PACKS)) {
    for (const skillId of item.skills) assert.ok(CORE_SKILLS[skillId], `${item.id} references unknown ${skillId}`);
  }
});

test('every built-in profile pack references registered skill packs', () => {
  for (const profile of Object.values(PROFILE_PACKS)) {
    const resolved = resolveSkillPacks([...profile.skillPacks]);
    assert.equal(resolved.length, profile.skillPacks.length, `${profile.id} must not reference missing packs`);
  }
});

test('agency and company profiles resolve to different capability mixes', () => {
  const agency = new Set(resolveCoreSkills([...PROFILE_PACKS['agency-default'].skillPacks]).map(item => item.id));
  const company = new Set(resolveCoreSkills([...PROFILE_PACKS['company-default'].skillPacks]).map(item => item.id));
  assert.ok(agency.has('content'));
  assert.ok(agency.has('media'));
  assert.ok(company.has('sales'));
  assert.ok(company.has('knowledge'));
  assert.notDeepEqual([...agency].sort(), [...company].sort());
});

test('unknown skill packs never resolve to an invented capability', () => {
  assert.equal(getSkillPack('does-not-exist'), null);
  assert.deepEqual(resolveSkillPacks(['does-not-exist']), []);
  assert.deepEqual(resolveCoreSkills(['does-not-exist']), []);
});
