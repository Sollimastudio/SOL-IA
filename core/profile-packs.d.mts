export const PROFILE_PACKS_VERSION: string;

export type ProfilePackDefinition = Readonly<{
  id: string;
  scope: 'global' | 'tenant';
  label: string;
  description: string;
  skillPacks: readonly string[];
}>;

export const PROFILE_PACKS: Readonly<Record<string, ProfilePackDefinition>>;
export function getProfilePack(profilePackId?: string): ProfilePackDefinition | null;
export function resolveProfilePack(profilePackId?: string): ProfilePackDefinition;
export function isSolSpecificProfile(profilePackId?: string): boolean;
export function assertGlobalProfileNeutral(profilePack?: ProfilePackDefinition): true;
