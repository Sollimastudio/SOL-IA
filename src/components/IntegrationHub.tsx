const connections = [
  { name: 'GitHub', detail: 'Livros, código e documentos versionados. Conexão planejada por autorização da conta e seleção de repositórios.', state: 'A CONECTAR' },
  { name: 'Google Drive', detail: 'Uma ou mais contas, com seleção das pastas que o Jarvis poderá ler e sincronizar.', state: 'A CONECTAR' },
  { name: 'Instagram · Facebook', detail: 'Métricas e publicação autorizada. A conta nunca deve depender de você colar token manualmente na tela.', state: 'A CONECTAR' },
  { name: 'TikTok', detail: 'Métricas, conteúdo e recursos permitidos pela API da plataforma.', state: 'A CONECTAR' },
  { name: 'YouTube', detail: 'Canal, vídeos, comentários e métricas autorizadas pela sua conta Google.', state: 'A CONECTAR' },
  { name: 'WhatsApp Business', detail: 'Atendimento e automações dentro das regras da API oficial. Não significa controle invisível do WhatsApp pessoal.', state: 'A CONECTAR' },
  { name: 'n8n', detail: 'Motor de automação: recebe tarefas aprovadas do Jarvis e executa fluxos. O cérebro e a memória continuam no Jarvis/Supabase.', state: 'A CONECTAR' }
];

export function IntegrationHub() {
  return <section className="panel" aria-labelledby="integration-hub-title">
    <div className="panel-heading"><div><span className="eyebrow">JARVIS · CONEXÕES</span><h2 id="integration-hub-title">Integrações</h2></div><span className="status-badge warning">CONFIGURAÇÃO GRADUAL</span></div>
    <p>O desenho profissional é simples para você: clicar em <strong>Conectar</strong>, entrar na conta oficial e escolher o que o Jarvis pode acessar. Tokens e chaves ficam nos bastidores protegidos; não serão um formulário para você copiar e colar segredo toda hora.</p>
    <div className="memory-list">
      {connections.map(item => <article className="memory-card" key={item.name}>
        <div className="memory-meta"><strong>{item.name}</strong><span>{item.state}</span></div>
        <p>{item.detail}</p>
      </article>)}
    </div>
    <div className="callout" style={{ marginTop: '1rem' }}>
      <strong>Regra do produto:</strong> n8n executa; Supabase guarda; conectores autorizam; Jarvis decide o que precisa ser feito e pede confirmação quando a ação tiver consequência externa.
    </div>
  </section>;
}
