export const GPT6_LUNA_GATEWAY_MODEL = 'openai/gpt-6-luna';
export const GPT6_SOL_GATEWAY_MODEL = 'openai/gpt-6-sol';

const ALLOWED = new Set([GPT6_LUNA_GATEWAY_MODEL, GPT6_SOL_GATEWAY_MODEL]);
const enabled = value => value === 'true';

function safeModel(value, fallback) {
  const candidate = typeof value === 'string' ? value.trim() : '';
  return ALLOWED.has(candidate) ? candidate : fallback;
}

export function resolveGpt6Experiment(env = {}) {
  const requested = enabled(env.JARVIS_GPT6_EXPERIMENT_ENABLED);
  const meteredAiEnabled = enabled(env.JARVIS_METERED_AI_ENABLED);
  const zeroCostModeActive = enabled(env.JARVIS_ZERO_COST_VERIFIED);
  const defaultModel = safeModel(env.JARVIS_GPT6_DEFAULT_MODEL, GPT6_LUNA_GATEWAY_MODEL);
  const complexModel = safeModel(env.JARVIS_GPT6_COMPLEX_MODEL, GPT6_SOL_GATEWAY_MODEL);

  const activationAllowed = requested && meteredAiEnabled && !zeroCostModeActive;
  const reason = !requested
    ? 'experiment_disabled'
    : zeroCostModeActive
      ? 'zero_cost_mode_active'
      : !meteredAiEnabled
        ? 'metered_ai_disabled'
        : 'ready_for_supervised_test';

  return {
    requested,
    meteredAiEnabled,
    zeroCostModeActive,
    activationAllowed,
    reason,
    defaultModel,
    complexModel,
    transportRecommendation: 'responses_api_for_reasoning',
    productionAutoSwitch: false
  };
}
