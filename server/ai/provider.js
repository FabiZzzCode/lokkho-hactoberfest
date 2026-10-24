import { AppError } from '../errors.js';

const cfg = () => ({
  provider: process.env.AI_PROVIDER || 'gemini',
  key: process.env.GEMINI_API_KEY,
  model: process.env.GEMINI_MODEL || 'gemma-4-26b-a4b-it',
  baseUrl: process.env.AI_BASE_URL,
  localModel: process.env.AI_MODEL,
  timeout: Number(process.env.AI_TIMEOUT_MS) || 25000,
  maxTokens: Number(process.env.AI_MAX_TOKENS) || 1200,
});

async function post(url, headers, body, timeout) {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), timeout);
  try {
    const res = await fetch(url, { method: 'POST', headers: { 'content-type': 'application/json', ...headers }, body: JSON.stringify(body), signal: ctrl.signal });
    if (res.status === 429) throw new AppError('quota', 'The AI service is busy or out of quota. Please try again later, or enter data by hand.', 429);
    if (res.status === 401 || res.status === 403) throw new AppError('auth', 'The AI key was rejected. Check the server configuration.', 502);
    if (!res.ok) throw new AppError('upstream', `The AI service returned an error (${res.status}).`, 502);
    return await res.json();
  } catch (e) {
    if (e instanceof AppError) throw e;
    if (e.name === 'AbortError') throw new AppError('timeout', 'The AI took too long to answer. Please try again.', 504);
    throw new AppError('upstream', 'Could not reach the AI service.', 502);
  } finally {
    clearTimeout(timer);
  }
}

// Gemma may emit reasoning parts (thought:true); keep only the answer text.
export const textFromGemini = (json) =>
  (json?.candidates?.[0]?.content?.parts ?? []).filter((p) => !p.thought && typeof p.text === 'string').map((p) => p.text).join('').trim();
export const textFromOpenAi = (json) => (json?.choices?.[0]?.message?.content ?? '').trim();

async function callOnce(prompt, image) {
  const c = cfg();
  if (c.provider === 'openai_compat') {
    if (!c.baseUrl || !c.localModel) throw new AppError('not_configured', 'Local AI mode needs AI_BASE_URL and AI_MODEL.', 503);
    const content = image
      ? [{ type: 'text', text: prompt }, { type: 'image_url', image_url: { url: `data:${image.mime};base64,${image.data}` } }]
      : prompt;
    const json = await post(`${c.baseUrl.replace(/\/$/, '')}/chat/completions`, {}, { model: c.localModel, max_tokens: c.maxTokens, temperature: 0.2, messages: [{ role: 'user', content }] }, c.timeout);
    return textFromOpenAi(json);
  }
  if (!c.key) throw new AppError('not_configured', 'AI is not configured on the server (missing API key).', 503);
  // Instructions go inside the user message: Gemma models may reject system instructions.
  const parts = [{ text: prompt }];
  if (image) parts.push({ inlineData: { mimeType: image.mime, data: image.data } });
  const json = await post(
    `https://generativelanguage.googleapis.com/v1beta/models/${c.model}:generateContent`,
    { 'x-goog-api-key': c.key },
    { contents: [{ role: 'user', parts }], generationConfig: { maxOutputTokens: c.maxTokens, temperature: 0.2 } },
    c.timeout,
  );
  return textFromGemini(json);
}

/** Calls the model, retrying once on an empty answer. */
export async function generate(prompt, image) {
  let text = await callOnce(prompt, image);
  if (!text) text = await callOnce(prompt, image);
  if (!text) throw new AppError('empty', 'The AI returned an empty answer. Please try again.', 502);
  return text;
}

/** Pulls the first balanced JSON object out of model text (handles ``` fences and chatter). */
export function extractJson(text) {
  const s = text.replace(/```(?:json)?/gi, '');
  const start = s.indexOf('{');
  if (start < 0) throw new AppError('bad_json', 'The AI answer was not valid JSON.', 502);
  let depth = 0, inStr = false, esc = false;
  for (let i = start; i < s.length; i++) {
    const ch = s[i];
    if (inStr) { if (esc) esc = false; else if (ch === '\\') esc = true; else if (ch === '"') inStr = false; continue; }
    if (ch === '"') inStr = true;
    else if (ch === '{') depth++;
    else if (ch === '}' && --depth === 0) {
      try { return JSON.parse(s.slice(start, i + 1)); } catch { break; }
    }
  }
  throw new AppError('bad_json', 'The AI answer was not valid JSON.', 502);
}
