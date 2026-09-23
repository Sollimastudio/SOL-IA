export const GPT6_LUNA_GATEWAY_MODEL: 'openai/gpt-6-luna';
export const GPT6_SOL_GATEWAY_MODEL: 'openai/gpt-6-sol';

export type Gpt6ExperimentState = {
  requested: boolean;
  meteredAiEnabled: boolean;
  zeroCostModeActive: boolean;
  activationAllowed: boolean;
  reason: 'experiment_disabled' | 'zero_cost_mode_active' | 'metered_ai_disabled' | 'ready_for_supervised_test';
  defaultModel: 'openai/gpt-6-luna' | 'openai/gpt-6-sol';
  complexModel: 'openai/gpt-6-luna' | 'openai/gpt-6-sol';
  transportRecommendation: 'responses_api_for_reasoning';
  productionAutoSwitch: false;
};

export function resolveGpt6Experiment(env?: Record<string, string | undefined>): Gpt6ExperimentState;
