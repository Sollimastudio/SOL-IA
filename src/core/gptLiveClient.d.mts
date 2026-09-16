export const GPT_LIVE_MODEL: string;
export const GPT_LIVE_PRICE_USD_PER_SECOND: number;
export const GPT_LIVE_VOICES: readonly string[];

export function estimateLiveVoiceCost(seconds: number): number;
export function buildGptLiveSessionStart(options?: { voice?: string; instructions?: string }): Record<string, unknown>;

export type GptLiveTranscript = {
  role: 'user' | 'assistant';
  delta: string;
  startMs: number | null;
  endMs: number | null;
};

export type GptLiveDelegation = {
  id: string;
  transcript: string;
  metadata: unknown;
};

export type GptLiveClient = {
  connect(): Promise<void>;
  close(): Promise<void>;
  disconnect(): void;
  mute(): boolean;
  unmute(): boolean;
  isConnected(): boolean;
  isMuted(): boolean;
  hasFinalUsage(): boolean;
};

export function createGptLiveClient(options?: {
  accessToken?: string;
  voice?: string;
  instructions?: string;
  onStatus?: (status: 'connecting' | 'connected' | 'closing' | 'disconnected' | 'error') => void;
  onTranscript?: (fragment: GptLiveTranscript) => void;
  onUsage?: (seconds: number, meta: { final: boolean }) => void;
  onDelegation?: (delegation: GptLiveDelegation) => string | Promise<string>;
  onError?: (error: Error) => void;
  fetchImpl?: typeof fetch;
  WebSocketImpl?: typeof WebSocket;
}): GptLiveClient;
