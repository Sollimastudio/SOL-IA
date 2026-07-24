import { useState } from 'react';
import type { Session } from '@supabase/supabase-js';
import { readMetaAdsInsights } from '../services/metaAdsReadOnly';
import { isSecureMemoryEnabled } from '../services/supabaseClient';
import type {
  MetaAdsInsight,
  MetaDatePreset,
  MetaInsightLevel
} from '../types/metaAds';

type MetaAdsPanelProps = {
  session: Session | null;
};

function metric(value?: string): string {
  return value ?? '—';
}

function insightName(item: MetaAdsInsight): string {
  return item.ad_name
    || item.adset_name
    || item.campaign_name
    || item.account_name
    || item.ad_id
    || item.adset_id
    || item.campaign_id
    || item.account_id
    || 'Linha sem nome';
}

export function MetaAdsPanel({ session }: MetaAdsPanelProps) {
  const [level, setLevel] = useState<MetaInsightLevel>('campaign');
  const [datePreset, setDatePreset] = useState<MetaDatePreset>('last_7d');
  const [rows, setRows] = useState<MetaAdsInsight[]>([]);
  const [status, setStatus] = useState(
    'Aguardando autenticacao e credenciais ads_read no servidor.'
  );
  const [busy, setBusy] = useState(false);

  async function load() {
    if (!session) {
      setStatus('Entre no Cofre Sol.IA antes de consultar metricas.');
      return;
    }

    setBusy(true);
    const result = await readMetaAdsInsights(session, { level, datePreset });
    setRows(result.data?.data || []);
    setStatus(result.message);
    setBusy(false);
  }

  const enabled = Boolean(session && isSecureMemoryEnabled);

  return (
    <section className="panel">
      <div className="panel-heading">
        <div>
          <span className="eyebrow">META MARKETING API</span>
          <h2>Meta Ads — leitura protegida</h2>
        </div>
        <span className="status-badge safe">GET ONLY</span>
      </div>
      <p>
        Le o desempenho autorizado. Este modulo nao possui rotas para criar,
        editar, pausar, excluir ou mudar orcamento.
      </p>
      <p className="callout">
        Andromeda e o mecanismo interno de recuperacao de anuncios da Meta; nao e
        uma API controlavel. Aqui lemos apenas os resultados oficiais da Insights API.
      </p>
      <div className="inline-form controls">
        <label>
          Nivel
          <select
            value={level}
            onChange={(event) => setLevel(event.target.value as MetaInsightLevel)}
            disabled={!enabled || busy}
          >
            <option value="account">Conta</option>
            <option value="campaign">Campanha</option>
            <option value="adset">Conjunto</option>
            <option value="ad">Anuncio</option>
          </select>
        </label>
        <label>
          Periodo
          <select
            value={datePreset}
            onChange={(event) => setDatePreset(event.target.value as MetaDatePreset)}
            disabled={!enabled || busy}
          >
            <option value="last_7d">Ultimos 7 dias</option>
            <option value="last_14d">Ultimos 14 dias</option>
            <option value="last_30d">Ultimos 30 dias</option>
          </select>
        </label>
        <button className="button" disabled={!enabled || busy} onClick={load}>
          {busy ? 'Lendo...' : 'Ler desempenho'}
        </button>
      </div>
      <p className="status-text">{status}</p>

      {rows.length > 0 && (
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Nome</th>
                <th>Impressoes</th>
                <th>Alcance</th>
                <th>Cliques</th>
                <th>CTR</th>
                <th>CPC</th>
                <th>CPM</th>
                <th>Gasto</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row, index) => (
                <tr key={`${insightName(row)}-${index}`}>
                  <td>{insightName(row)}</td>
                  <td>{metric(row.impressions)}</td>
                  <td>{metric(row.reach)}</td>
                  <td>{metric(row.clicks)}</td>
                  <td>{metric(row.ctr)}</td>
                  <td>{metric(row.cpc)}</td>
                  <td>{metric(row.cpm)}</td>
                  <td>{metric(row.spend)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
