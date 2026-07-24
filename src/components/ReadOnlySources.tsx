import { readOnlySources } from '../data/readOnlySources';

export function ReadOnlySources() {
  return (
    <section className="panel">
      <div className="panel-heading">
        <div>
          <span className="eyebrow">ESPECIALISTAS INCORPORADOS</span>
          <h2>Fontes em modo somente leitura</h2>
        </div>
        <span className="status-badge safe">SEM ESCRITA EXTERNA</span>
      </div>
      <p>
        O Jarvis pode consultar e combinar o repertorio destes projetos. As fontes
        permanecem intactas: nenhuma publicacao, campanha ou repositorio e alterado.
      </p>
      <div className="source-grid">
        {readOnlySources.map((source) => (
          <article className="source-card" key={source.id}>
            <div className="source-title">
              <h3>{source.label}</h3>
              <span className={`status-dot ${source.integrationStatus === 'catalog_active' ? 'active' : ''}`} />
            </div>
            <p>{source.purpose}</p>
            <h4>Pode fazer</h4>
            <ul>{source.allowed.map((item) => <li key={item}>{item}</li>)}</ul>
            <h4>Bloqueado</h4>
            <ul className="blocked-list">{source.blocked.map((item) => <li key={item}>{item}</li>)}</ul>
            <details>
              <summary>Repositorios-fonte</summary>
              <ul>{source.repositories.map((repo) => <li key={repo}>{repo}</li>)}</ul>
            </details>
          </article>
        ))}
      </div>
    </section>
  );
}
