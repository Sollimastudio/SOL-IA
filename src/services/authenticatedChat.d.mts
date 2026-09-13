import type { Session } from '@supabase/supabase-js';
export class UnsentMessageError extends Error {}
export function sendAuthenticatedChat(options: {
  body: string;
  userId: string;
  signal: AbortSignal;
  getSession: () => Promise<Session | null>;
  refreshSession: () => Promise<Session | null>;
  fetchImpl?: typeof fetch;
  endpoint?: '/api/jarvis-chat' | '/api/jarvis-capture';
}): Promise<Response>;
