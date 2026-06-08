import { supabase, isSupabaseConfigured } from './supabaseClient';
import { classifyInput } from '../core/router';
import { evaluateVisionaryPotential } from '../core/visionarySkill';

export type SaveCaptureResult = {
  ok: boolean;
  message: string;
};

function explainSupabaseError(message: string): string {
  const lower = message.toLowerCase();

  if (lower.includes('relation') || lower.includes('does not exist') || lower.includes('schema cache')) {
    return 'A tabela memories provavelmente nao existe ainda. Rode o arquivo supabase/schema.sql no SQL Editor do Supabase.';
  }

  if (lower.includes('row-level security') || lower.includes('rls') || lower.includes('permission denied') || lower.includes('violates row-level')) {
    return 'O Supabase bloqueou a gravacao por permissao/RLS. Crie uma policy de insert para anon ou ajuste as regras da tabela memories.';
  }

  if (lower.includes('invalid api key') || lower.includes('jwt') || lower.includes('401')) {
    return 'A anon key parece invalida ou de outro projeto Supabase. Confira VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY na Vercel.';
  }

  return 'Erro nao classificado. Verifique schema, tabela memories, policy de insert e se a chave anon pertence ao mesmo projeto.';
}

export async function saveIdeaCapture(rawText: string): Promise<SaveCaptureResult> {
  if (!rawText.trim()) {
    return { ok: false, message: 'Nada para salvar.' };
  }

  if (!isSupabaseConfigured || !supabase) {
    return { ok: false, message: 'Supabase ainda nao configurado. A ideia foi processada apenas localmente.' };
  }

  const box = classifyInput(rawText);
  const vision = evaluateVisionaryPotential(rawText);
  const is3amCapture = /3 da manha|madrugada|perdi o sono|insonia|sono/.test(rawText.toLowerCase());

  const { error } = await supabase.from('memories').insert({
    type: is3amCapture ? 'capture_3am' : 'idea_capture',
    title: 'Captura Sol.IA — ' + box,
    content: rawText,
    tags: [box.toLowerCase(), is3amCapture ? '3am' : 'capture'],
    metadata: {
      box,
      vision,
      source: 'solia_mvp',
      createdBy: 'Sol.IA Eu Nao Desapareco'
    }
  });

  if (error) {
    return { ok: false, message: 'Erro ao salvar no Supabase: ' + error.message + ' | Diagnostico: ' + explainSupabaseError(error.message) };
  }

  return { ok: true, message: 'Ideia salva no Cofre Sol.IA como ' + (is3amCapture ? 'capture_3am' : 'idea_capture') + '.' };
}
