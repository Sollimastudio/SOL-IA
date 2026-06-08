export type LexRiskLevel = 'baixo' | 'medio' | 'alto' | 'critico';

export type LexVanguardReport = {
  riskLevel: LexRiskLevel;
  triggers: string[];
  warning: string;
  recommendation: string;
  pauseRequired: boolean;
};

const legalTriggers = [
  'contrato', 'assinar', 'rescisao', 'procon', 'processo', 'cnpj', 'advogado', 'indenizacao',
  'termo', 'promessa', 'garantia', 'resultado garantido', 'direito autoral', 'imagem', 'voz',
  'dados pessoais', 'lgpd', 'compra', 'venda', 'investimento', 'sociedade', 'parceria', 'reembolso'
];

const impulseTriggers = [
  'agora', 'urgente', 'fechar hoje', 'na hora', 'impulso', 'nao posso perder', 'desconto acaba',
  'assinei', 'comprei', 'vou comprar', 'vou fechar', 'sem pensar'
];

export function analyzeLegalRisk(input: string): LexVanguardReport {
  const text = input.toLowerCase();
  const triggers = [...legalTriggers, ...impulseTriggers].filter((trigger) => text.includes(trigger));
  const hasLegal = legalTriggers.some((trigger) => text.includes(trigger));
  const hasImpulse = impulseTriggers.some((trigger) => text.includes(trigger));

  let riskLevel: LexRiskLevel = 'baixo';
  if (hasLegal) riskLevel = 'medio';
  if (hasLegal && hasImpulse) riskLevel = 'alto';
  if (/processo|indenizacao|service_role|dados pessoais|lgpd|contrato assinado|assinei/.test(text)) riskLevel = 'critico';

  const pauseRequired = riskLevel === 'alto' || riskLevel === 'critico';

  return {
    riskLevel,
    triggers,
    pauseRequired,
    warning: triggers.length
      ? 'Lex Vanguard detectou possivel risco juridico, contratual, financeiro ou de exposicao.'
      : 'Nenhum gatilho juridico evidente detectado nesta entrada.',
    recommendation: pauseRequired
      ? 'Pausa obrigatoria: nao assinar, comprar, prometer, publicar ou fechar nada antes de revisar com criterios e, se necessario, advogado humano.'
      : 'Prosseguir com atencao. Se envolver contrato, dinheiro, promessa publica ou dados pessoais, acione revisao juridica preventiva.'
  };
}
