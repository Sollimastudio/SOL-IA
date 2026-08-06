import { useEffect, useState } from 'react';
import type { Session } from '@supabase/supabase-js';
import { AuthPanel } from './components/AuthPanel';
import { MemoryVault } from './components/MemoryVault';
import { MetaAdsPanel } from './components/MetaAdsPanel';
import { ReadOnlySources } from './components/ReadOnlySources';
import { routeCapability } from './core/capabilityRouter';
import { DIRECTIVE } from './core/directive';
import { classifyInput, buildInternalPrompt } from './core/router';
import { startVoiceCapture, isVoiceCaptureSupported } from './core/voiceCapture';
import { getCurrentSession, subscribeToAuth } from './services/authService';
import { saveIdeaCapture } from './services/memoryRepository';
import { supabaseDiagnostics } from './services/supabaseClient';
import { skillRegistry, runSkillSnapshot, SkillId } from './skills/skillRegistry';

function buildResult(rawText: string, activeSkill: SkillId): string {
  const box = classifyInput(rawText);
  const prompt = buildInternalPrompt(rawText);
  const route = routeCapability(rawText);
  const snapshot = runSkillSnapshot(rawText);
  const vision = snapshot.visionaria;
  const lex = snapshot.lexVanguard;
  const daily = snapshot.vidaDiaria;

  if (daily.mode === 'baixa_energia') {
    return [
      'Modo cuidado ativado.',
      '',
      'O que eu entendi:',
      'Voce nao esta bem para executar tarefas agora.',
      '',
      'O que a Sol.IA faz:',
      '- interrompe configuracoes, exercicios e decisoes;',
      '- preserva o assunto para que ele nao desapareca;',
      '- deixa a retomada preparada para quando voce disser "voltei".',
      '',
      'Preciso de voce agora:',
      'Nada. Descanse.',
      '',
      'Assunto preservado:',
      '- Caixa: ' + box,
      '- Rota futura: ' + route.reason
    ].join('\n');
  }

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
  const [session, setSession] = useState<Session | null>(null);
  const [result, setResult] = useState(
    'Sol.IA ativa. Despeje uma ideia: Jarvis identificara o especialista certo automaticamente.'
  );
  const [voiceStatus, setVoiceStatus] = useState('Voz ainda nao iniciada.');
  const [memoryStatus, setMemoryStatus] = useState('Cofre ainda nao acionado.');
  const [memoryRefreshKey, setMemoryRefreshKey] = useState(0);

  useEffect(() => {
    void getCurrentSession()
      .then(setSession)
      .catch(() => setSession(null));
    return subscribeToAuth(setSession);
  }, []);

  async function run(input = text) {
    const clean = input.trim();
    if (!clean) {
      setResult('Despeje uma ideia primeiro. Pode ser baguncada mesmo.');
      return;
    }

    setResult(buildResult(clean, activeSkill));
    const saveResult = await saveIdeaCapture(clean);
    setMemoryStatus(saveResult.message);
    if (saveResult.ok) setMemoryRefreshKey((value) => value + 1);
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
        void run(transcript);
      },
      (error) => setVoiceStatus('Erro na voz: ' + error)
    );
  }

  const activeSkillDefinition = skillRegistry.find((skill) => skill.id === activeSkill);

  return (
    <main>
      <section className="shell">
        <header className="hero">
          <div>
            <p className="eyebrow">SOL.IA v0.7 — COFRE SEGURO</p>
            <h1>Eu Nao Desapareco</h1>
            <p className="hero-copy">
              Uma entrada, memoria privada e especialistas para obra, narrativas,
              VSL, mentoria, video e Meta Ads.
            </p>
          </div>
          <div className="security-summary">
            <span className={supabaseDiagnostics.secureMemoryEnabled ? 'light safe' : 'light'} />
            <div>
              <strong>
                {supabaseDiagnostics.secureMemoryEnabled ? 'Cofre ativado' : 'Ativacao protegida'}
              </strong>
              <small>
                {supabaseDiagnostics.hasUrl && supabaseDiagnostics.hasAnonKey
                  ? 'Conexao Supabase presente'
                  : 'Conexao Supabase pendente'}
              </small>
            </div>
          </div>
        </header>

        <AuthPanel session={session} />

        <section className="panel command-panel">
          <div className="panel-heading">
            <div>
              <span className="eyebrow">PORTA UNICA</span>
              <h2>Jarvis, resolver</h2>
            </div>
            <span className="status-badge">ROTEAMENTO AUTOMATICO</span>
          </div>

          <div className="skill-row">
            {skillRegistry.map((skill) => (
              <button
                className={`skill-button ${activeSkill === skill.id ? 'active' : ''}`}
                key={skill.id}
                onClick={() => setActiveSkill(skill.id)}
                title={skill.description}
              >
                {skill.label}
              </button>
            ))}
          </div>

          <div className="active-skill">
            <strong>{activeSkillDefinition?.label}</strong>
            <span>{activeSkillDefinition?.description}</span>
          </div>

          <label className="sr-only" htmlFor="jarvis-input">Pedido para o Jarvis</label>
          <textarea
            id="jarvis-input"
            value={text}
            onChange={(event) => setText(event.target.value)}
            rows={6}
            placeholder="Despeje aqui seu pensamento bruto"
          />
          <div className="button-row">
            <button className="button" onClick={() => void run()}>Jarvis, resolver</button>
            <button className="button button-secondary" onClick={captureVoice}>Capturar por voz</button>
          </div>
          <p className="status-text">{voiceStatus}</p>
          <p className="status-text">{memoryStatus}</p>
          <pre className="result">{result}</pre>
          <details>
            <summary>Diretiva do sistema</summary>
            <pre className="directive">{DIRECTIVE}</pre>
          </details>
        </section>

        <MemoryVault session={session} refreshKey={memoryRefreshKey} />
        <ReadOnlySources />
        <MetaAdsPanel session={session} />
      </section>
    </main>
  );
}
