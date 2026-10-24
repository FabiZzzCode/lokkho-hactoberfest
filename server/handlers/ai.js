import { AppError, fail, ok } from '../errors.js';
import { rateLimited } from '../rateLimit.js';
import { generate, extractJson } from '../ai/provider.js';
import { prompts } from '../ai/prompts.js';
import { IMAGE_IMPORT } from '../../src/config/features.js';
import { validateCourses, validateScheme, validateTips, validateScenario } from '../ai/schemas.js';

const MAX_TEXT = 8000;
const MAX_IMAGE_B64 = 3_000_000; // Vercel request bodies are limited to ~4.5 MB
const IMAGE_MIMES = ['image/png', 'image/jpeg', 'image/webp'];
const RATE_PER_MIN = 12;
const FAST = { fast: true }; // same minimal-thinking setting as the agent (AI_THINKING)

function readText(body) {
  if (typeof body.text !== 'string' || !body.text.trim()) throw new AppError('invalid_input', 'Please paste some text first.');
  if (body.text.length > MAX_TEXT) throw new AppError('invalid_input', `Text is too long (max ${MAX_TEXT} characters).`, 413);
  return body.text;
}
function readImage(body) {
  if (!body.image) return undefined;
  if (!IMAGE_IMPORT) throw new AppError('invalid_input', 'Photo import is turned off. Paste the text instead.');
  const { mime, data } = body.image;
  if (!IMAGE_MIMES.includes(mime) || typeof data !== 'string' || data.length > MAX_IMAGE_B64) throw new AppError('invalid_input', 'Image must be a PNG, JPEG or WebP under about 2 MB.', 413);
  return { mime, data };
}
const readFacts = (body) => {
  const f = body.facts;
  if (!f || typeof f !== 'object' || JSON.stringify(f).length > 6000) throw new AppError('invalid_input', 'Missing or oversized facts.');
  return f;
};

const actions = {
  async importCourses(body) {
    const image = readImage(body);
    const text = body.text ? readText(body) : image ? 'See the attached image.' : readText(body);
    return { courses: validateCourses(extractJson(await generate(prompts.importCourses(text), image, FAST))) };
  },
  async importScheme(body) {
    return { components: validateScheme(extractJson(await generate(prompts.importScheme(readText(body)), undefined, FAST))) };
  },
  async coach(body) {
    const facts = readFacts(body);
    return validateTips(extractJson(await generate(prompts.coach(facts), undefined, FAST)), facts);
  },
  async whatif(body) {
    const codes = Array.isArray(body.codes) ? body.codes.slice(0, 40).map(String) : [];
    return { scenario: validateScenario(extractJson(await generate(prompts.whatif(readText(body), { codes }), undefined, FAST))) };
  },
};

export async function handleAi({ method, body, ip }) {
  try {
    if (method !== 'POST') throw new AppError('method', 'Use POST.', 405);
    if (rateLimited(`ai:${ip}`, RATE_PER_MIN)) throw new AppError('rate_limited', 'Too many AI requests. Please wait a minute.', 429);
    const run = actions[body?.action];
    if (!run) throw new AppError('invalid_input', 'Unknown action.');
    return ok(await run(body));
  } catch (e) {
    return fail(e);
  }
}
