import { PROGRAM_TOTAL_CREDITS, SCHEME_TEMPLATES, GRADES, WITHDRAW_GRADE } from '../config/grading.config.js';
import { summarize, goalMath } from './grades.js';

export const PROFILE_VERSION = 1;
export const MAX_SEMESTER = 12;
const VALID_GRADES = [...GRADES.map((g) => g.grade), WITHDRAW_GRADE];

export const newProfile = (programId = 'cse', currentSemester = 1, goalCgpa = 3.5) => ({
  version: PROFILE_VERSION,
  programId,
  currentSemester,
  goalCgpa,
  totalCredits: PROGRAM_TOTAL_CREDITS[programId] ?? 120,
  pastSemesters: [], // [{semester, term?, skipped?, courses:[{code,name,credits,grade}]}]
  current: { courses: [] }, // [{code,name,credits,type,scheme:[{name,max,obtained}],examDates:{}}]
  language: 'en',
});

export const schemeFor = (type) => SCHEME_TEMPLATES[type === 'lab' ? 'lab' : 'theory'].map((c) => ({ ...c, obtained: null }));

export const makeCourse = (c) => ({
  code: c.code ?? '', name: c.name ?? '', credits: Number(c.credits) || 0, type: c.type === 'lab' ? 'lab' : 'theory',
  scheme: c.scheme ?? schemeFor(c.type), examDates: c.examDates ?? {},
});

/** All past attempts, oldest semester first, so retake policy sees them in order. */
export function pastAttempts(profile) {
  return [...profile.pastSemesters]
    .filter((s) => !s.skipped)
    .sort((a, b) => a.semester - b.semester)
    .flatMap((s) => s.courses.filter((c) => c.grade).map((c) => ({ ...c, semester: s.semester })));
}

export function derive(profile, policy) {
  const attempts = pastAttempts(profile);
  const sum = summarize(attempts, policy);
  const goal = goalMath({ target: profile.goalCgpa, totalCredits: profile.totalCredits, creditsDone: sum.credits, quality: sum.quality });
  return { attempts, ...sum, goal };
}

const isNum = (n) => typeof n === 'number' && Number.isFinite(n);
const str = (s, max = 200) => typeof s === 'string' && s.length <= max;

/** Validates a profile document (client import and server). Returns list of problems. */
export function validateProfile(p) {
  const errs = [];
  if (!p || typeof p !== 'object') return ['not_object'];
  if (p.version !== PROFILE_VERSION) errs.push('version');
  if (!str(p.programId, 40)) errs.push('programId');
  if (!isNum(p.currentSemester) || p.currentSemester < 1 || p.currentSemester > MAX_SEMESTER) errs.push('currentSemester');
  if (!isNum(p.goalCgpa) || p.goalCgpa < 0 || p.goalCgpa > 4) errs.push('goalCgpa');
  if (!isNum(p.totalCredits) || p.totalCredits <= 0 || p.totalCredits > 400) errs.push('totalCredits');
  if (!Array.isArray(p.pastSemesters) || p.pastSemesters.length > 20) errs.push('pastSemesters');
  else for (const s of p.pastSemesters) {
    if (!isNum(s.semester) || !Array.isArray(s.courses) || s.courses.length > 40) { errs.push('pastSemester'); break; }
    for (const c of s.courses) {
      if (!str(c.code, 30) || !str(c.name, 150) || !isNum(c.credits) || c.credits < 0 || c.credits > 12 || (c.grade && !VALID_GRADES.includes(c.grade))) { errs.push('pastCourse'); break; }
    }
  }
  const cur = p.current?.courses;
  if (!Array.isArray(cur) || cur.length > 30) errs.push('current');
  else for (const c of cur) {
    if (!str(c.code, 30) || !str(c.name, 150) || !isNum(c.credits) || !Array.isArray(c.scheme) || c.scheme.length > 12) { errs.push('currentCourse'); break; }
  }
  if (!['en', 'bn'].includes(p.language)) errs.push('language');
  return errs;
}
