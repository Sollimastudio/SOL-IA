import React, { useState } from 'react';
import { classifyInput, buildInternalPrompt } from './core/router';
import { DIRECTIVE } from './core/directive';

export function App() {
  const [text, setText] = useState('');
  const [result, setResult] = useState('Sol.IA ativa. Eu Nao Desapareco. Escreva uma ideia bruta e clique para classificar.');

  function run() {
    const box = classifyInput(text);
    const prompt = buildInternalPrompt(text);
    setResult([
      'Caixa detectada: ' + box,
      '',
      'Pedido real: transformar a entrada bruta da Sol em direcao executavel, sem exigir prompt perfeito.',
      '',
      'Prompt interno:',
      prompt
    ].join('\n'));
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
      <button onClick={run} style={{ marginTop: 12, padding: 12, borderRadius: 12 }}>Traduzir e executar</button>
      <pre style={{ whiteSpace: 'pre-wrap', marginTop: 24, background: '#211719', padding: 16, borderRadius: 12 }}>{result}</pre>
      <details>
        <summary>Diretiva</summary>
        <pre style={{ whiteSpace: 'pre-wrap' }}>{DIRECTIVE}</pre>
      </details>
    </main>
  );
}
