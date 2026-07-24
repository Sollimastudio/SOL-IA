import { analyzeLegalRisk } from './lexVanguard';
import { analyzeDailyState } from './dailyGuardian';
import { evaluateVisionaryPotential } from '../core/visionarySkill';

export type SkillId =
  | 'imperatriz'
  | 'vault'
  | 'visionaria'
  | 'lex_vanguard'
  | 'publisher'
  | 'content_studio'
  | 'mentor'
  | 'motion_video'
  | 'meta_ads'
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
    description: 'Cofre privado de memoria, fatos intocaveis, capitulos, decisoes e documentos.',
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
    description: 'Livros, ebooks, revisao, organizacao editorial e exportacao de documentos.',
    publicSafe: false
  },
  {
    id: 'content_studio',
    label: 'Narrativas',
    description: 'Carrosseis, stories, artigos, copy, VSL e reutilizacao multiformato.',
    publicSafe: true
  },
  {
    id: 'mentor',
    label: 'Mentoria',
    description: 'Anamnese, Metodo Posicione-se, diagnostico e acompanhamento guiado.',
    publicSafe: false
  },
  {
    id: 'motion_video',
    label: 'Motion / Video',
    description: 'Roteiro visual, cortes, legendas, edicao, FFmpeg e publicacao preparada.',
    publicSafe: true
  },
  {
    id: 'meta_ads',
    label: 'Meta Ads',
    description: 'Leitura de metricas e recomendacoes. Nao cria, pausa nem altera campanhas.',
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
