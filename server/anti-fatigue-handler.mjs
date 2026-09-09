import { analyzeConversation } from './anti-fatigue.mjs';

export function withAntiFatigue(baseHandler) {
  return async function antiFatigueHandler(request) {
    let orientation = null;
    try {
      const clone = request.clone();
      if (clone.method === 'POST' && clone.headers.get('content-type')?.toLowerCase().startsWith('application/json')) {
        const body = await clone.json();
        if (body?.mode !== 'public' && typeof body?.message === 'string' && Array.isArray(body?.history)) {
          orientation = analyzeConversation(body.history, body.message);
        }
      }
    } catch {
      // Orientation is advisory. It must never block the secure chat path.
    }

    const response = await baseHandler(request);
    if (!orientation || !response.headers.get('content-type')?.includes('application/json')) return response;

    try {
      const payload = await response.clone().json();
      if (!payload || typeof payload !== 'object') return response;
      const headers = new Headers(response.headers);
      headers.set('Cache-Control', 'private, no-store');
      return Response.json({ ...payload, orientation }, { status: response.status, headers });
    } catch {
      return response;
    }
  };
}
