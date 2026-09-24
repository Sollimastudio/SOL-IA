import test from 'node:test';
import assert from 'node:assert/strict';
import { createGeminiChatFetch, geminiChatEnabled, GEMINI_CHAT_MODEL } from '../server/gemini-chat.mjs';

test('Gemini chat is enabled only when a server key is present and not explicitly disabled', () => {
  assert.equal(geminiChatEnabled({ GEMINI_API_KEY: 'test' }), true);
  assert.equal(geminiChatEnabled({ GOOGLE_GEMINI_API_KEY: 'test' }), true);
  assert.equal(geminiChatEnabled({ GEMINI_API_KEY: 'test', JARVIS_GEMINI_CHAT_ENABLED: 'false' }), false);
  assert.equal(geminiChatEnabled({}), false);
});

test('adapter maps OpenAI-style Jarvis payload to Gemini and back without exposing the key', async () => {
  const seen = [];
  const fetchImpl = async (url, init = {}) => {
    seen.push({ url: String(url), init });
    return Response.json({
      responseId: 'g-1',
      candidates: [{ content: { parts: [{ text: 'Resposta Gemini.' }] } }],
      usageMetadata: { promptTokenCount: 10, candidatesTokenCount: 4, totalTokenCount: 14 }
    });
  };
  const fetcher = createGeminiChatFetch({ apiKey: 'server-secret', fetchImpl });
  const response = await fetcher('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: { Authorization: 'Bearer placeholder' },
    body: JSON.stringify({
      model: 'placeholder',
      max_tokens: 321,
      messages: [
        { role: 'system', content: 'Sistema Jarvis' },
        { role: 'user', content: 'Oi' },
        { role: 'assistant', content: 'Olá' },
        { role: 'user', content: [{ type: 'text', text: 'Veja a imagem' }, { type: 'image_url', image_url: { url: 'data:image/jpeg;base64,YWJj' } }] }
      ]
    })
  });
  assert.equal(response.status, 200);
  const data = await response.json();
  assert.equal(data.model, GEMINI_CHAT_MODEL);
  assert.equal(data.choices[0].message.content, 'Resposta Gemini.');
  assert.equal(response.headers.get('x-jarvis-provider'), 'gemini');
  assert.equal(seen.length, 1);
  assert.match(seen[0].url, /gemini-3\.8-flash:generateContent$/);
  assert.equal(seen[0].init.headers['x-goog-api-key'], 'server-secret');
  const body = JSON.parse(seen[0].init.body);
  assert.equal(body.systemInstruction.parts[0].text, 'Sistema Jarvis');
  assert.equal(body.generationConfig.maxOutputTokens, 321);
  assert.equal(body.contents[0].role, 'user');
  assert.equal(body.contents[1].role, 'model');
  assert.equal(body.contents[2].parts[1].inlineData.mimeType, 'image/jpeg');
  assert.doesNotMatch(JSON.stringify(data), /server-secret/);
});

test('adapter never retries a Gemini quota response', async () => {
  let calls = 0;
  const fetcher = createGeminiChatFetch({
    apiKey: 'server-secret',
    fetchImpl: async () => {
      calls += 1;
      return Response.json({ error: { message: 'quota' } }, { status: 429 });
    }
  });
  const response = await fetcher('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    body: JSON.stringify({ messages: [{ role: 'user', content: 'oi' }] })
  });
  assert.equal(response.status, 429);
  assert.equal(calls, 1);
});
