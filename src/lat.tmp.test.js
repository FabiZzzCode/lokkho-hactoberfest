import { it } from 'vitest';
import fs from 'node:fs';
import { sampleStudent } from './data/sampleStudent.js';
for (const l of fs.readFileSync('.env.local', 'utf8').split('\n')) { const m = l.match(/^([A-Z_]+)=(.*)$/); if (m) process.env[m[1]] = m[2]; }
it('lat', async () => {
  const { agentPrompt } = await import('../server/ai/prompts.js');
  const { toolCatalog, runTool } = await import('./advisor/registry.js');
  const result = runTool('predict_result', {}, { profile: sampleStudent('cse'), today: new Date() });
  const prompt = agentPrompt({ question: 'Predict my result', language: 'en', steps: [{ tool: 'predict_result', args: {}, result }], catalog: toolCatalog() });
  console.log('prompt chars', prompt.length);
  for (const tc of [{ thinkingBudget: 0 }, { thinkingLevel: 'minimal' }, { thinkingLevel: 'low' }]) {
    const t = Date.now();
    const ctrl = new AbortController(); setTimeout(() => ctrl.abort(), 60000);
    const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${process.env.GEMINI_MODEL}:generateContent`, { method: 'POST', signal: ctrl.signal, headers: { 'content-type': 'application/json', 'x-goog-api-key': process.env.GEMINI_API_KEY }, body: JSON.stringify({ contents: [{ role: 'user', parts: [{ text: prompt }] }], generationConfig: { maxOutputTokens: 1200, temperature: 0.2, thinkingConfig: tc } }) });
    const j = await res.json();
    console.log(JSON.stringify(tc), res.status, Date.now() - t, 'ms', JSON.stringify(j.usageMetadata?.thoughtsTokenCount), j.candidates?.[0]?.finishReason, JSON.stringify(j.error ?? '').slice(0, 200), JSON.stringify(j.candidates?.[0]?.content?.parts?.map((p) => [!!p.thought, (p.text ?? '').slice(-150)])));
  }
}, 200000);
