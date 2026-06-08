import { supabase, isSupabaseConfigured } from './supabaseClient';
import { classifyInput } from '../core/router';
import { evaluateVisionaryPotential } from '../core/visionarySkill';

export type SaveCaptureResult = {
  ok: boolean;
  message: string;
};

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
    return { ok: false, message: 'Erro ao salvar no Supabase: ' + error.message };
  }

  return { ok: true, message: 'Ideia salva no Cofre Sol.IA como ' + (is3amCapture ? 'capture_3am' : 'idea_capture') + '.' };
}
