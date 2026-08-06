export type DailyGuardianMode = 'neutro' | 'pausa' | '3am' | 'decisao_sensivel' | 'baixa_energia' | 'vida_diaria';

export type DailyGuardianReport = {
  mode: DailyGuardianMode;
  alert: string;
  suggestedAction: string;
  shouldDelayDecision: boolean;
};

const delayTriggers = [
  'comprar', 'assinar', 'fechar', 'mandar mensagem', 'terminar', 'bloquear', 'expor', 'postar agora',
  'responder agora', 'investir', 'contrato', 'parceria', 'urgente', 'nao posso perder'
];

const nightTriggers = ['3 da manha', 'madrugada', 'perdi o sono', 'insonia', 'nao consigo dormir', 'acordei'];

const lowEnergyTriggers = [
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

export function analyzeDailyState(input: string): DailyGuardianReport {
  const text = input
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();
  const isLowEnergy = lowEnergyTriggers.some((trigger) => text.includes(trigger));
  const isNight = nightTriggers.some((trigger) => text.includes(trigger));
  const isDelay = delayTriggers.some((trigger) => text.includes(trigger));
  const isSensitive = /familia|mae|marido|filho|dinheiro|saude|diagnostico|medicacao|processo|contrato/.test(text);

  if (isLowEnergy) {
    return {
      mode: 'baixa_energia',
      alert: 'Mal-estar ou energia muito baixa detectados. A Sol.IA reduz a carga agora.',
      suggestedAction: 'Nao exigir configuracoes, exercicios ou decisoes. Guardar o que ficou pendente e retomar somente quando a usuaria disser que voltou.',
      shouldDelayDecision: true
    };
  }

  if (isNight) {
    return {
      mode: '3am',
      alert: 'Modo 3 da Manha detectado: capturar sem decidir.',
      suggestedAction: 'Salvar a ideia bruta, classificar e revisar apenas depois de dormir ou com mais regulacao emocional.',
      shouldDelayDecision: true
    };
  }

  if (isDelay && isSensitive) {
    return {
      mode: 'decisao_sensivel',
      alert: 'Decisao sensivel com risco de impulso detectada.',
      suggestedAction: 'Pausa obrigatoria. Nao fechar, comprar, publicar, responder ou assinar agora. Criar rascunho e revisar depois.',
      shouldDelayDecision: true
    };
  }

  if (isDelay) {
    return {
      mode: 'pausa',
      alert: 'Possivel impulso detectado.',
      suggestedAction: 'Esperar, registrar a vontade e pedir uma segunda avaliacao antes de agir.',
      shouldDelayDecision: true
    };
  }

  return {
    mode: 'vida_diaria',
    alert: 'Nenhum risco forte detectado. Seguir com organizacao simples.',
    suggestedAction: 'Classificar, salvar e transformar em proxima acao pequena.',
    shouldDelayDecision: false
  };
}
