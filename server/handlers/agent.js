import { AppError, fail, ok } from '../errors.js';
import { rateLimited } from '../rateLimit.js';
import { generate as modelGenerate, extractJson } from '../ai/provider.js';
import { agentPrompt } from '../ai/prompts.js';
import { toolCatalog, getTool, validateArgs } from '../../src/advisor/registry.js';
import { MAX_TOOL_CALLS, MAX_QUESTION_CHARS } from '../../src/advisor/config.js';

const RATE_PER_MIN = 20;
const MAX_RESULT_CHARS = 6000;
const MAX_TOTAL_CHARS = 20000;
const MAX_FINAL_CHARS = 2000;

function readRequest(body) {
  const question = typeof body?.question === 'string' ? body.question.trim() : '';
  if (!question) throw new AppError('invalid_input', 'Please type a question.');
  if (question.length > MAX_QUESTION_CHARS) throw new AppError('invalid_input', `Question is too long (max ${MAX_QUESTION_CHARS} characters).`, 413);
  const language = body.language === 'bn' ? 'bn' : 'en';
  const raw = Array.isArray(body.steps) ? body.steps : [];
  if (raw.length > MAX_TOOL_CALLS) throw new AppError('invalid_input', 'Too many tool steps.');
  let total = 0;
  const steps = raw.map((s) => {
    const tool = getTool(s?.tool);
    if (!tool) throw new AppError('invalid_input', 'Unknown tool in history.');
    const size = JSON.stringify(s.result ?? null).length;
    total += size;
    if (size > MAX_RESULT_CHARS || total > MAX_TOTAL_CHARS) throw new AppError('invalid_input', 'Tool results are too large.', 413);
    return { tool: tool.name, args: s.args ?? {}, result: s.result ?? null };
  });
  let fix = null;
  if (body.fix) {
    const { draft, numbers } = body.fix;
    if (typeof draft !== 'string' || draft.length > MAX_FINAL_CHARS || !Array.isArray(numbers) || numbers.length > 20 || numbers.some((n) => typeof n !== 'string' || n.length > 12)) throw new AppError('invalid_input', 'Bad fix request.');
    fix = { draft, numbers };
  }
  return { question, language, steps, fix, mustFinish: steps.length >= MAX_TOOL_CALLS || body.mustFinish === true };
}

// Models sometimes put raw line breaks inside the JSON string; accept that for "final".
function parseReply(text) {
  try { return extractJson(text); } catch { /* try the lenient form below */ }
  const m = text.match(/"final"\s*:\s*"([\s\S]*)"\s*}?\s*$/);
  if (m) return { final: m[1].replace(/\\"/g, '"').replace(/\\n/g, '\n') };
  throw new AppError('bad_json', 'The AI answer was not valid JSON.', 502);
}

/** Turns one model reply into { type:'tool', tool, args } or { type:'final', text }, or throws. */
export function interpret(reply, { mustFinish }) {
  if (typeof reply.final === 'string' && reply.final.trim()) return { type: 'final', text: reply.final.trim().slice(0, MAX_FINAL_CHARS) };
  const tool = getTool(reply.tool);
  if (!tool) throw new AppError('bad_step', 'The AI asked for an unknown tool.', 502);
  if (mustFinish) throw new AppError('bad_step', 'The AI asked for a tool when it had to answer.', 502);
  const v = validateArgs(tool, reply.args);
  if (!v.ok) throw new AppError('bad_step', `The AI sent bad arguments: ${v.error}.`, 502);
  return { type: 'tool', tool: tool.name, args: v.args };
}

export function createAgentHandler({ generate = modelGenerate } = {}) {
  return async function handleAgent({ method, body, ip }) {
    try {
      if (method !== 'POST') throw new AppError('method', 'Use POST.', 405);
      if (rateLimited(`agent:${ip}`, RATE_PER_MIN)) throw new AppError('rate_limited', 'Too many questions. Please wait a minute.', 429);
      const req = readRequest(body);
      const prompt = agentPrompt({ ...req, catalog: toolCatalog() });
      let lastError;
      // One retry: a malformed step is usually fixed by asking again.
      for (let attempt = 0; attempt < 2; attempt++) {
        try { return ok(interpret(parseReply(await generate(prompt)), req)); }
        catch (e) { if (!(e instanceof AppError) || !['bad_json', 'bad_step'].includes(e.code)) throw e; lastError = e; }
      }
      throw lastError;
    } catch (e) {
      return fail(e);
    }
  };
}
export const handleAgent = createAgentHandler();
