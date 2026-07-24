import type { Session } from '@supabase/supabase-js';
import type {
  MetaAdsReadOnlyResponse,
  MetaDatePreset,
  MetaInsightLevel
} from '../types/metaAds';

export type MetaAdsReadResult = {
  ok: boolean;
  message: string;
  data?: MetaAdsReadOnlyResponse;
};

export async function readMetaAdsInsights(
  session: Session,
  options: {
    level: MetaInsightLevel;
    datePreset: MetaDatePreset;
  }
): Promise<MetaAdsReadResult> {
  try {
    const params = new URLSearchParams({
      level: options.level,
      date_preset: options.datePreset
    });

    const response = await fetch(`/api/meta-ads-insights?${params.toString()}`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${session.access_token}`,
        Accept: 'application/json'
      },
      cache: 'no-store'
    });

    const payload = (await response.json()) as
      | MetaAdsReadOnlyResponse
      | { error?: string; message?: string };

    if (!response.ok || !('data' in payload)) {
      const message = 'message' in payload
        ? payload.message
        : 'error' in payload
          ? payload.error
          : 'A leitura do Meta Ads foi recusada.';
      return { ok: false, message: message || 'A leitura do Meta Ads foi recusada.' };
    }

    return {
      ok: true,
      message: `${payload.data.length} linha(s) de desempenho lida(s), sem qualquer alteracao.`,
      data: payload
    };
  } catch (error) {
    return {
      ok: false,
      message: error instanceof Error ? error.message : 'Falha de conexao com o leitor do Meta Ads.'
    };
  }
}
