import { CORE_PROFILE_PACK_ID, SOL_PILOT_PROFILE_PACK_ID } from './tenant-context.mjs';

export const PROFILE_PACKS_VERSION = '2026-09-16.1';

export const PROFILE_PACKS = Object.freeze({
  [CORE_PROFILE_PACK_ID]: Object.freeze({
    id: CORE_PROFILE_PACK_ID,
    scope: 'global',
    label: 'Jarvis Core',
    description: 'Comportamento neutro e reutilizável do produto. Não contém identidade, obra, rotina ou regra privada de nenhum cliente.',
    skillPacks: Object.freeze(['executive-core', 'research-core', 'risk-core', 'operations-core'])
  }),
  [SOL_PILOT_PROFILE_PACK_ID]: Object.freeze({
    id: SOL_PILOT_PROFILE_PACK_ID,
    scope: 'tenant',
    label: 'Sol Pilot Profile',
    description: 'Configuração explícita do piloto da Sol. Pode referenciar voz autoral, ativos, projetos e rotinas da Sol sem virar default global.',
    skillPacks: Object.freeze(['personal-executive', 'creator-business', 'editorial-author', 'growth-monetization'])
  }),
  'agency-default': Object.freeze({
    id: 'agency-default',
    scope: 'tenant',
    label: 'Agency Pack',
    description: 'Base para agência com múltiplos clientes isolados, conteúdo, campanhas, aprovações, métricas e margem.',
    skillPacks: Object.freeze(['executive-core', 'agency-ops', 'content-studio', 'paid-media', 'analytics'])
  }),
  'company-default': Object.freeze({
    id: 'company-default',
    scope: 'tenant',
    label: 'Company Pack',
    description: 'Base empresarial com departamentos, projetos, conhecimento institucional, operações, risco, vendas e indicadores.',
    skillPacks: Object.freeze(['executive-core', 'operations-core', 'sales', 'knowledge', 'analytics', 'risk-core'])
  })
});

export function getProfilePack(profilePackId = CORE_PROFILE_PACK_ID) {
  const id = String(profilePackId ?? '').trim() || CORE_PROFILE_PACK_ID;
  return PROFILE_PACKS[id] ?? null;
}

export function resolveProfilePack(profilePackId) {
  return getProfilePack(profilePackId) ?? PROFILE_PACKS[CORE_PROFILE_PACK_ID];
}

export function isSolSpecificProfile(profilePackId) {
  return String(profilePackId ?? '').trim() === SOL_PILOT_PROFILE_PACK_ID;
}

export function assertGlobalProfileNeutral(profilePack = PROFILE_PACKS[CORE_PROFILE_PACK_ID]) {
  if (!profilePack || profilePack.scope !== 'global' || profilePack.id !== CORE_PROFILE_PACK_ID) {
    throw new Error('invalid_global_profile');
  }
  const serialized = JSON.stringify(profilePack).toLowerCase();
  const forbidden = ['magnetus', 'relacione-se', 'reposicione', 'sol lima', 'morte em vida'];
  if (forbidden.some(term => serialized.includes(term))) throw new Error('client_specific_content_in_global_profile');
  return true;
}
