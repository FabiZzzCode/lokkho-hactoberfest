import { AppError } from '../errors.js';
import { GRADES } from '../../src/config/grading.config.js';

const bad = (what) => new AppError('bad_output', `The AI answer did not match the expected format (${what}).`, 502);
const isStr = (s, max) => typeof s === 'string' && s.trim().length > 0 && s.length <= max;
const isNum = (n, min, max) => typeof n === 'number' && Number.isFinite(n) && n >= min && n <= max;
const GRADE_NAMES = GRADES.map((g) => g.grade);

export function validateCourses(o) {
  if (!Array.isArray(o?.courses) || o.courses.length === 0 || o.courses.length > 40) throw bad('courses');
  return o.courses.map((c) => {
    if (!isStr(c.name, 150) || !isNum(Number(c.credits), 0.5, 12)) throw bad('course');
    return { code: String(c.code ?? '').slice(0, 30), name: c.name.trim(), credits: Number(c.credits), type: c.type === 'lab' ? 'lab' : 'theory' };
  });
}

export function validateScheme(o) {
  if (!Array.isArray(o?.components) || o.components.length === 0 || o.components.length > 12) throw bad('components');
  return o.components.map((c) => {
    if (!isStr(c.name, 60) || !isNum(Number(c.max), 1, 200)) throw bad('component');
    return { name: c.name.trim(), max: Number(c.max) };
  });
}

const NUM = /\d+(?:\.\d+)?/g;
const GRADE_TOKEN = /(?<![A-Za-z])[ABCD][+-]/g;
const BN_DIGITS = '০১২৩৪৫৬৭৮৯';
const asciiDigits = (s) => s.replace(/[০-৯]/g, (d) => BN_DIGITS.indexOf(d));

/** Keeps tips whose numbers and grades all appear in the input facts; reports the rest as rejected. */
export function validateTips(o, facts) {
  if (!Array.isArray(o?.tips) || o.tips.length === 0) throw bad('tips');
  const factText = JSON.stringify(facts);
  const allowed = new Set((factText.match(NUM) ?? []).flatMap((n) => [n, String(Number(n))]));
  const allowedGrades = new Set(factText.match(GRADE_TOKEN) ?? []);
  const kept = [];
  let rejected = 0;
  for (const t of o.tips.slice(0, 8)) {
    if (!isStr(t, 400)) { rejected++; continue; }
    const text = asciiDigits(t);
    const okNums = (text.match(NUM) ?? []).every((n) => allowed.has(n) || allowed.has(String(Number(n))));
    const okGrades = (text.match(GRADE_TOKEN) ?? []).every((g) => allowedGrades.has(g));
    if (okNums && okGrades) kept.push(t.trim()); else rejected++;
  }
  if (!kept.length) throw new AppError('unsafe_output', 'The AI tips mentioned numbers that were not in your data, so they were hidden.', 502);
  return { tips: kept.slice(0, 6), rejected };
}

export function validateScenario(o) {
  const s = o?.scenario;
  if (s?.kind === 'semesterGpa' && isNum(s.gpa, 0, 4) && isNum(s.credits, 1, 40)) return { kind: s.kind, gpa: s.gpa, credits: s.credits };
  if (s?.kind === 'retake' && isStr(s.code, 30) && GRADE_NAMES.includes(s.grade)) return { kind: s.kind, code: s.code, grade: s.grade };
  if (s?.kind === 'goal' && isNum(s.target, 0, 4)) return { kind: s.kind, target: s.target };
  throw bad('scenario');
}
