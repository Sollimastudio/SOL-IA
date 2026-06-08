export type DailyGuardianMode = 'neutro' | 'pausa' | '3am' | 'decisao_sensivel' | 'vida_diaria';

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

export function analyzeDailyState(input: string): DailyGuardianReport {
  const text = input.toLowerCase();
  const isNight = nightTriggers.some((trigger) => text.includes(trigger));
  const isDelay = delayTriggers.some((trigger) => text.includes(trigger));
  const isSensitive = /familia|mae|marido|filho|dinheiro|saude|diagnostico|medicacao|processo|contrato/.test(text);

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
