export type SoliaIntentCategory = 'OBRA' | 'METODO' | 'OFERTA' | 'MAQUINA' | 'ESTACIONAMENTO';

export type SoliaExecutionMode =
  | 'SOCORRO_ME_PUXA'
  | 'MODO_DESPEJO'
  | 'EXECUCAO_DIRETA'
  | 'CURADORIA'
  | 'ESCRITA'
  | 'TECNOLOGIA'
  | 'MARKETING'
  | 'MEMORIA';

export interface PromptAutopilotResult {
  rawInput: string;
  interpretedNeed: string;
  category: SoliaIntentCategory;
  mode: SoliaExecutionMode;
  professionalPrompt: string;
  constraints: string[];
  mustProtect: string[];
  nextAction: string;
}

// Compatibility exports; the active server uses the same versioned module.
export { SOLIA_PROMPT_AUTOPILOT_VERSION, SOLIA_PROMPT_AUTOPILOT_DIRECTIVE, buildPromptAutopilot } from './prompt-autopilot.mjs';
