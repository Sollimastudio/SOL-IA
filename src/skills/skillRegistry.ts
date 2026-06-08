import { analyzeLegalRisk } from './lexVanguard';
import { analyzeDailyState } from './dailyGuardian';
import { evaluateVisionaryPotential } from '../core/visionarySkill';

export type SkillId =
  | 'imperatriz'
  | 'vault'
  | 'visionaria'
  | 'lex_vanguard'
  | 'publisher'
  | 'vida_diaria'
  | 'performance';

export type SkillDefinition = {
  id: SkillId;
  label: string;
  description: string;
  publicSafe: boolean;
};

export const skillRegistry: SkillDefinition[] = [
  {
    id: 'imperatriz',
    label: 'Imperatriz',
    description: 'Diretoria executiva da Sol.IA: traduz caos, escolhe prioridade e conduz.',
    publicSafe: false
  },
  {
    id: 'vault',
    label: 'Vault',
    description: 'Cofre de memoria, fatos intocaveis, capitulos, decisoes e documentos.',
    publicSafe: false
  },
  {
    id: 'visionaria',
    label: 'Visionaria',
    description: 'Avalia oportunidades em ideias brutas: obra, conteudo, venda, metodo ou maquina.',
    publicSafe: true
  },
  {
    id: 'lex_vanguard',
    label: 'Lex Vanguard',
    description: 'Guardiao juridico-preventivo para risco legal, contrato, promessa e exposicao.',
    publicSafe: false
  },
  {
    id: 'publisher',
    label: 'Publisher',
    description: 'Escrita, revisao, organizacao editorial e exportacao de documentos.',
    publicSafe: false
  },
  {
    id: 'vida_diaria',
    label: 'Vida Diaria',
    description: 'Guardiao de rotina, impulso, decisao sensivel, insonia e excesso mental.',
    publicSafe: false
  },
  {
    id: 'performance',
    label: 'Performance',
    description: 'Modo publico para lives, stories, aulas e demonstracoes sem expor intimidade.',
    publicSafe: true
  }
];

export function runSkillSnapshot(input: string) {
  return {
    visionaria: evaluateVisionaryPotential(input),
    lexVanguard: analyzeLegalRisk(input),
    vidaDiaria: analyzeDailyState(input)
  };
}
