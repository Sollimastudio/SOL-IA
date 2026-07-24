import { classifyInput } from '../core/router';
import { evaluateVisionaryPotential } from '../core/visionarySkill';
import type { MemoryQuery, MemoryRecord } from '../types/memory';
import {
  isSecureMemoryEnabled,
  isSupabaseConfigured,
  supabase
} from './supabaseClient';

export type RepositoryResult<T = undefined> = {
  ok: boolean;
  message: string;
  data?: T;
};

type InsertResult = {
  error: { message: string } | null;
};

function explainSupabaseError(message: string): string {
  const lower = message.toLowerCase();

  if (lower.includes('relation') || lower.includes('does not exist') || lower.includes('schema cache')) {
    return 'A migracao segura ainda nao foi aplicada no Supabase.';
  }

  if (lower.includes('row-level security') || lower.includes('rls') || lower.includes('permission denied') || lower.includes('violates row-level')) {
    return 'A protecao RLS recusou a operacao. Entre novamente e confirme que os dados pertencem a sua conta.';
  }

  if (lower.includes('invalid api key') || lower.includes('jwt') || lower.includes('401')) {
    return 'A sessao ou a configuracao do Supabase e invalida. Entre novamente.';
  }

  if (lower.includes('failed to fetch') || lower.includes('network')) {
    return 'Falha de conexao com o cofre. Tente novamente sem expor a ideia em outro lugar.';
  }

  return 'O cofre recusou a operacao. Confira a migracao, a sessao e as politicas RLS.';
}

function withTimeout<T>(promise: Promise<T>, milliseconds = 8000): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) => {
      window.setTimeout(() => reject(new Error('Tempo limite ao acessar o cofre.')), milliseconds);
    })
  ]);
}

async function requireVerifiedUser(): Promise<RepositoryResult<{ id: string }>> {
  if (!isSecureMemoryEnabled) {
    return {
      ok: false,
      message: 'Gravacao bloqueada: ative o cofre somente depois de aplicar a migracao segura.'
    };
  }

  if (!isSupabaseConfigured || !supabase) {
    return { ok: false, message: 'Supabase ainda nao configurado.' };
  }

  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) {
    return { ok: false, message: 'Entre no cofre antes de salvar ou consultar memoria privada.' };
  }

  return { ok: true, message: 'Usuario verificado.', data: { id: data.user.id } };
}

function safeSearchPattern(search: string): string {
  return search.trim().replace(/[%_]/g, '');
}

export async function saveIdeaCapture(rawText: string): Promise<RepositoryResult<MemoryRecord>> {
  try {
    if (!rawText.trim()) {
      return { ok: false, message: 'Nada para salvar.' };
    }

    const auth = await requireVerifiedUser();
    if (!auth.ok || !supabase) return { ok: false, message: auth.message };

    const box = classifyInput(rawText);
    const vision = evaluateVisionaryPotential(rawText);
    const is3amCapture = /3 da manha|madrugada|perdi o sono|insonia|sono/.test(rawText.toLowerCase());

    const insertRequest = supabase
      .from('memories')
      .insert({
        type: is3amCapture ? 'capture_3am' : 'idea_capture',
        title: 'Captura Sol.IA — ' + box,
        content: rawText,
        tags: [box.toLowerCase(), is3amCapture ? '3am' : 'capture'],
        origin: 'conversation',
        metadata: {
          box,
          vision,
          source: 'solia_secure_vault',
          createdBy: 'Sol.IA Eu Nao Desapareco'
        }
      })
      .select('*')
      .single();

    const { data, error } = await withTimeout(
      Promise.resolve(insertRequest) as Promise<{ data: MemoryRecord | null; error: InsertResult['error'] }>
    );

    if (error || !data) {
      const errorMessage = error?.message || 'Resposta vazia do cofre.';
      return {
        ok: false,
        message: 'Erro ao salvar: ' + errorMessage + ' Diagnostico: ' + explainSupabaseError(errorMessage)
      };
    }

    return {
      ok: true,
      data,
      message: 'Ideia protegida no seu cofre como ' + (is3amCapture ? 'capture_3am' : 'idea_capture') + '.'
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return {
      ok: false,
      message: 'Falha ao salvar: ' + message + ' Diagnostico: ' + explainSupabaseError(message)
    };
  }
}

export async function listMemories(query: MemoryQuery = {}): Promise<RepositoryResult<MemoryRecord[]>> {
  try {
    const auth = await requireVerifiedUser();
    if (!auth.ok || !supabase) return { ok: false, message: auth.message, data: [] };

    const limit = Math.min(Math.max(query.limit ?? 12, 1), 50);
    let request = supabase
      .from('memories')
      .select('id, owner_id, project_id, type, title, content, tags, origin, created_at, updated_at, metadata')
      .order('created_at', { ascending: false })
      .limit(limit);

    if (query.type) request = request.eq('type', query.type);
    if (query.search?.trim()) {
      request = request.ilike('content', `%${safeSearchPattern(query.search)}%`);
    }

    const { data, error } = await withTimeout(Promise.resolve(request));
    if (error) {
      return {
        ok: false,
        message: 'Nao foi possivel consultar o cofre. ' + explainSupabaseError(error.message),
        data: []
      };
    }

    return {
      ok: true,
      message: `${data?.length ?? 0} memoria(s) privada(s) encontrada(s).`,
      data: (data ?? []) as MemoryRecord[]
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return { ok: false, message: explainSupabaseError(message), data: [] };
  }
}
