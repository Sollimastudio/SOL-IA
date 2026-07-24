export type MetaInsightLevel = 'account' | 'campaign' | 'adset' | 'ad';
export type MetaDatePreset = 'last_7d' | 'last_14d' | 'last_30d';

export interface MetaActionMetric {
  action_type?: string;
  value?: string;
}

export interface MetaAdsInsight {
  account_id?: string;
  account_name?: string;
  campaign_id?: string;
  campaign_name?: string;
  adset_id?: string;
  adset_name?: string;
  ad_id?: string;
  ad_name?: string;
  impressions?: string;
  reach?: string;
  clicks?: string;
  spend?: string;
  cpm?: string;
  ctr?: string;
  cpc?: string;
  actions?: MetaActionMetric[];
  action_values?: MetaActionMetric[];
  cost_per_action_type?: MetaActionMetric[];
  date_start?: string;
  date_stop?: string;
}

export interface MetaAdsReadOnlyResponse {
  readOnly: true;
  source: 'Meta Marketing API Insights';
  level: MetaInsightLevel;
  datePreset: MetaDatePreset;
  data: MetaAdsInsight[];
}
