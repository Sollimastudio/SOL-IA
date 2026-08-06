export type SolIntent =
  | 'general'
  | 'book'
  | 'content'
  | 'vsl'
  | 'mentoring'
  | 'video'
  | 'meta_ads'
  | 'memory'
  | 'legal'
  | 'daily';

export type SpecialistId =
  | 'jarvis_executive'
  | 'vault_memory'
  | 'publisher_editorial'
  | 'chronoscribe_content'
  | 'mentor_posicionamento'
  | 'motion_video'
  | 'meta_ads_strategist'
  | 'lex_vanguard'
  | 'daily_guardian';

export type ExecutionMode = 'analysis_only' | 'draft' | 'approval_required';

export type RouteDecision = {
  intent: SolIntent;
  primarySpecialist: SpecialistId;
  supportingSpecialists: SpecialistId[];
  confidence: number;
  matchedSignals: string[];
  sourceRepositories: string[];
  executionMode: ExecutionMode;
  requiresApproval: boolean;
  reason: string;
};

type RouteRule = {
  intent: Exclude<SolIntent, 'general'>;
  primarySpecialist: SpecialistId;
  supportingSpecialists: SpecialistId[];
  signals: string[];
  sourceRepositories: string[];
  reason: string;
};

const routeRules: RouteRule[] = [
  {
    intent: 'meta_ads',
    primarySpecialist: 'meta_ads_strategist',
    supportingSpecialists: ['chronoscribe_content', 'lex_vanguard'],
    signals: [
      'meta ads', 'facebook ads', 'instagram ads', 'andromeda', 'advantage+',
      'gerenciador de anuncios', 'campanha', 'conjunto de anuncios', 'anuncio',
      'criativo', 'pixel', 'capi', 'ctr', 'cpm', 'cpa', 'roas'
    ],
    sourceRepositories: [
      'adscript-ai',
      'sol-lima-neuromarketing-agent',
      'Sistema-de-Gest-o-de-Campanhas-de-Marketing-Digital-Avan-ado'
    ],
    reason: 'Pedido relacionado a estrategia, criativo, medicao ou operacao de midia paga.'
  },
  {
    intent: 'vsl',
    primarySpecialist: 'chronoscribe_content',
    supportingSpecialists: ['publisher_editorial', 'meta_ads_strategist'],
    signals: ['vsl', 'video de vendas', 'carta de vendas', 'script de vendas', 'roteiro de vendas'],
    sourceRepositories: ['Narrativas-Chronoscribe', 'universal-legacy-content-engine'],
    reason: 'Pedido de narrativa de venda longa, estruturada e orientada a conversao.'
  },
  {
    intent: 'video',
    primarySpecialist: 'motion_video',
    supportingSpecialists: ['chronoscribe_content'],
    signals: [
      'video', 'reels', 'shorts', 'tiktok', 'editar', 'ffmpeg', 'whisper',
      'legenda', 'transicao', 'animar', 'frame', 'corte'
    ],
    sourceRepositories: ['videoup_app', 'maestro-viral-lab', 'motion-hacker'],
    reason: 'Pedido que exige planejamento, roteiro, edicao ou processamento audiovisual.'
  },
  {
    intent: 'mentoring',
    primarySpecialist: 'mentor_posicionamento',
    supportingSpecialists: ['jarvis_executive', 'vault_memory'],
    signals: ['mentoria', 'mentor', 'sessao', 'anamnese', 'plano de acompanhamento', 'exercicio guiado'],
    sourceRepositories: ['Sol-IA-Mentor', 'posicione-se-sistema', 'Supera-ia-ecossistema'],
    reason: 'Pedido de orientacao guiada, diagnostico ou acompanhamento metodologico.'
  },
  {
    intent: 'book',
    primarySpecialist: 'publisher_editorial',
    supportingSpecialists: ['chronoscribe_content', 'vault_memory'],
    signals: [
      'livro', 'manuscrito', 'capitulo', 'ebook', 'workbook', 'diagramar',
      'revisao editorial', 'kindle', 'docx', 'pdf'
    ],
    sourceRepositories: [
      'Narrativas-Chronoscribe',
      'Tronco-ia',
      'sistema-escrita-elite',
      'ecossistema-editorial-inteligente'
    ],
    reason: 'Pedido editorial que precisa preservar voz, estrutura, versao e fonte canonica.'
  },
  {
    intent: 'content',
    primarySpecialist: 'chronoscribe_content',
    supportingSpecialists: ['jarvis_executive'],
    signals: ['conteudo', 'carrossel', 'story', 'stories', 'post', 'legenda', 'artigo', 'seo', 'copy', 'gancho', 'viral'],
    sourceRepositories: ['Narrativas-Chronoscribe', 'universal-legacy-content-engine', 'viralgenix-pro'],
    reason: 'Pedido de conteudo organico, persuasivo ou reutilizavel em diferentes formatos.'
  },
  {
    intent: 'memory',
    primarySpecialist: 'vault_memory',
    supportingSpecialists: ['jarvis_executive'],
    signals: ['lembrar', 'memoria', 'guardar', 'salvar', 'fato intocavel', 'decisao anterior', 'historico'],
    sourceRepositories: ['SOL-IA', 'JARVIS-SOL'],
    reason: 'Pedido depende de continuidade, fatos pessoais ou decisoes ja registradas.'
  },
  {
    intent: 'legal',
    primarySpecialist: 'lex_vanguard',
    supportingSpecialists: ['jarvis_executive'],
    signals: ['contrato', 'processo', 'advogado', 'lgpd', 'direito autoral', 'marca registrada', 'reembolso', 'garantia legal'],
    sourceRepositories: ['SOL-IA'],
    reason: 'Pedido contem risco juridico, de privacidade, promessa ou exposicao.'
  },
  {
    intent: 'daily',
    primarySpecialist: 'daily_guardian',
    supportingSpecialists: ['jarvis_executive'],
    signals: ['madrugada', 'insonia', 'impulso', 'nao sei por onde comecar', 'estou perdida', 'bagunca'],
    sourceRepositories: ['SOL-IA'],
    reason: 'Pedido pede desaceleracao, organizacao simples ou protecao contra decisao impulsiva.'
  }
];

const lowEnergySignals = [
  'estou me sentindo mal',
  'estou mal',
  'nao estou bem',
  'passando mal',
  'sem energia',
  'muito cansada',
  'exausta',
  'nao consigo fazer',
  'nao dou conta agora',
  'preciso deitar',
  'preciso descansar',
  'estou tonta',
  'estou enjoada',
  'estou fraca'
];

const paidMediaWriteActionPattern =
  /\b(criar|crie|publicar|publique|ativar|ative|pausar|pause|duplicar|duplique|editar|edite|alterar|altere|aumentar|aumente|reduzir|reduza|mudar|mude|excluir|exclua|subir|lancar|lance|executar|execute|configurar|configure)\b/;

const paidMediaObjectPattern =
  /\b(campanha|campanhas|anuncio|anuncios|conjunto de anuncios|orcamento|budget|pixel|capi|publico|publicos|segmentacao)\b/;

function normalize(input: string): string {
  return input
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim();
}

function matchSignals(text: string, signals: string[]): string[] {
  return signals.filter((signal) => text.includes(normalize(signal)));
}

function requestsPaidMediaWrite(text: string): boolean {
  return paidMediaWriteActionPattern.test(text) && paidMediaObjectPattern.test(text);
}

export function routeCapability(input: string): RouteDecision {
  const text = normalize(input);
  const lowEnergyMatches = matchSignals(text, lowEnergySignals);

  if (lowEnergyMatches.length > 0) {
    return {
      intent: 'daily',
      primarySpecialist: 'daily_guardian',
      supportingSpecialists: ['jarvis_executive'],
      confidence: Math.min(0.98, 0.82 + lowEnergyMatches.length * 0.04),
      matchedSignals: lowEnergyMatches,
      sourceRepositories: ['SOL-IA'],
      executionMode: 'draft',
      requiresApproval: false,
      reason: 'Mal-estar ou energia muito baixa devem reduzir a carga antes de qualquer tarefa, decisao ou configuracao.'
    };
  }

  for (const rule of routeRules) {
    const matchedSignals = matchSignals(text, rule.signals);
    if (matchedSignals.length === 0) continue;

    const requiresApproval = rule.intent === 'meta_ads' && requestsPaidMediaWrite(text);

    return {
      intent: rule.intent,
      primarySpecialist: rule.primarySpecialist,
      supportingSpecialists: rule.supportingSpecialists,
      confidence: Math.min(0.98, 0.7 + matchedSignals.length * 0.06),
      matchedSignals,
      sourceRepositories: rule.sourceRepositories,
      executionMode: requiresApproval ? 'approval_required' : rule.intent === 'meta_ads' ? 'analysis_only' : 'draft',
      requiresApproval,
      reason: rule.reason
    };
  }

  return {
    intent: 'general',
    primarySpecialist: 'jarvis_executive',
    supportingSpecialists: ['vault_memory'],
    confidence: 0.6,
    matchedSignals: [],
    sourceRepositories: ['SOL-IA', 'Tronco-ia', 'JARVIS-SOL'],
    executionMode: 'draft',
    requiresApproval: false,
    reason: 'Nenhum dominio especializado dominou; Jarvis organiza o pedido e escolhe o proximo passo.'
  };
}
