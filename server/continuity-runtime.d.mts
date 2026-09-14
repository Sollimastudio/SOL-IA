export type ContinuityRelation = 'repeat' | 'detail' | 'correction' | 'decision' | 'branch' | 'new_topic';
export type ContinuityScope = 'raw_statement' | 'temporary_state' | 'exploration' | 'explicit_update' | 'profile_statement';
export type ContinuityClassification = {
  relation: ContinuityRelation;
  scope: ContinuityScope;
  topicHint: string;
  deltaHint: string;
  similarityToBestPrior: number;
  priorEventId: string | null;
  signals: Record<string, boolean | string | null>;
};
export type ContinuityRow = {
  id?: string;
  relation?: string;
  scope?: string;
  topic_hint?: string;
  delta_hint?: string;
  content?: string;
  created_at?: string;
  match_kind?: string;
};
export type ProfileRow = {
  id?: string;
  kind?: string;
  topic_hint?: string;
  content?: string;
  created_at?: string;
  match_kind?: string;
};
export function classifyContinuity(message: string, priorRows?: ContinuityRow[], orientation?: any): ContinuityClassification;
export function continuitySystemText(packet: ContinuityRow[], classification: ContinuityClassification | null, profilePacket?: ProfileRow[]): string;
export function readConversationEnvelope(request: Request): Promise<{ message: string; mode: 'private' | 'public'; remember: boolean; history: any[] } | null>;
export function loadContinuityPacket(args: { request: Request; env: Record<string,string|undefined>; envelope: any; fetchImpl?: typeof fetch; limit?: number }): Promise<ContinuityRow[]>;
export function loadProfilePacket(args: { request: Request; env: Record<string,string|undefined>; envelope: any; fetchImpl?: typeof fetch; limit?: number }): Promise<ProfileRow[]>;
export function persistContinuityFromResponse(args: { request: Request; env: Record<string,string|undefined>; envelope: any; classification: ContinuityClassification | null; response: Response; fetchImpl?: typeof fetch }): Promise<Response>;
