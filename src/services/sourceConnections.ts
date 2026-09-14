import { supabase } from './supabaseClient';

export type SourceConnection = {
  id: string;
  provider: string;
  external_id: string;
  label: string;
  auth_mode: string;
  status: 'pending' | 'connected' | 'disabled' | 'error' | 'bridge';
  sync_enabled: boolean;
  permissions: Record<string, unknown>;
  metadata: Record<string, unknown>;
  last_synced_at: string | null;
  last_error: string | null;
};

export async function listSourceConnections(): Promise<SourceConnection[]> {
  if (!supabase) return [];
  const { data, error } = await supabase
    .from('solia_source_connections')
    .select('id,provider,external_id,label,auth_mode,status,sync_enabled,permissions,metadata,last_synced_at,last_error')
    .order('created_at', { ascending: true });
  if (error) throw new Error('Não foi possível consultar as conexões agora.');
  return (data ?? []) as SourceConnection[];
}
