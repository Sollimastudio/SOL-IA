export function meteredAiBlockResponse(env = {}) {
  if (env.JARVIS_METERED_AI_ENABLED === 'true') return null;
  return Response.json({ ok: false, errorCode: 'ai_budget_paused', stage: 'budget', persisted: false,
    error: 'Geração de IA pausada pelo orçamento zero. Use Guardar no cofre: essa operação não chama um modelo de IA.'
  }, { status: 403, headers: { 'Cache-Control': 'private, no-store', 'X-Content-Type-Options': 'nosniff' } });
}
