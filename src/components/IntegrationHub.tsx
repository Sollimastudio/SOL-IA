import { useEffect, useMemo, useState } from 'react';
import { listSourceConnections, type SourceConnection } from '../services/sourceConnections';

const planned = [
  { provider: 'github', name: 'GitHub', detail: 'Livros, código e documentos versionados. Repositórios autorizados podem sincronizar conhecimento automaticamente.' },
  { provider: 'google_drive', name: 'Google Drive', detail: 'Uma ou mais contas, com seleção das pastas que o Jarvis poderá ler e sincronizar.' },
  { provider: 'instagram', name: 'Instagram · Facebook', detail: 'Métricas e publicação autorizada. A conta nunca deve depender de você colar token manualmente na tela.' },
  { provider: 'tiktok', name: 'TikTok', detail: 'Métricas, conteúdo e recursos permitidos pela API da plataforma.' },
  { provider: 'youtube', name: 'YouTube', detail: 'Canal, vídeos, comentários e métricas autorizadas pela sua conta Google.' },
  { provider: 'whatsapp_business', name: 'WhatsApp Business', detail: 'Atendimento e automações dentro das regras da API oficial. Não significa controle invisível do WhatsApp pessoal.' },
  { provider: 'vercel', name: 'Vercel', detail: 'Projetos, deploys e logs autorizados para diagnóstico e operação.' },
  { provider: 'n8n', name: 'n8n', detail: 'Motor de automação: recebe tarefas aprovadas do Jarvis e executa fluxos. O cérebro e a memória continuam no Jarvis/Supabase.' }
];

function friendlyTime(value: string | null) {
  if (!value) return 'Ainda sem sincronização concluída';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Sincronização registrada';
  return `Última sincronização: ${date.toLocaleString('pt-BR')}`;
}

export function IntegrationHub() {
  const [connections, setConnections] = useState<SourceConnection[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    void listSourceConnections().then(data => {
      if (!active) return;
      setConnections(data);
      setError('');
    }).catch(() => {
      if (active) setError('Não consegui atualizar o estado das conexões agora.');
    }).finally(() => {
      if (active) setLoading(false);
    });
    return () => { active = false; };
  }, []);

  const grouped = useMemo(() => {
    const map = new Map<string, SourceConnection[]>();
    for (const connection of connections) {
      const key = connection.provider === 'facebook' ? 'instagram' : connection.provider;
      map.set(key, [...(map.get(key) ?? []), connection]);
    }
    return map;
  }, [connections]);

  return <section className="panel" aria-labelledby="integration-hub-title">
    <div className="panel-heading"><div><span className="eyebrow">JARVIS · CONEXÕES</span><h2 id="integration-hub-title">Integrações</h2></div><span className="status-badge warning">CONFIGURAÇÃO GRADUAL</span></div>
    <p>Esta tela mostra <strong>estado real</strong>. “Conectado” só aparece quando existe uma conexão registrada e autorizada; projeto hospedado ou plano futuro não conta como conexão.</p>
    {loading && <p className="status-text" role="status">Conferindo conexões…</p>}
    {error && <p className="status-text" role="status">{error}</p>}
    <div className="memory-list">
      {planned.map(item => {
        const real = grouped.get(item.provider) ?? [];
        const connected = real.filter(value => value.status === 'connected' || value.status === 'bridge');
        return <article className="memory-card" key={item.provider}>
          <div className="memory-meta"><strong>{item.name}</strong><span>{connected.length ? 'CONECTADO' : 'A CONECTAR'}</span></div>
          <p>{item.detail}</p>
          {real.map(connection => <div className="callout" key={connection.id} style={{ marginTop: '.65rem' }}>
            <strong>{connection.label}</strong><br />
            <span>{connection.status === 'connected' ? 'Conexão ativa' : connection.status === 'bridge' ? 'Ponte temporária ativa' : connection.status}</span>
            {connection.sync_enabled && <span> · sincronização automática</span>}<br />
            <small>{friendlyTime(connection.last_synced_at)}</small>
            {connection.last_error && <><br /><small>Último erro: {connection.last_error}</small></>}
          </div>)}
        </article>;
      })}
    </div>
    <div className="callout" style={{ marginTop: '1rem' }}>
      <strong>Regra do produto:</strong> n8n executa; Supabase guarda; conectores autorizam; Jarvis decide o que precisa ser feito e pede confirmação quando a ação tiver consequência externa.
    </div>
  </section>;
}
