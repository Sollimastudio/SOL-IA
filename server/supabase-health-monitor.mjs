import { resolvePilotRuntime } from './pilot-runtime.mjs';

export const SUPABASE_HEALTH_MONITOR_VERSION = 'supabase-health-readonly-v1';
const PROJECT_REF = 'rkkpbmzrucaghrojujvb';
const CODES = ['log_data_api_error_rate_high','log_auth_error_rate_high','log_storage_error_rate_high','log_edge_function_error_rate_high'];
const json = (status, body) => Response.json(body, {status, headers:{'Cache-Control':'private, no-store','X-Content-Type-Options':'nosniff','X-Jarvis-Health-Monitor-Version':SUPABASE_HEALTH_MONITOR_VERSION}});
const text = value => typeof value === 'string' ? value.trim() : '';

export function summarizeSupabaseHealthAdvisors(payload) {
  const encoded = JSON.stringify(payload ?? {});
  const findings = CODES.filter(code => encoded.includes(`"${code}"`));
  const unavailable = encoded.includes('"advisor_check_unavailable"');
  return { status: findings.length ? 'finding' : unavailable ? 'unable_to_assess' : 'clear', findings, unavailable };
}
export function createSupabaseHealthMonitorHandler({ env = process.env, fetchImpl = globalThis.fetch } = {}) {
  return async request => {
    if (request.method !== 'GET') return json(405,{ok:false,error:'Use GET.'});
    const runtime = await resolvePilotRuntime(request, env, fetchImpl, undefined, { resolveProvider:false });
    if (!runtime.diagnostics.pilotVerified) {
      const reason=runtime.diagnostics.readinessReason;
      const status=['session_missing','session_invalid'].includes(reason)?401:reason==='pilot_not_authorized'?403:503;
      return json(status,{ok:false,errorCode:reason,mode:'read_only'});
    }
    const token=text(env.SUPABASE_MANAGEMENT_ACCESS_TOKEN);
    if (!token) return json(503,{ok:false,errorCode:'health_monitor_unconfigured',mode:'read_only'});
    const ref=text(env.SUPABASE_PROJECT_REF)||PROJECT_REF;
    if (!/^[a-z0-9]{20}$/.test(ref)) return json(503,{ok:false,errorCode:'project_ref_invalid',mode:'read_only'});
    let response;
    try {
      response=await fetchImpl(`https://api.supabase.com/v2/projects/${ref}/advisors/run`,{
        method:'POST',headers:{Authorization:`Bearer ${token}`,Accept:'application/json'},cache:'no-store',redirect:'error',
        signal:AbortSignal.any([request.signal,AbortSignal.timeout(10000)])
      });
    } catch { return json(503,{ok:false,errorCode:'health_advisor_unavailable',mode:'read_only'}); }
    if (!response.ok) return json(502,{ok:false,errorCode:'health_advisor_failed',mode:'read_only',upstreamStatus:response.status});
    let payload;
    try { payload=await response.json(); } catch { return json(502,{ok:false,errorCode:'health_advisor_invalid',mode:'read_only'}); }
    const summary=summarizeSupabaseHealthAdvisors(payload);
    console.info('[JARVIS_SUPABASE_HEALTH]',JSON.stringify({version:SUPABASE_HEALTH_MONITOR_VERSION,status:summary.status,findingCount:summary.findings.length}));
    return json(200,{ok:true,version:SUPABASE_HEALTH_MONITOR_VERSION,mode:'read_only',...summary});
  };
}
