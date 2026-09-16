export const SKILL_PACKS_VERSION = '2026-09-16.1';

export const CORE_SKILLS = Object.freeze({
  executive: Object.freeze({ id: 'executive', label: 'Executive', purpose: 'Priorizar, coordenar e transformar intenção em próxima ação verificável.' }),
  research: Object.freeze({ id: 'research', label: 'Research', purpose: 'Pesquisar, validar fontes, comparar evidência e registrar incerteza.' }),
  knowledge: Object.freeze({ id: 'knowledge', label: 'Knowledge', purpose: 'Recuperar, organizar e versionar conhecimento com proveniência.' }),
  risk: Object.freeze({ id: 'risk', label: 'Risk', purpose: 'Detectar risco jurídico, reputacional, financeiro, técnico e operacional sem substituir profissionais regulamentados.' }),
  content: Object.freeze({ id: 'content', label: 'Content', purpose: 'Planejar, criar, adaptar e revisar conteúdo conforme objetivo e canal.' }),
  growth: Object.freeze({ id: 'growth', label: 'Growth', purpose: 'Relacionar aquisição, distribuição, oferta, retenção e aprendizado com métricas reais.' }),
  analytics: Object.freeze({ id: 'analytics', label: 'Analytics', purpose: 'Ler dados, comparar baselines e separar sinal de ruído.' }),
  operations: Object.freeze({ id: 'operations', label: 'Operations', purpose: 'Coordenar processos, filas, tarefas, custos, integrações e comprovantes de execução.' }),
  engineering: Object.freeze({ id: 'engineering', label: 'Engineering', purpose: 'Diagnosticar software, preparar mudanças isoladas, testar e preservar rollback.' }),
  finance: Object.freeze({ id: 'finance', label: 'Finance', purpose: 'Organizar caixa, custos, assinaturas, cenários e prioridades financeiras sem inventar saldo ou transação.' }),
  sales: Object.freeze({ id: 'sales', label: 'Sales', purpose: 'Organizar pipeline, proposta, follow-up, oferta e conversão dentro das autorizações do tenant.' }),
  learning: Object.freeze({ id: 'learning', label: 'Learning', purpose: 'Ensinar, explicar, estruturar treinamento e adaptar profundidade ao usuário.' }),
  media: Object.freeze({ id: 'media', label: 'Media', purpose: 'Roteiro audiovisual, edição, voz, imagem, vídeo, live e produção multimodal.' })
});

const pack = (id, label, skills, description, scope = 'template') => Object.freeze({
  id,
  label,
  scope,
  description,
  skills: Object.freeze(skills)
});

export const SKILL_PACKS = Object.freeze({
  'executive-core': pack('executive-core', 'Executive Core', ['executive'], 'Direção, prioridade e coordenação básica.', 'global'),
  'research-core': pack('research-core', 'Research Core', ['research', 'knowledge'], 'Pesquisa, evidência e conhecimento rastreável.', 'global'),
  'risk-core': pack('risk-core', 'Risk Core', ['risk'], 'Camada transversal de risco e cautela.', 'global'),
  'operations-core': pack('operations-core', 'Operations Core', ['operations', 'analytics'], 'Execução, processos, métricas e confiabilidade.', 'global'),
  'personal-executive': pack('personal-executive', 'Personal Executive', ['executive', 'operations', 'learning'], 'Segundo cérebro operacional para pessoa física/profissional.'),
  'creator-business': pack('creator-business', 'Creator Business', ['content', 'growth', 'sales', 'analytics', 'media'], 'Conteúdo, distribuição, audiência, oferta e monetização.'),
  'editorial-author': pack('editorial-author', 'Editorial / Author', ['content', 'knowledge', 'research', 'media'], 'Livros, obras, pesquisa, edição e derivados.'),
  'growth-monetization': pack('growth-monetization', 'Growth & Monetization', ['growth', 'sales', 'finance', 'analytics'], 'Receita, conversão, retenção, custos e experimentação.'),
  'agency-ops': pack('agency-ops', 'Agency Operations', ['executive', 'operations', 'analytics', 'risk'], 'Operação multi-cliente, margem, aprovação e governança.'),
  'content-studio': pack('content-studio', 'Content Studio', ['content', 'media', 'research'], 'Produção multiformato e adaptação por canal.'),
  'paid-media': pack('paid-media', 'Paid Media', ['growth', 'analytics', 'finance', 'risk'], 'Mídia paga, orçamento, performance e controle de risco.'),
  analytics: pack('analytics', 'Analytics', ['analytics'], 'Indicadores, baseline, leitura e comparação de resultados.'),
  sales: pack('sales', 'Sales', ['sales', 'analytics', 'growth'], 'Pipeline, proposta, follow-up e conversão.'),
  knowledge: pack('knowledge', 'Knowledge', ['knowledge', 'research'], 'Conhecimento institucional e pesquisa com proveniência.'),
  engineering: pack('engineering', 'Engineering', ['engineering', 'operations', 'risk'], 'Software, infraestrutura, testes, observabilidade e mudança segura.'),
  finance: pack('finance', 'Finance', ['finance', 'analytics', 'risk'], 'Caixa, custos, orçamento e cenários financeiros.')
});

export function getSkillPack(id) {
  return SKILL_PACKS[String(id ?? '').trim()] ?? null;
}

export function resolveSkillPacks(ids = []) {
  if (!Array.isArray(ids)) throw new Error('invalid_skill_pack_list');
  return ids.map(getSkillPack).filter(Boolean);
}

export function resolveCoreSkills(ids = []) {
  const packs = resolveSkillPacks(ids);
  const skillIds = [...new Set(packs.flatMap(item => item.skills))];
  return skillIds.map(id => CORE_SKILLS[id]).filter(Boolean);
}

export function assertGlobalSkillPacksNeutral() {
  const forbidden = ['sol lima', 'magnetus', 'relacione-se', 'reposicione', 'morte em vida'];
  for (const item of Object.values(SKILL_PACKS).filter(candidate => candidate.scope === 'global')) {
    const serialized = JSON.stringify(item).toLowerCase();
    if (forbidden.some(term => serialized.includes(term))) throw new Error('client_specific_content_in_global_skill_pack');
    for (const skillId of item.skills) {
      if (!CORE_SKILLS[skillId]) throw new Error('unknown_core_skill');
    }
  }
  return true;
}
