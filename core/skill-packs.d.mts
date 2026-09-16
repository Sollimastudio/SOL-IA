export const SKILL_PACKS_VERSION: string;

export type CoreSkillDefinition = Readonly<{
  id: string;
  label: string;
  purpose: string;
}>;

export type SkillPackDefinition = Readonly<{
  id: string;
  label: string;
  scope: 'global' | 'template';
  description: string;
  skills: readonly string[];
}>;

export const CORE_SKILLS: Readonly<Record<string, CoreSkillDefinition>>;
export const SKILL_PACKS: Readonly<Record<string, SkillPackDefinition>>;

export function getSkillPack(id: string): SkillPackDefinition | null;
export function resolveSkillPacks(ids?: string[]): SkillPackDefinition[];
export function resolveCoreSkills(ids?: string[]): CoreSkillDefinition[];
export function assertGlobalSkillPacksNeutral(): true;
