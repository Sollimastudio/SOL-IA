export const GEMINI_CHAT_MODEL: string;
export function geminiChatEnabled(env?: Record<string, string | undefined>): boolean;
export function createGeminiChatFetch(options?: {
  apiKey?: string;
  model?: string;
  fetchImpl?: typeof fetch;
}): typeof fetch;
