import React, { useState } from 'react';
import { classifyInput, buildInternalPrompt } from './core/router';
import { routeCapability } from './core/capabilityRouter';
import { DIRECTIVE } from './core/directive';
import { startVoiceCapture, isVoiceCaptureSupported } from './core/voiceCapture';
import { saveIdeaCapture } from './services/memoryRepository';
import { supabaseDiagnostics, isSupabaseConfigured } from './services/supabaseClient';
import { skillRegistry, runSkillSnapshot, SkillId } from './skills/skillRegistry';

function buildResult(rawText: string, activeSkill: SkillId): string {
  const box = classifyInput(rawText);
  const prompt = buildInternalPrompt(rawText);
  const route = routeCapability(rawText);
  const snapshot = runSkillSnapshot(rawText);
  const vision = snapshot.visionaria;
  const lex = snapshot.lexVanguard;
  const daily = snapshot.vidaDiaria;

  return [
    'Skill escolhida manualmente: ' + activeSkill,
    'Caixa detectada: ' + box,
    '',
    'Roteamento Jarvis automatico:',
    '- Intencao: ' + route.intent,
    '- Especialista principal: ' + route.primarySpecialist,
    '- Especialistas de apoio: ' + route.supportingSpecialists.join(', '),
    '- Confianca: ' + Math.round(route.confidence * 100) + '%',
    '- Sinais encontrados: ' + (route.matchedSignals.join(', ') || 'nenhum sinal especializado'),
    '- Fontes tecnicas: ' + route.sourceRepositories.join(', '),
    '- Modo de execucao: ' + route.executionMode,
    '- Aprovacao necessaria: ' + (route.requiresApproval ? 'SIM' : 'NAO'),
    '- Motivo: ' + route.reason,
    '',
    'Pedido real:',
    'Transformar a entrada bruta da Sol em direcao executavel, sem exigir prompt perfeito.',
    '',
    'Skill Visionaria:',
    '- Potencial editorial: ' + vision.editorialPotential + '/10',
    '- Potencial de conteudo: ' + vision.contentPotential + '/10',
    '- Potencial de venda: ' + vision.salesPotential + '/10',
    '- Urgencia: ' + vision.urgency + '/10',
    '- Risco de dispersao: ' + vision.dispersionRisk + '/10',
    '- Uso recomendado: ' + vision.recommendedUse,
    '',
    'Lex Vanguard:',
    '- Risco: ' + lex.riskLevel,
    '- Alerta: ' + lex.warning,
    '- Recomendacao: ' + lex.recommendation,
    '- Pausa obrigatoria: ' + (lex.pauseRequired ? 'SIM' : 'NAO'),
    '',
    'Vida Diaria:',
    '- Modo: ' + daily.mode,
    '- Alerta: ' + daily.alert,
    '- Acao sugerida: ' + daily.suggestedAction,
    '- Adiar decisao: ' + (daily.shouldDelayDecision ? 'SIM' : 'NAO'),
    '',
    'Prompt interno:',
    prompt
  ].join('\n');
}

export function App() {
  const [text, setText] = useState('');
  const [activeSkill, setActiveSkill] = useState<SkillId>('imperatriz');
  const [result, setResult] = useState(
    'Sol.IA ativa. Eu Nao Desapareco. Despeje uma ideia: Jarvis identificara o especialista certo automaticamente.'
  );
  const [voiceStatus, setVoiceStatus] = useState('Voz ainda nao iniciada.');
  const [memoryStatus, setMemoryStatus] = useState('Cofre ainda nao acionado.');

  async function run(input = text) {
    const clean = input.trim();
    if (!clean) {
      setResult('Despeje uma ideia primeiro. Pode ser baguncada mesmo.');
      return;
    }

    setResult(buildResult(clean, activeSkill));
    const saveResult = await saveIdeaCapture(clean);
    setMemoryStatus(saveResult.message);
  }

  function captureVoice() {
    if (!isVoiceCaptureSupported()) {
      setVoiceStatus('Este navegador nao suporta reconhecimento de voz nativo.');
      return;
    }

    setVoiceStatus('Escutando... fale sua ideia bruta.');
    startVoiceCapture(
      (transcript) => {
        setText(transcript);
        setVoiceStatus('Capturado: ' + transcript);
        run(transcript);
      },
      (error) => setVoiceStatus('Erro na voz: ' + error)
    );
  }

  const activeSkillDefinition = skillRegistry.find((skill) => skill.id === activeSkill);

  return (
    <main style={{ minHeight: '100vh', background: '#050406', color: '#f6ead7', padding: 24, fontFamily: 'Georgia, serif' }}>
      <section style={{ maxWidth: 1180, margin: '0 auto' }}>
        <p style={{ color: '#b781ff', letterSpacing: 4, fontSize: 12 }}>SOL.IA v0.6 — JARVIS ROUTER</p>
        <h1 style={{ margin: 0, fontSize: 40 }}>Sol.IA — Eu Nao Desapareco</h1>
        <p>Uma entrada, memoria continua e especialistas para obra, conteudo, VSL, mentoria, video e Meta Ads.</p>

        <div style={{ background: '#120b17', border: '1px solid #392449', borderRadius: 12, padding: 12, margin: '16px 0' }}>
          <strong>Diagnostico Supabase:</strong>
          <p>Status: <strong>{isSupabaseConfigured ? 'CONFIGURADO' : 'NAO CONFIGURADO'}</strong></p>
          <p>URL presente: <strong>{supabaseDiagnostics.hasUrl ? 'SIM' : 'NAO'}</strong> — {supabaseDiagnostics.urlPreview}</p>
          <p>Anon key presente: <strong>{supabaseDiagnostics.hasAnonKey ? 'SIM' : 'NAO'}</strong> — {supabaseDiagnostics.anonKeyPreview}</p>
        </div>

        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', margin: '18px 0' }}>
          {skillRegistry.map((skill) => (
            <button
              key={skill.id}
              onClick={() => setActiveSkill(skill.id)}
              title={skill.description}
              style={{
                padding: '10px 14px',
                borderRadius: 999,
                border: activeSkill === skill.id ? '1px solid #b781ff' : '1px solid #392449',
                background: activeSkill === skill.id ? '#4b167b' : '#120b17',
                color: '#f6ead7',
                fontWeight: 700
              }}
            >
              {skill.label}
            </button>
          ))}
        </div>

        <p>Skill ativa: <strong>{activeSkillDefinition?.label}</strong></p>
        <p>{activeSkillDefinition?.description}</p>
        <p>Modo publico seguro: <strong>{activeSkillDefinition?.publicSafe ? 'SIM' : 'NAO'}</strong></p>
        <p>Jarvis tambem escolhe automaticamente o especialista conforme o pedido.</p>
        <p>Caixas: OBRA | METODO | OFERTA | MAQUINA | ESTACIONAMENTO</p>

        <textarea
          value={text}
          onChange={(event) => setText(event.target.value)}
          rows={6}
          style={{ width: '100%', maxWidth: 980, padding: 16, borderRadius: 12, background: '#f6ead7', color: '#120b17' }}
          placeholder="Despeje aqui seu pensamento bruto"
        />
        <br />
        <button onClick={() => run()} style={{ marginTop: 12, padding: 12, borderRadius: 12 }}>Jarvis, resolver</button>
        <button onClick={captureVoice} style={{ marginTop: 12, marginLeft: 8, padding: 12, borderRadius: 12 }}>Capturar por voz</button>
        <p>{voiceStatus}</p>
        <p>{memoryStatus}</p>
        <pre style={{ whiteSpace: 'pre-wrap', marginTop: 24, background: '#160d18', padding: 16, borderRadius: 12 }}>{result}</pre>
        <details>
          <summary>Diretiva</summary>
          <pre style={{ whiteSpace: 'pre-wrap' }}>{DIRECTIVE}</pre>
        </details>
      </section>
    </main>
  );
}
