import { MAX_GPA } from '../config/grading.config.js';

const BN_DIGITS = '০১২৩৪৫৬৭৮৯';
const normalize = (s) => String(s).replace(/[০-৯]/g, (d) => BN_DIGITS.indexOf(d));
const NUM = /\d+(?:\.\d+)?/g;
const MAX_FREE_INT = 10; // plain small whole numbers ("2 courses", list counts) are not grades

/** Numbers in free text. Course codes (CSE-2321) and list markers ("1.") are not claims. */
export function numbersIn(text) {
  const cleaned = normalize(text)
    .replace(/[A-Za-z]{2,6}-\d{3,5}/g, ' ')
    .replace(/^\s*(?:[-*•]\s*)?\d+[.)]\s/gm, ' ');
  return (cleaned.match(NUM) ?? []).map((s) => ({ text: s, value: Number(s), decimals: s.includes('.') ? s.split('.')[1].length : 0 }));
}

/** Every number in any value of a tool result, including digits inside strings such as dates. */
export function numbersInResult(value, out = []) {
  if (typeof value === 'number') out.push(value);
  else if (typeof value === 'string') numbersIn(value).forEach((n) => out.push(n.value));
  else if (Array.isArray(value)) value.forEach((v) => numbersInResult(v, out));
  else if (value && typeof value === 'object') Object.values(value).forEach((v) => numbersInResult(v, out));
  return out;
}

const round = (x, d) => Math.round(x * 10 ** d) / 10 ** d;

/**
 * Grounding check: every number in the answer must appear in a tool result (or in the question).
 * Decimals may be rounded shorter (3.667 can be written 3.67); whole numbers must match exactly.
 * Returns { ok, ungrounded: string[] }.
 */
export function checkGrounding(answer, results, question = '') {
  const known = [...results.flatMap((r) => numbersInResult(r)), ...numbersIn(question).map((n) => n.value), MAX_GPA, 100];
  const ungrounded = [];
  for (const n of numbersIn(answer)) {
    if (n.decimals === 0 && n.value <= MAX_FREE_INT) continue;
    const hit = known.some((x) => (n.decimals === 0 ? x === n.value : Math.abs(round(x, n.decimals) - n.value) < 1e-9));
    if (!hit && !ungrounded.includes(n.text)) ungrounded.push(n.text);
  }
  return { ok: ungrounded.length === 0, ungrounded };
}
