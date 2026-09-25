export const GEMINI_LIVE_MODEL: string;
export const GEMINI_LIVE_VOICES: readonly string[];
export type GeminiLiveTranscript = {
  role: 'user' | 'assistant';
  delta: string;
  startMs: number | null;
  endMs: number | null;
};
export type GeminiLiveDelegation = {
  id: string;
  transcript: string;
  metadata: unknown;
  signal?: AbortSignal;
};
export type GeminiLiveClient = {
  connect(): Promise<void>;
  close(): Promise<void>;
  disconnect(): void;
  mute(): boolean;
  unmute(): boolean;
  isConnected(): boolean;
  isMuted(): boolean;
  hasFinalUsage(): boolean;
};
export function createGeminiLiveClient(options?: {
  accessToken?: string;
  voice?: string;
  instructions?: string;
  keepAlive?: boolean;
  getAccessToken?: () => Promise<string>;
  onStatus?: (status: 'connecting' | 'reconnecting' | 'connected' | 'closing' | 'disconnected' | 'error') => void;
  onTranscript?: (fragment: GeminiLiveTranscript) => void;
  onDelegation?: (delegation: GeminiLiveDelegation) => string | Promise<string>;
  onError?: (error: Error) => void;
  fetchImpl?: typeof fetch;
  WebSocketImpl?: typeof WebSocket;
}): GeminiLiveClient;
