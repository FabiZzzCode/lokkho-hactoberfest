import { describe, it, expect } from 'vitest';
import { summarize, semesterGpa, goalMath } from './grades.js';
import { courseNeeds } from './course.js';
import { targetGradeFor, planSemester, rankRetakes, examAlerts } from './planning.js';
import { RETAKE_POLICY } from '../config/grading.config.js';

const near = (a, b) => expect(a).toBeCloseTo(b, 6);

describe('GPA', () => {
  it('weights by credits incl. a 1.5 credit lab', () => {
    // A+ 3cr =12, B 3cr =9, A 1.5cr =5.625 -> 26.625 / 7.5 = 3.55
    const r = semesterGpa([
      { credits: 3, grade: 'A+' }, { credits: 3, grade: 'B' }, { credits: 1.5, grade: 'A' },
    ]);
    near(r.quality, 26.625); near(r.credits, 7.5); near(r.gpa, 3.55);
  });
  it('rounding case: B- 1.5cr + C+ 3cr = 11.625 / 4.5 = 2.58333', () => {
    const r = semesterGpa([{ credits: 1.5, grade: 'B-' }, { credits: 3, grade: 'C+' }]);
    near(r.gpa, 2.583333); expect(r.gpa.toFixed(3)).toBe('2.583');
  });
  it('withdrawn course credits are excluded', () => {
    // A+ 3cr counts, W 3cr excluded -> 12/3 = 4.000
    const r = semesterGpa([{ credits: 3, grade: 'A+' }, { credits: 3, grade: 'W' }]);
    near(r.credits, 3); near(r.gpa, 4);
  });
});

describe('retake policy', () => {
  const attempts = [
    { code: 'X', credits: 3, grade: 'F' }, { code: 'Y', credits: 3, grade: 'A' }, { code: 'X', credits: 3, grade: 'B' },
  ];
  it('latest attempt replaces: B 9 + A 11.25 = 20.25 / 6 = 3.375', () => {
    const s = summarize(attempts); near(s.cgpa, 3.375); near(s.credits, 6);
  });
  it('maximum grade after retake caps the retake: B cap, retake A -> 3.00', () => {
    const s = summarize([{ code: 'X', credits: 3, grade: 'F' }, { code: 'X', credits: 3, grade: 'A' }],
      { ...RETAKE_POLICY, maxGradeAfterRetake: 'B' });
    near(s.cgpa, 3);
  });
  it('earned credits exclude failed courses', () => {
    near(summarize([{ code: 'Z', credits: 3, grade: 'F' }, { code: 'W', credits: 2, grade: 'B' }]).earned, 2);
  });
});

describe('goal math', () => {
  it('needs (3.6*160 - 350)/60 = 3.7667', () => {
    const g = goalMath({ target: 3.6, totalCredits: 160, creditsDone: 100, quality: 350 });
    near(g.needed, 3.766667); expect(g.status).toBe('needs'); expect(g.remaining).toBe(60);
  });
  it('unreachable: needs 4.5667 > 4, best = (350+240)/160 = 3.6875', () => {
    const g = goalMath({ target: 3.9, totalCredits: 160, creditsDone: 100, quality: 350 });
    expect(g.status).toBe('not_reachable'); near(g.best, 3.6875);
  });
});

describe('course needs', () => {
  const scheme = (a, b, c) => [
    { name: 'attendance', max: 10, obtained: a }, { name: 'assignment', max: 10, obtained: b },
    { name: 'mid', max: 30, obtained: c }, { name: 'final', max: 50, obtained: null },
  ];
  it('obtained 41 of 50: A+ needs 80-41 = 39 of 50 final (78%), A needs 34', () => {
    const n = courseNeeds(scheme(9, 8, 24));
    const row = (g) => n.rows.find((r) => r.grade === g);
    near(n.obtained, 41); near(row('A+').needed, 39); near(row('A+').percent, 78); near(row('A').needed, 34);
    expect(row('F').achieved).toBe(true);
  });
  it('marks a grade impossible when needed exceeds remaining marks', () => {
    const n = courseNeeds(scheme(5, 5, 10)); // 20 obtained, A+ needs 60 > 50
    expect(n.rows.find((r) => r.grade === 'A+').impossible).toBe(true);
    expect(n.rows.find((r) => r.grade === 'A').impossible).toBe(true); // 75-20 = 55 > 50
    expect(n.rows.find((r) => r.grade === 'B+').impossible).toBe(false); // 65-20 = 45 <= 50
  });
});

describe('planning', () => {
  it('target grade: 3.5 -> A-, 3.51 -> A, above 4 -> A+', () => {
    expect(targetGradeFor(3.5)).toBe('A-'); expect(targetGradeFor(3.51)).toBe('A'); expect(targetGradeFor(4.2)).toBe('A+');
  });
  it('semester plan gives marks needed for the target grade', () => {
    const p = planSemester(3.5, [{ code: 'C1', name: 'n', scheme: [{ name: 'final', max: 50, obtained: null }, { name: 'mid', max: 50, obtained: 30 }] }]);
    expect(p[0].targetGrade).toBe('A-'); near(p[0].row.needed, 40);
  });
  it('ranks retakes: F->A on 3cr course gains 3.75*3/6 = 1.875 CGPA', () => {
    const r = rankRetakes([{ code: 'X', credits: 3, grade: 'F' }, { code: 'Y', credits: 3, grade: 'A' }], RETAKE_POLICY, 'A');
    expect(r).toHaveLength(1); expect(r[0].code).toBe('X'); near(r[0].gain, 1.875);
  });
});

describe('exam alerts', () => {
  it('lists only exams 0..30 days away', () => {
    const today = new Date(2026, 9, 24);
    const a = examAlerts([{ code: 'C', name: 'n', examDates: { mid: '2026-11-10', final: '2026-12-30' } },
      { code: 'D', name: 'n', examDates: { mid: '2026-10-01' } }], today);
    expect(a).toHaveLength(1); expect(a[0].daysLeft).toBe(17);
  });
});
