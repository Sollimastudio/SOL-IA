export const GROWTH_INTELLIGENCE_VERSION = '2026-09-25.1';

export const GROWTH_INTELLIGENCE_DIRECTIVE = `CRESCIMENTO_CONTINUO=${GROWTH_INTELLIGENCE_VERSION}
OBJETIVO: manter o Jarvis atual, verificavel e progressivamente melhor sem confundir novidade com verdade nem tendencia com estrategia comprovada.

FRESCOR E FONTES:
- Assuntos que mudam rapido (algoritmos, modelos, APIs, limites, precos e ferramentas) exigem fonte recente antes de uma recomendacao operacional.
- Prioridade de evidencia: documentacao/changelog oficial > dados reais das contas da Sol > experimento controlado proprio > fontes tecnicas independentes > relatos/anedotas.
- Nao afirmar que uma plataforma mudou o algoritmo apenas porque criadores disseram que mudou. Registrar como hipotese ate haver evidencia adequada.
- Nunca manter regra de plataforma como eterna. Toda regra operacional deve ter data, origem e status de frescor.

ALGORITMOS SOCIAIS:
- Nao existe formula unica que o Jarvis possa controlar. Trabalhar com elegibilidade para recomendacao, originalidade, retencao, sinais de interesse, satisfacao, compartilhamento, busca e resultados observados na conta quando esses dados estiverem disponiveis.
- Separar principio oficial da plataforma, hipotese de mercado e padrao observado na conta da Sol.
- Mudanca detectada nao altera automaticamente estrategia. Comparar antes/depois e testar em pequena escala.

HORARIO E EMOCAO:
- Nao usar uma suposta tabela universal do tipo “manha = reflexao, tarde = raiva” como fato. Sem evidencia robusta e especifica, isso e apenas hipotese.
- Preferir horario baseado na audiencia real da conta e no objetivo do conteudo. Se a ferramenta de melhores horarios devolver apenas zeros ou amostra insuficiente, declarar ausencia de dado e executar testes por faixas horarias.
- O Jarvis pode testar combinacoes de horario + emocao dominante + formato + tema, mas deve aprender da resposta real da audiencia e nunca manipular vulnerabilidade emocional.

LOOP DE APRENDIZAGEM DE CONTEUDO:
1. Antes de publicar, registrar objetivo, plataforma, formato, tema, gancho, emocao predominante, CTA/oferta, horario e hipotese.
2. Depois, coletar metricas em janelas comparaveis (ex.: inicial, 24h, 7d quando aplicavel).
3. Avaliar conforme objetivo: descoberta, retencao, autoridade, comunidade, lead, venda, renovacao etc.
4. Comparar com baseline semelhante; nao premiar viralizacao que piora audiencia/compras/retencao.
5. Atualizar recomendacao com nivel de confianca e quantidade de evidencias.
6. Preservar resultado negativo: erro observado tambem e aprendizado.

MODELOS E FERRAMENTAS:
- Modelo mais novo nao e automaticamente melhor. Todo candidato deve ser comparado com a baseline em qualidade, aderencia as instrucoes, memoria/contexto, ferramentas, latencia, estabilidade, privacidade e custo.
- O radar e obrigatoriamente multifornnecedor: uma novidade da OpenAI deve ser comparada, quando relevante, com Gemini, Anthropic, Apple/on-device, Vercel Gateway e outros candidatos oficiais plausiveis para a mesma tarefa.
- Nunca produzir recomendacao operacional baseada apenas no fornecedor ja instalado. Procurar alternativas e registrar quando outra opcao parece superior, mais barata, mais segura ou mais simples.
- Custo-beneficio deve ser avaliado por tarefa, incluindo custo unitario, custo real por execucao, qualidade, latencia, estabilidade, privacidade, integracao e custo de troca.
- Novo modelo pode entrar como especialista/sandbox antes de substituir o principal.
- Mudanca material pode gerar Opportunity Card, benchmark, branch e preview automaticamente quando forem reversiveis e sem gasto novo; promocao de modelo/provedor em producao continua supervisionada.
- Nao trocar provedor, ativar custo ou desativar fallback so porque apareceu um lancamento.
- Registrar deprecacoes e prazos para evitar ficar preso a modelo obsoleto.

SURPRESA COM CONTROLE:
- Surpreender significa encontrar oportunidade, conexao ou melhoria que a usuaria nao precisou pedir explicitamente, desde que baseada em fontes/dados e sem executar acao externa irreversivel sem permissao.
- Crescimento deve reduzir trabalho mental da Sol, nao produzir notificacoes, relatorios e novidades sem utilidade.
- Relatorios completos sob demanda; alerta espontaneo so quando houver oportunidade relevante, risco, quebra, deprecacao ou mudanca que materialmente altere uma decisao.

REGRA FINAL: novidade entra como sinal; evidencia transforma em aprendizado; benchmark transforma em melhoria; somente melhoria comprovada vira padrao.`;

export const FRESHNESS_WINDOWS_DAYS = Object.freeze({
  platform_algorithm: 14,
  model_or_api: 7,
  account_best_time: 7,
  pricing_or_limits: 7,
  evergreen_research: 3650
});

export function freshnessStatus(observedAt, kind, now = new Date()) {
  const maxDays = FRESHNESS_WINDOWS_DAYS[kind];
  if (!Number.isFinite(maxDays)) throw new TypeError('unknown freshness kind');
  const observed = new Date(observedAt);
  const current = new Date(now);
  if (!Number.isFinite(observed.getTime()) || !Number.isFinite(current.getTime())) throw new TypeError('invalid date');
  const ageDays = Math.max(0, (current.getTime() - observed.getTime()) / 86400000);
  return { kind, ageDays: Number(ageDays.toFixed(2)), maxDays, status: ageDays <= maxDays ? 'current' : 'stale' };
}

export function bestTimeSignal(rows = []) {
  const points = Array.isArray(rows) ? rows.flatMap(day => Array.isArray(day?.bestTimesByHour)
    ? day.bestTimesByHour.map(slot => ({ dayOfWeek: day.dayOfWeek, hourOfDay: slot.hourOfDay, value: Number(slot.value) }))
    : []) : [];
  const valid = points.filter(point => Number.isFinite(point.value) && point.value > 0 && Number.isInteger(point.hourOfDay));
  if (!valid.length) return { status: 'insufficient_account_data', recommendations: [] };
  const top = [...valid].sort((a, b) => b.value - a.value).slice(0, 5);
  return { status: 'account_signal_available', recommendations: top };
}

export function modelPromotionDecision(candidate, baseline, thresholds = {}) {
  const minQualityGain = Number.isFinite(thresholds.minQualityGain) ? thresholds.minQualityGain : 0;
  const maxCostMultiplier = Number.isFinite(thresholds.maxCostMultiplier) ? thresholds.maxCostMultiplier : 1.25;
  const maxLatencyMultiplier = Number.isFinite(thresholds.maxLatencyMultiplier) ? thresholds.maxLatencyMultiplier : 1.5;
  for (const item of [candidate, baseline]) {
    if (!item || !Number.isFinite(item.quality) || !Number.isFinite(item.cost) || !Number.isFinite(item.latency)) {
      throw new TypeError('candidate and baseline need quality, cost and latency');
    }
  }
  const qualityGain = candidate.quality - baseline.quality;
  const costMultiplier = baseline.cost === 0 ? (candidate.cost === 0 ? 1 : Infinity) : candidate.cost / baseline.cost;
  const latencyMultiplier = baseline.latency === 0 ? (candidate.latency === 0 ? 1 : Infinity) : candidate.latency / baseline.latency;
  const promote = qualityGain >= minQualityGain && costMultiplier <= maxCostMultiplier && latencyMultiplier <= maxLatencyMultiplier;
  return {
    promote,
    qualityGain: Number(qualityGain.toFixed(4)),
    costMultiplier: Number.isFinite(costMultiplier) ? Number(costMultiplier.toFixed(4)) : Infinity,
    latencyMultiplier: Number.isFinite(latencyMultiplier) ? Number(latencyMultiplier.toFixed(4)) : Infinity,
    reason: promote ? 'benchmark_passed' : 'benchmark_not_better_enough'
  };
}


export const DEFAULT_PROVIDER_WEIGHTS = Object.freeze({
  quality: 0.28,
  capabilityFit: 0.20,
  privacy: 0.12,
  stability: 0.12,
  evidence: 0.10,
  cost: 0.10,
  latency: 0.05,
  integrationEffort: 0.03
});

function finiteMetric(value, name) {
  const n = Number(value);
  if (!Number.isFinite(n)) throw new TypeError(`invalid ${name}`);
  return n;
}

function clamp01(value, name) {
  const n = finiteMetric(value, name);
  if (n < 0 || n > 1) throw new RangeError(`${name} must be between 0 and 1`);
  return n;
}

function positiveOrZero(value, name) {
  const n = finiteMetric(value, name);
  if (n < 0) throw new RangeError(`${name} must be >= 0`);
  return n;
}

export function providerCandidateScore(candidate, baseline, weights = DEFAULT_PROVIDER_WEIGHTS) {
  if (!candidate?.id || !candidate?.provider) throw new TypeError('candidate needs id and provider');
  if (!baseline?.id || !baseline?.provider) throw new TypeError('baseline needs id and provider');

  const mergedWeights = { ...DEFAULT_PROVIDER_WEIGHTS, ...(weights || {}) };
  const weightTotal = Object.values(mergedWeights).reduce((sum, value) => sum + positiveOrZero(value, 'weight'), 0);
  if (weightTotal <= 0) throw new RangeError('weights must sum above zero');

  const quality = clamp01(candidate.quality, 'quality');
  const capabilityFit = clamp01(candidate.capabilityFit, 'capabilityFit');
  const privacy = clamp01(candidate.privacy, 'privacy');
  const stability = clamp01(candidate.stability, 'stability');
  const evidence = clamp01(candidate.evidence, 'evidence');
  const integrationEffort = clamp01(candidate.integrationEffort, 'integrationEffort');
  const baselineCost = positiveOrZero(baseline.costPerTask, 'baseline.costPerTask');
  const candidateCost = positiveOrZero(candidate.costPerTask, 'candidate.costPerTask');
  const baselineLatency = positiveOrZero(baseline.latencyMs, 'baseline.latencyMs');
  const candidateLatency = positiveOrZero(candidate.latencyMs, 'candidate.latencyMs');

  const costScore = baselineCost === 0
    ? (candidateCost === 0 ? 1 : 0)
    : Math.max(0, Math.min(1, baselineCost / Math.max(candidateCost, baselineCost * 0.01)));
  const latencyScore = baselineLatency === 0
    ? (candidateLatency === 0 ? 1 : 0)
    : Math.max(0, Math.min(1, baselineLatency / Math.max(candidateLatency, baselineLatency * 0.01)));
  const integrationScore = 1 - integrationEffort;

  const raw =
    quality * mergedWeights.quality +
    capabilityFit * mergedWeights.capabilityFit +
    privacy * mergedWeights.privacy +
    stability * mergedWeights.stability +
    evidence * mergedWeights.evidence +
    costScore * mergedWeights.cost +
    latencyScore * mergedWeights.latency +
    integrationScore * mergedWeights.integrationEffort;

  return {
    id: candidate.id,
    provider: candidate.provider,
    score: Number((raw / weightTotal).toFixed(4)),
    costScore: Number(costScore.toFixed(4)),
    latencyScore: Number(latencyScore.toFixed(4)),
    evidence,
    status: candidate.status || 'candidate'
  };
}

export function compareProviderCandidates(candidates, baselineId, options = {}) {
  if (!Array.isArray(candidates) || candidates.length < 2) throw new TypeError('need at least two provider candidates');
  const ids = new Set();
  for (const candidate of candidates) {
    if (!candidate?.id || ids.has(candidate.id)) throw new TypeError('candidate ids must be unique');
    ids.add(candidate.id);
  }
  const baseline = candidates.find(item => item.id === baselineId);
  if (!baseline) throw new TypeError('baseline not found');

  const minEvidence = Number.isFinite(options.minEvidence) ? options.minEvidence : 0.7;
  const minScoreGain = Number.isFinite(options.minScoreGain) ? options.minScoreGain : 0.03;
  const maxCostMultiplier = Number.isFinite(options.maxCostMultiplier) ? options.maxCostMultiplier : 1.35;
  const scored = candidates.map(candidate => providerCandidateScore(candidate, baseline, options.weights));
  const baselineScore = scored.find(item => item.id === baselineId).score;

  const ranked = scored.map(score => {
    const candidate = candidates.find(item => item.id === score.id);
    const baselineCost = positiveOrZero(baseline.costPerTask, 'baseline.costPerTask');
    const candidateCost = positiveOrZero(candidate.costPerTask, 'candidate.costPerTask');
    const costMultiplier = baselineCost === 0 ? (candidateCost === 0 ? 1 : Infinity) : candidateCost / baselineCost;
    const scoreGain = score.score - baselineScore;
    const evidenceOk = score.evidence >= minEvidence;
    const costOk = costMultiplier <= maxCostMultiplier;
    const promotionReady = score.id !== baselineId && evidenceOk && costOk && scoreGain >= minScoreGain;
    return {
      ...score,
      scoreGain: Number(scoreGain.toFixed(4)),
      costMultiplier: Number.isFinite(costMultiplier) ? Number(costMultiplier.toFixed(4)) : Infinity,
      decision: score.id === baselineId
        ? 'baseline'
        : promotionReady
          ? 'candidate_for_supervised_promotion'
          : evidenceOk
            ? 'benchmark_or_observe'
            : 'insufficient_evidence'
    };
  }).sort((a, b) => b.score - a.score);

  return {
    baselineId,
    bestObservedId: ranked[0].id,
    supervisedPromotionRequired: true,
    ranked
  };
}

export function buildProviderOpportunityCard({
  task,
  trigger,
  factStatus,
  sourceUrls = [],
  comparison,
  recommendation,
  doNotAutoChange = []
} = {}) {
  if (!task || !trigger || !comparison || !recommendation) throw new TypeError('opportunity card missing required fields');
  const allowedFactStatus = new Set(['official_fact', 'observed_data', 'controlled_test', 'hypothesis']);
  if (!allowedFactStatus.has(factStatus)) throw new TypeError('invalid factStatus');
  return {
    schema: 'jarvis-provider-opportunity-v1',
    task: String(task),
    trigger: String(trigger),
    factStatus,
    sourceUrls: Array.isArray(sourceUrls) ? sourceUrls.filter(Boolean).map(String) : [],
    comparison,
    recommendation: String(recommendation),
    doNotAutoChange: Array.isArray(doNotAutoChange) ? doNotAutoChange.filter(Boolean).map(String) : [],
    requiresHumanApprovalForProductionChange: true
  };
}
