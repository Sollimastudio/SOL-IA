import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);

export const supabaseDiagnostics = {
  hasUrl: Boolean(supabaseUrl),
  hasAnonKey: Boolean(supabaseAnonKey),
  urlPreview: supabaseUrl ? supabaseUrl.replace(/^https:\/\//, '').slice(0, 12) + '...' : 'ausente',
  anonKeyPreview: supabaseAnonKey ? supabaseAnonKey.slice(0, 6) + '...' : 'ausente'
};

export const supabase = isSupabaseConfigured
  ? createClient(supabaseUrl as string, supabaseAnonKey as string)
  : null;
