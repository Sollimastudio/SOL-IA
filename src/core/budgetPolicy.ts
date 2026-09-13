// A build setting cannot authorize server spending; the server has a separate fail-closed gate.
export const meteredAiEnabled = import.meta.env.VITE_JARVIS_METERED_AI_ENABLED === 'true';
