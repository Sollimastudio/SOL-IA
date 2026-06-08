import { classifyInput, ProjectBox } from './router';

export type VisionaryEvaluation = {
  box: ProjectBox;
  editorialPotential: number;
  contentPotential: number;
  salesPotential: number;
  urgency: number;
  dispersionRisk: number;
  recommendedUse: string;
};

function scoreByWords(text: string, words: string[]): number {
  const value = words.reduce((score, word) => score + (text.includes(word) ? 1 : 0), 0);
  return Math.min(10, Math.max(1, value * 2));
}

export function evaluateVisionaryPotential(input: string): VisionaryEvaluation {
  const text = input.toLowerCase();
  const box = classifyInput(input);

  const editorialPotential = scoreByWords(text, ['historia', 'livro', 'capitulo', 'cena', 'mae', 'pai', 'oripe', 'dor', 'infancia']);
  const contentPotential = scoreByWords(text, ['story', 'video', 'reels', 'post', 'gancho', 'viral', 'conteudo', 'legenda']);
  const salesPotential = scoreByWords(text, ['vender', 'oferta', 'magnetus', 'antidoto', 'mentoria', 'curso', 'pagina', 'copy']);
  const urgency = scoreByWords(text, ['agora', 'urgente', 'sumir', 'esquecer', 'socorro', '3 da manha', 'sono']);
  const dispersionRisk = scoreByWords(text, ['tudo', 'mil', 'nao sei', 'perdi', 'bagunca', 'caos', 'misturado']);

  let recommendedUse = 'Guardar no estacionamento e revisar depois.';
  if (box === 'OBRA') recommendedUse = 'Salvar como memoria de obra, cena ou capitulo.';
  if (box === 'METODO') recommendedUse = 'Salvar como conceito do Metodo Posicione-se.';
  if (box === 'OFERTA') recommendedUse = 'Transformar em conteudo, copy ou funil.';
  if (box === 'MAQUINA') recommendedUse = 'Transformar em requisito tecnico ou melhoria da Sol.IA.';

  return { box, editorialPotential, contentPotential, salesPotential, urgency, dispersionRisk, recommendedUse };
}
