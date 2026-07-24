const ALLOWED_LEVELS = new Set(['account', 'campaign', 'adset', 'ad']);
const ALLOWED_DATE_PRESETS = new Set(['last_7d', 'last_14d', 'last_30d']);
const FIXED_FIELDS = [
  'account_id',
  'account_name',
  'campaign_id',
  'campaign_name',
  'adset_id',
  'adset_name',
  'ad_id',
  'ad_name',
  'impressions',
  'reach',
  'clicks',
  'spend',
  'cpm',
  'ctr',
  'cpc',
  'actions',
  'action_values',
  'cost_per_action_type',
  'date_start',
  'date_stop'
].join(',');

type Environment = {
  META_ACCESS_TOKEN?: string;
  META_AD_ACCOUNT_ID?: string;
  META_GRAPH_API_VERSION?: string;
  SUPABASE_URL?: string;
  SUPABASE_ANON_KEY?: string;
  VITE_SUPABASE_URL?: string;
  VITE_SUPABASE_ANON_KEY?: string;
};

function json(body: unknown, status = 200): Response {
  return Response.json(body, {
    status,
    headers: {
      'Cache-Control': 'private, no-store, max-age=0',
      'X-Content-Type-Options': 'nosniff'
    }
  });
}

function normalizeAccountId(value: string): string | null {
  const clean = value.trim();
  if (!/^(act_)?\d+$/.test(clean)) return null;
  return clean.startsWith('act_') ? clean : `act_${clean}`;
}

async function verifySupabaseUser(
  authorization: string,
  supabaseUrl: string,
  supabaseAnonKey: string
): Promise<boolean> {
  try {
    const response = await fetch(`${supabaseUrl.replace(/\/$/, '')}/auth/v1/user`, {
      method: 'GET',
      headers: {
        Authorization: authorization,
        apikey: supabaseAnonKey
      },
      cache: 'no-store',
      signal: AbortSignal.timeout(8000)
    });
    return response.ok;
  } catch {
    return false;
  }
}

export async function GET(request: Request): Promise<Response> {
  const env = process.env as Environment;
  const authorization = request.headers.get('authorization') || '';
  const supabaseUrl = env.SUPABASE_URL || env.VITE_SUPABASE_URL;
  const supabaseAnonKey = env.SUPABASE_ANON_KEY || env.VITE_SUPABASE_ANON_KEY;

  if (!authorization.startsWith('Bearer ') || !supabaseUrl || !supabaseAnonKey) {
    return json({ error: 'unauthorized', message: 'Sessao segura obrigatoria.' }, 401);
  }

  if (!(await verifySupabaseUser(authorization, supabaseUrl, supabaseAnonKey))) {
    return json({ error: 'unauthorized', message: 'Sessao expirada ou invalida.' }, 401);
  }

  const missing = [
    !env.META_ACCESS_TOKEN && 'META_ACCESS_TOKEN',
    !env.META_AD_ACCOUNT_ID && 'META_AD_ACCOUNT_ID',
    !env.META_GRAPH_API_VERSION && 'META_GRAPH_API_VERSION'
  ].filter(Boolean);

  if (missing.length > 0) {
    return json(
      {
        error: 'integration_not_configured',
        message: `Leitura Meta Ads aguardando configuracao no servidor: ${missing.join(', ')}.`
      },
      503
    );
  }

  const accountId = normalizeAccountId(env.META_AD_ACCOUNT_ID as string);
  const apiVersion = (env.META_GRAPH_API_VERSION as string).trim();
  if (!accountId || !/^v\d+\.\d+$/.test(apiVersion)) {
    return json(
      {
        error: 'invalid_server_configuration',
        message: 'Conta de anuncios ou versao da API configurada em formato invalido.'
      },
      503
    );
  }

  const url = new URL(request.url);
  const requestedLevel = url.searchParams.get('level') || 'campaign';
  const requestedDatePreset = url.searchParams.get('date_preset') || 'last_7d';
  const level = ALLOWED_LEVELS.has(requestedLevel) ? requestedLevel : 'campaign';
  const datePreset = ALLOWED_DATE_PRESETS.has(requestedDatePreset)
    ? requestedDatePreset
    : 'last_7d';

  const query = new URLSearchParams({
    fields: FIXED_FIELDS,
    level,
    date_preset: datePreset,
    limit: '50'
  });

  try {
    const metaResponse = await fetch(
      `https://graph.facebook.com/${apiVersion}/${accountId}/insights?${query.toString()}`,
      {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${env.META_ACCESS_TOKEN as string}`,
          Accept: 'application/json'
        },
        cache: 'no-store',
        signal: AbortSignal.timeout(12000)
      }
    );

    const payload = (await metaResponse.json()) as {
      data?: unknown[];
      error?: { message?: string; code?: number };
    };

    if (!metaResponse.ok || !Array.isArray(payload.data)) {
      return json(
        {
          error: 'meta_api_error',
          message: payload.error?.message || 'A Meta recusou a leitura das metricas.',
          code: payload.error?.code
        },
        metaResponse.status >= 400 && metaResponse.status < 500 ? 400 : 502
      );
    }

    // Nao devolvemos o objeto paging: URLs de paginacao da Graph API podem
    // carregar credenciais. A resposta e deliberadamente limitada e somente leitura.
    return json({
      readOnly: true,
      source: 'Meta Marketing API Insights',
      level,
      datePreset,
      data: payload.data
    });
  } catch {
    return json(
      {
        error: 'meta_api_unavailable',
        message: 'A leitura da Meta demorou demais ou ficou indisponivel.'
      },
      502
    );
  }
}
