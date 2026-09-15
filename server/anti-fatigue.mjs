export const ANTI_FATIGUE_VERSION = '2026-09-15.1';

const STOP = new Set(`a o as os um uma uns umas de da do das dos e em no na nos nas por para com sem que se eu voce você ele ela eles elas isso isto aquilo meu minha meus minhas seu sua seus suas ja já mais muito muita muitos muitas como quando onde porque porquê sobre pra pro estou está esta tava ter tenho tem foi ser esse essa esses essas aqui ali la lá quero preciso jarvis sol`.split(/\s+/));

const normalize = (value) => String(value ?? '')
  .normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();

function terms(text) {
  return normalize(text).split(/[^a-z0-9]+/)
    .filter((word) => word.length > 2 && !STOP.has(word));
}

function uniqueTerms(text) {
  return [...new Set(terms(text))];
}

function overlap(a, b) {
  if (!a.length || !b.length) return 0;
  const right = new Set(b);
  const common = a.filter((word) => right.has(word)).length;
  return common / Math.max(new Set([...a, ...b]).size, 1);
}

function label(text, max = 5) {
  const frequency = new Map();
  for (const word of terms(text)) frequency.set(word, (frequency.get(word) ?? 0) + 1);
  return [...frequency.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, max)
    .map(([word]) => word)
    .join(' · ');
}

export function analyzeConversation(history = [], message = '') {
  const userTurns = history
    .filter((turn) => turn?.role === 'user' && typeof turn.content === 'string')
    .map((turn) => turn.content.trim())
    .filter(Boolean);

  const rootText = userTurns[0] || message;
  const previous = userTurns.at(-1) || '';
  const currentTerms = uniqueTerms(message);
  const previousTerms = uniqueTerms(previous);
  const rootTerms = uniqueTerms(rootText);
  const priorTerms = uniqueTerms(userTurns.join(' '));

  const similarityToPrevious = Number(overlap(currentTerms, previousTerms).toFixed(3));
  const similarityToRoot = Number(overlap(currentTerms, rootTerms).toFixed(3));
  const repeatedTerms = currentTerms.filter((word) => priorTerms.includes(word));
  const newTerms = currentTerms.filter((word) => !priorTerms.includes(word));
  const novelty = currentTerms.length ? Number((newTerms.length / currentTerms.length).toFixed(3)) : 1;

  const hasHistory = userTurns.length > 0;
  const likelyRepeat = hasHistory && similarityToPrevious >= 0.5 && novelty <= 0.45;
  const likelyBranch = hasHistory && similarityToRoot < 0.12 && novelty >= 0.45;
  const returnNeeded = likelyBranch && rootTerms.length > 0;

  return {
    rootTopic: label(rootText) || 'conversa atual',
    currentBranch: label(message) || 'continuação',
    similarityToPrevious,
    novelty,
    likelyRepeat,
    likelyBranch,
    returnNeeded,
    repeatedSignals: repeatedTerms.slice(0, 8),
    newSignals: newTerms.slice(0, 8),
    userTurnCount: userTurns.length + 1,
    guidance: likelyRepeat
      ? 'A fala retoma conteúdo semelhante. Não mencione contagem ou repreenda; responda ao delta novo e mantenha o fio.'
      : likelyBranch
        ? 'A fala abriu um galho distante do fio inicial. Acompanhe o galho sem perder o fio principal; só proponha retorno se isso ajudar a concluir a tarefa.'
        : 'Continue o fio atual e preserve decisões e pendências anteriores.'
  };
}
