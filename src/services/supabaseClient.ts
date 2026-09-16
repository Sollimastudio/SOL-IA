import { createClient } from '@supabase/supabase-js';

const FALLBACK_SUPABASE_URL = 'https://rkkpbmzrucaghrojujvb.supabase.co';
const FALLBACK_SUPABASE_PUBLISHABLE_KEY = 'sb_publishable_XhsUjBPVRtC-0DBfMNDQTA_FaK8XFj8';

const envUrl = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const envPublishableKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string | undefined;
const envLegacyAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;
const envKey = envPublishableKey?.trim() ? envPublishableKey : envLegacyAnonKey;
const hasEnvUrl = Boolean(envUrl?.trim());
const hasEnvKey = Boolean(envKey?.trim());
const envPairComplete = hasEnvUrl && hasEnvKey;
const envPairPartial = hasEnvUrl !== hasEnvKey;

const supabaseUrl = envPairComplete ? envUrl!.trim() : envPairPartial ? undefined : FALLBACK_SUPABASE_URL;
const supabasePublishableKey = envPairComplete ? envKey!.trim() : envPairPartial ? undefined : FALLBACK_SUPABASE_PUBLISHABLE_KEY;

export const isSupabaseConfigured = Boolean(supabaseUrl && supabasePublishableKey);
export const isSecureMemoryEnabled =
  isSupabaseConfigured && import.meta.env.VITE_SECURE_MEMORY_ENABLED !== 'false';

export const supabaseDiagnostics = {
  hasUrl: Boolean(supabaseUrl),
  hasPublishableKey: Boolean(supabasePublishableKey),
  hasAnonKey: Boolean(supabasePublishableKey),
  usingLegacyAnonEnvName: !envPublishableKey?.trim() && Boolean(envLegacyAnonKey?.trim()),
  secureMemoryEnabled: isSecureMemoryEnabled,
  source: envPairComplete ? 'environment' : envPairPartial ? 'invalid_partial_environment' : 'verified_pilot_fallback'
};

export const supabase = isSupabaseConfigured
  ? createClient(supabaseUrl as string, supabasePublishableKey as string, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
        flowType: 'pkce'
      }
    })
  : null;
