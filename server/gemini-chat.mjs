const OPENROUTER_CHAT_URL = 'https://openrouter.ai/api/v1/chat/completions';
export const GEMINI_CHAT_MODEL = 'gemini-3.8-flash';

const first = (value, fallback = '') =>
  typeof value === 'string' && value.trim() ? value.trim() : fallback;

export function geminiChatEnabled(env = {}) {
  return Boolean(first(env.GEMINI_API_KEY || env.GOOGLE_GEMINI_API_KEY)) &&
    env.JARVIS_GEMINI_CHAT_ENABLED !== 'false';
}

function dataUrlPart(url) {
  if (typeof url !== 'string') return null;
  const match = url.match(/^data:([^;,]+);base64,(.+)$/s);
  if (!match) return null;
  return { inlineData: { mimeType: match[1], data: match[2] } };
}

function contentParts(content) {
  if (typeof content === 'string') return content.trim() ? [{ text: content }] : [];
  if (!Array.isArray(content)) return [];
  const parts = [];
  for (const item of content) {
    if (item?.type === 'text' && typeof item.text === 'string' && item.text.trim()) {
      parts.push({ text: item.text });
      continue;
    }
    if (item?.type === 'image_url') {
      const url = typeof item.image_url === 'string' ? item.image_url : item.image_url?.url;
      const part = dataUrlPart(url);
      if (part) parts.push(part);
    }
  }
  return parts;
}

function toGeminiRequest(payload) {
  const messages = Array.isArray(payload?.messages) ? payload.messages : [];
  const systemText = messages
    .filter(message => message?.role === 'system')
    .map(message => typeof message.content === 'string' ? message.content : '')
    .filter(Boolean)
    .join('\n\n');

  const contents = [];
  for (const message of messages) {
    if (!['user', 'assistant'].includes(message?.role)) continue;
    const parts = contentParts(message.content);
    if (!parts.length) continue;
    contents.push({
      role: message.role === 'assistant' ? 'model' : 'user',
      parts
    });
  }

  return {
    ...(systemText ? { systemInstruction: { parts: [{ text: systemText }] } } : {}),
    contents,
    generationConfig: {
      maxOutputTokens: Number.isFinite(Number(payload?.max_tokens))
        ? Math.max(1, Math.min(4096, Number(payload.max_tokens)))
        : 900
    }
  };
}

function geminiText(payload) {
  const parts = payload?.candidates?.[0]?.content?.parts;
  if (!Array.isArray(parts)) return '';
  return parts.map(part => typeof part?.text === 'string' ? part.text : '').join('').trim();
}

export function createGeminiChatFetch({
  apiKey,
  model = GEMINI_CHAT_MODEL,
  fetchImpl = globalThis.fetch
} = {}) {
  const key = first(apiKey);
  return async (input, init = {}) => {
    const url = String(input);
    if (url !== OPENROUTER_CHAT_URL || !key) return fetchImpl(input, init);

    let openAiPayload;
    try {
      openAiPayload = typeof init.body === 'string' ? JSON.parse(init.body) : {};
    } catch {
      return Response.json({ error: { message: 'invalid_request' } }, { status: 400 });
    }

    const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`;
    const response = await fetchImpl(endpoint, {
      method: 'POST',
      headers: {
        'x-goog-api-key': key,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(toGeminiRequest(openAiPayload)),
      cache: 'no-store',
      redirect: 'error',
      signal: init.signal
    });

    if (!response.ok) {
      let error = null;
      try { error = await response.json(); } catch { /* opaque provider body */ }
      return Response.json(error || { error: { message: 'gemini_provider_error' } }, {
        status: response.status,
        headers: { 'Cache-Control': 'private, no-store' }
      });
    }

    let payload;
    try { payload = await response.json(); }
    catch { return Response.json({ error: { message: 'gemini_invalid_response' } }, { status: 502 }); }
    const text = geminiText(payload);
    if (!text) return Response.json({ error: { message: 'gemini_empty_response' } }, { status: 502 });

    const usage = payload?.usageMetadata || {};
    return Response.json({
      id: payload?.responseId || 'gemini-chat',
      object: 'chat.completion',
      model,
      choices: [{ index: 0, message: { role: 'assistant', content: text }, finish_reason: 'stop' }],
      usage: {
        prompt_tokens: usage.promptTokenCount ?? null,
        completion_tokens: usage.candidatesTokenCount ?? null,
        total_tokens: usage.totalTokenCount ?? null
      }
    }, {
      status: 200,
      headers: { 'Cache-Control': 'private, no-store', 'X-Jarvis-Provider': 'gemini' }
    });
  };
}
