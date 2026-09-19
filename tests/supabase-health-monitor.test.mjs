import test from 'node:test';
import assert from 'node:assert/strict';
import { createSupabaseHealthMonitorHandler, summarizeSupabaseHealthAdvisors } from '../server/supabase-health-monitor.mjs';
const env={SUPABASE_URL:'https://rkkpbmzrucaghrojujvb.supabase.co',SUPABASE_PUBLISHABLE_KEY:'sb_publishable_test',SUPABASE_PROJECT_REF:'rkkpbmzrucaghrojujvb'};
const req=()=>new Request('https://jarvis.test/api/jarvis-supabase-health',{headers:{Authorization:'Bearer test-session'}});
const res=(status,body)=>new Response(JSON.stringify(body),{status,headers:{'Content-Type':'application/json'}});
function harness({authorized=true,advisor={results:[]}}={}) {
  const calls=[];
  const fetchImpl=async(url,init={})=>{
    calls.push({url:String(url),init});
    if(String(url).endsWith('/auth/v1/user')) return res(200,{id:'user-1'});
    if(String(url).includes('/rest/v1/solia_pilot_users?')) return res(200,authorized?[{owner_id:'user-1',can_use_ai:true,model:null}]:[]);
    if(String(url).includes('/advisors/run')) return res(200,advisor);
    throw new Error(`unexpected ${url}`);
  };
  return {calls,fetchImpl};
}
test('summary distinguishes finding, clear and unavailable',()=>{
  assert.equal(summarizeSupabaseHealthAdvisors({results:[]}).status,'clear');
  assert.equal(summarizeSupabaseHealthAdvisors({code:'advisor_check_unavailable'}).status,'unable_to_assess');
  assert.deepEqual(summarizeSupabaseHealthAdvisors({name:'log_auth_error_rate_high',detail:'private'}).findings,['log_auth_error_rate_high']);
});
test('missing management token fails closed before Management API',async()=>{
  const h=harness(); const response=await createSupabaseHealthMonitorHandler({env,fetchImpl:h.fetchImpl})(req());
  assert.equal(response.status,503); assert.equal((await response.json()).errorCode,'health_monitor_unconfigured');
  assert.equal(h.calls.some(c=>c.url.includes('api.supabase.com')),false);
});
test('authorized monitor uses new endpoint and minimizes findings',async()=>{
  const h=harness({advisor:{checks:[{name:'log_storage_error_rate_high',detail:'do not expose me'}]}});
  const response=await createSupabaseHealthMonitorHandler({env:{...env,SUPABASE_MANAGEMENT_ACCESS_TOKEN:'management-test'},fetchImpl:h.fetchImpl})(req());
  assert.equal(response.status,200); const call=h.calls.find(c=>c.url.includes('api.supabase.com'));
  assert.equal(call.url,'https://api.supabase.com/v2/projects/rkkpbmzrucaghrojujvb/advisors/run'); assert.equal(call.init.method,'POST');
  assert.equal(h.calls.some(c=>c.url.includes('logs.all')),false); const body=await response.json();
  assert.deepEqual(body.findings,['log_storage_error_rate_high']); assert.equal(JSON.stringify(body).includes('do not expose me'),false);
});
test('unauthorized account never reaches Management API',async()=>{
  const h=harness({authorized:false});
  const response=await createSupabaseHealthMonitorHandler({env:{...env,SUPABASE_MANAGEMENT_ACCESS_TOKEN:'management-test'},fetchImpl:h.fetchImpl})(req());
  assert.equal(response.status,403); assert.equal(h.calls.some(c=>c.url.includes('api.supabase.com')),false);
});
