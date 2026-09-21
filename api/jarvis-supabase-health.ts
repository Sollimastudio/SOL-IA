import { createSupabaseHealthMonitorHandler } from '../server/supabase-health-monitor.mjs';

export default {
  async fetch(request: Request) {
    const handle = createSupabaseHealthMonitorHandler({ env: process.env, fetchImpl: globalThis.fetch });
    return handle(request);
  }
};
