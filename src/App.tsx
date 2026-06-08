import React, { useState } from 'react';
import { classifyInput, buildInternalPrompt } from './core/router';
import { DIRECTIVE } from './core/directive';
import { startVoiceCapture, isVoiceCaptureSupported } from './core/voiceCapture';
import { evaluateVisionaryPotential } from './core/visionarySkill';
import { saveIdeaCapture } from './services/memoryRepository';
import { analyzeLegalRisk } from './skills/lexVanguard';

type SkillKey = 'Imperatriz' | 'Vault' | 'Visionaria' | 'Lex Vanguard' | 'Publisher' | 'Vida Diaria';

const skills: SkillKey[] = ['Imperatriz', 'Vault', 'Visionaria', 'Lex Vanguard', 'Publisher', 'Vida Diaria'];

function buildResult(rawText: string, activeSkill: SkillKey): string {
  const box = classifyInput(rawText);
  const prompt = buildInternalPrompt(rawText);
  const vision = evaluateVisionaryPotential(rawText);
  const lex = analyzeLegalRisk(rawText);

  return [
    'Skill ativa: ' + activeSkill,
    'Caixa detectada: ' + box,
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
    'Prompt interno:',
    prompt
  ].join('\n');
}

export function App() {
  const [text, setText] = useState('');
  const [activeSkill, setActiveSkill] = useState<SkillKey>('Imperatriz');
  const [result, setResult] = useState('Sol.IA ativa. Eu Nao Desapareco. Escolha uma skill ou despeje uma ideia bruta.');
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

  return (
    <main style={{ minHeight: '100vh', background: '#050406', color: '#f6ead7', padding: 24, fontFamily: 'Georgia, serif' }}>
      <section style={{ maxWidth: 1180, margin: '0 auto' }}>
        <p style={{ color: '#b781ff', letterSpacing: 4, fontSize: 12 }}>SOL.IA v0.2 — NEXUS FUSION</p>
        <h1 style={{ margin: 0, fontSize: 40 }}>Sol.IA — Eu Nao Desapareco</h1>
        <p>Interface oficial em evolucao: a tela simples e o modo teste; a meta visual e o Neural Console com skills.</p>

        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', margin: '18px 0' }}>
          {skills.map((skill) => (
            <button
              key={skill}
              onClick={() => setActiveSkill(skill)}
              style={{
                padding: '10px 14px',
                borderRadius: 999,
                border: activeSkill === skill ? '1px solid #b781ff' : '1px solid #392449',
                background: activeSkill === skill ? '#4b167b' : '#120b17',
                color: '#f6ead7',
                fontWeight: 700
              }}
            >
              {skill}
            </button>
          ))}
        </div>

        <p>Skill ativa: <strong>{activeSkill}</strong></p>
        <p>Caixas: OBRA | METODO | OFERTA | MAQUINA | ESTACIONAMENTO</p>

        <textarea
          value={text}
          onChange={(event) => setText(event.target.value)}
          rows={6}
          style={{ width: '100%', maxWidth: 980, padding: 16, borderRadius: 12, background: '#f6ead7', color: '#120b17' }}
          placeholder="Despeje aqui seu pensamento bruto"
        />
        <br />
        <button onClick={() => run()} style={{ marginTop: 12, padding: 12, borderRadius: 12 }}>Transmutar / avaliar / salvar</button>
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
