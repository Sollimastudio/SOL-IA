import React, { useState } from 'react';
import { classifyInput, buildInternalPrompt } from './core/router';
import { DIRECTIVE } from './core/directive';
import { startVoiceCapture, isVoiceCaptureSupported } from './core/voiceCapture';
import { evaluateVisionaryPotential } from './core/visionarySkill';

function buildResult(rawText: string): string {
  const box = classifyInput(rawText);
  const prompt = buildInternalPrompt(rawText);
  const vision = evaluateVisionaryPotential(rawText);

  return [
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
    'Prompt interno:',
    prompt
  ].join('\n');
}

export function App() {
  const [text, setText] = useState('');
  const [result, setResult] = useState('Sol.IA ativa. Eu Nao Desapareco. Escreva ou fale uma ideia bruta para classificar.');
  const [voiceStatus, setVoiceStatus] = useState('Voz ainda nao iniciada.');

  function run(input = text) {
    const clean = input.trim();
    if (!clean) {
      setResult('Despeje uma ideia primeiro. Pode ser baguncada mesmo.');
      return;
    }
    setResult(buildResult(clean));
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
    <main style={{ minHeight: '100vh', background: '#0f0b0c', color: '#f6ead7', padding: 24, fontFamily: 'Georgia, serif' }}>
      <h1>Sol.IA — Eu Nao Desapareco</h1>
      <p>Recebo pensamento bruto, classifico, protejo memoria e transformo caos em entrega.</p>
      <p>Caixas: OBRA | METODO | OFERTA | MAQUINA | ESTACIONAMENTO</p>
      <textarea
        value={text}
        onChange={(event) => setText(event.target.value)}
        rows={6}
        style={{ width: '100%', maxWidth: 900, padding: 16, borderRadius: 12 }}
        placeholder="Despeje aqui seu pensamento bruto"
      />
      <br />
      <button onClick={() => run()} style={{ marginTop: 12, padding: 12, borderRadius: 12 }}>Traduzir e executar</button>
      <button onClick={captureVoice} style={{ marginTop: 12, marginLeft: 8, padding: 12, borderRadius: 12 }}>Capturar por voz</button>
      <p>{voiceStatus}</p>
      <pre style={{ whiteSpace: 'pre-wrap', marginTop: 24, background: '#211719', padding: 16, borderRadius: 12 }}>{result}</pre>
      <details>
        <summary>Diretiva</summary>
        <pre style={{ whiteSpace: 'pre-wrap' }}>{DIRECTIVE}</pre>
      </details>
    </main>
  );
}
