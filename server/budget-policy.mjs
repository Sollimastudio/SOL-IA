export function meteredAiBlockResponse(env = {}) {
  if (env.JARVIS_METERED_AI_ENABLED === 'true' || env.JARVIS_ZERO_COST_VERIFIED === 'true') return null;
  return Response.json({ ok: false, errorCode: 'ai_budget_paused', stage: 'budget', persisted: false,
    error: 'Geração de IA paga continua bloqueada. O Jarvis só pode responder com modelo verificado em tempo real como custo zero; caso contrário, use a captura no cofre.'
  }, { status: 403, headers: { 'Cache-Control': 'private, no-store', 'X-Content-Type-Options': 'nosniff' } });
}
