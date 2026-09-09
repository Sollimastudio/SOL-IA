// Explicit configuration fixtures, not real credentials or a login bypass.
const scenario = new URLSearchParams(location.search).get('case');
export const isSecureMemoryEnabled = scenario !== 'disabled';
export const isSupabaseConfigured = scenario !== 'unconfigured';
export const supabase = null;
export const supabaseDiagnostics = {
  hasUrl: isSupabaseConfigured, hasAnonKey: isSupabaseConfigured,
  secureMemoryEnabled: isSecureMemoryEnabled
};
