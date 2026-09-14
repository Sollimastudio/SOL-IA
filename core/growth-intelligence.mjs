export const GROWTH_INTELLIGENCE_VERSION = '2026-09-14.1';

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
- Novo modelo pode entrar como especialista/sandbox antes de substituir o principal.
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
