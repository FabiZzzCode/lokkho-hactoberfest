import { describe, it, expect } from 'vitest';
import { newProfile, makeCourse } from '../../engine/profile.js';
import { runTool, toolNames, validateArgs, getTool, toolCatalog } from '../registry.js';

// Hand-checked fixture. Past: X 3cr A+ (12.0 points) + Y 3cr B (9.0) => 6 credits, quality 21, CGPA 3.5.
// Program 30 credits, goal 3.6. Current: Z 3cr theory with attendance 9/10, assignment 8/10, mid 24/30 (41 of 50 so far), final open.
function fixture() {
  const p = newProfile('cse', 2, 3.6);
  p.totalCredits = 30;
  p.pastSemesters = [{ semester: 1, courses: [
    { code: 'X-1', name: 'Ex One', credits: 3, grade: 'A+' },
    { code: 'Y-1', name: 'Why One', credits: 3, grade: 'B' },
  ] }];
  const z = makeCourse({ code: 'Z-2', name: 'Zed Two', credits: 3, type: 'theory' });
  [9, 8, 24].forEach((v, i) => { z.scheme[i].obtained = v; });
  z.examDates = { mid: '2026-11-02', final: '2027-03-01' };
  p.current.courses = [z];
  return { profile: p, today: new Date(2026, 9, 30) };
}
const ctx = fixture();
const run = (n, a) => runTool(n, a, ctx);

describe('tool registry', () => {
  it('lists every tool once with a description and an args schema', () => {
    const names = toolNames();
    expect(new Set(names).size).toBe(names.length);
    for (const t of toolCatalog()) { expect(t.description.length).toBeGreaterThan(10); expect(typeof t.args).toBe('object'); }
  });
  it('rejects unknown tools, unknown args, missing and wrong-typed args', () => {
    expect(run('nope').error).toMatch(/Unknown tool/);
    expect(run('marks_needed', {}).error).toMatch(/missing/);
    expect(run('marks_needed', { course: 'Z-2', extra: 1 }).error).toMatch(/unknown argument/);
    expect(validateArgs(getTool('required_avg'), { target: 9 }).ok).toBe(false);
    expect(validateArgs(getTool('required_avg'), { target: '3.5' })).toEqual({ ok: true, args: { target: 3.5 } });
  });
});

describe('get_summary', () => {
  it('CGPA (12+9)/6 = 3.5, 6 credits done, 24 left', () => {
    expect(run('get_summary')).toMatchObject({ currentCgpa: 3.5, creditsDone: 6, creditsLeft: 24, targetCgpa: 3.6, registeredCourses: 1 });
  });
});

describe('required_avg', () => {
  it('needs (3.6*30 - 21)/24 = 3.625; best possible (21+4*24)/30 = 3.9', () => {
    expect(run('required_avg')).toMatchObject({ status: 'needs', requiredAverageGpa: 3.625, bestPossibleCgpa: 3.9, creditsLeft: 24, impossible: false });
  });
  it('says clearly when a target is impossible: (4*30-21)/24 = 4.125 is above 4.00', () => {
    expect(run('required_avg', { target: 4 })).toMatchObject({ status: 'not_reachable', impossible: true, requiredAverageGpa: 4.125 });
  });
});

describe('marks_needed', () => {
  it('41 of 100 so far: A+ needs 80-41=39, A needs 34, B needs 19, D already achieved', () => {
    const r = run('marks_needed', { course: 'Z-2' });
    const g = (x) => r.grades.find((row) => row.grade === x);
    expect([r.marksSoFar, r.marksStillAvailable]).toEqual([41, 50]);
    expect(g('A+')).toMatchObject({ marksNeeded: 39, status: 'possible' });
    expect(g('A').marksNeeded).toBe(34);
    expect(g('B').marksNeeded).toBe(19);
    expect(g('D').status).toBe('already_achieved');
  });
  it('finds a course by name and reports unknown ones', () => {
    expect(run('marks_needed', { course: 'zed' }).course).toBe('Z-2');
    expect(run('marks_needed', { course: 'Q-9' }).knownCourses).toEqual(['Z-2']);
  });
  it('marks a grade impossible when even full marks cannot reach it', () => {
    const c = fixture(); c.profile.current.courses[0].scheme[2].obtained = 0; // 17 so far, 50 left => max 67
    expect(runTool('marks_needed', { course: 'Z-2' }, c).grades.find((x) => x.grade === 'A+').status).toBe('impossible');
  });
});

describe('plan_courses', () => {
  it('required semester GPA 3.625 gives target grade A (3.75) with 34 marks needed', () => {
    const r = run('plan_courses');
    expect(r).toMatchObject({ status: 'needs', requiredSemesterGpa: 3.625 });
    expect(r.courses[0]).toMatchObject({ targetGrade: 'A', marksNeeded: 34 });
  });
});

describe('predict_result', () => {
  it('pace 41/50 = 82%: likely 41+41=82 => A+; best 91 => A+; worst 41+20=61 => B', () => {
    const r = run('predict_result');
    expect(r.likely.courses[0]).toMatchObject({ expectedPercent: 82, grade: 'A+' });
    expect(r.best.courses[0].expectedPercent).toBe(91);
    expect(r.worst.courses[0]).toMatchObject({ expectedPercent: 61, grade: 'B' });
  });
  it('projected CGPA: best/likely (21+12)/9 = 3.667, worst (21+9)/9 = 3.333; assumptions are listed', () => {
    const r = run('predict_result');
    expect([r.best.projectedCgpa, r.likely.projectedCgpa, r.worst.projectedCgpa]).toEqual([3.667, 3.667, 3.333]);
    expect([r.best.semesterGpa, r.worst.semesterGpa]).toEqual([4, 3]);
    expect(r.assumptions.length).toBeGreaterThanOrEqual(3);
    expect(r.disclaimer).toMatch(/not guarantees/);
  });
  it('uses the fallback pace of 70% when nothing is marked', () => {
    const c = fixture(); c.profile.current.courses[0].scheme.forEach((s) => { s.obtained = null; });
    expect(runTool('predict_result', {}, c).likely.courses[0].expectedPercent).toBe(70);
  });
});

describe('simulate_retake', () => {
  it('Y from B to A: (12 + 11.25)/6 = 3.875, gain 0.375', () => {
    expect(run('simulate_retake', { course: 'Y-1', grade: 'A' })).toMatchObject({ oldGrade: 'B', newCgpa: 3.875, gain: 0.375, currentCgpa: 3.5 });
  });
  it('rejects fail grades and unknown courses', () => {
    expect(run('simulate_retake', { grade: 'F' }).error).toBeTruthy();
    expect(run('simulate_retake', { grade: 'A', course: 'nope' }).error).toMatch(/No past course/);
  });
  it('ranks eligible retakes only (B is not eligible under the default policy)', () => {
    expect(run('simulate_retake', { grade: 'A' }).best).toEqual([]);
  });
});

describe('exam_alerts', () => {
  it('mid on 2026-11-02 is 3 days from 2026-10-30; the final in March is outside 30 days', () => {
    expect(run('exam_alerts')).toMatchObject({ count: 1, exams: [{ course: 'Z-2', exam: 'mid', daysLeft: 3 }] });
  });
});

describe('propose_target', () => {
  it('only returns proposals and never changes the profile', () => {
    const before = JSON.stringify(ctx.profile);
    expect(run('propose_target', { goalCgpa: 3.5 })).toEqual({ proposal: { type: 'setGoal', goalCgpa: 3.5 } });
    expect(run('propose_target', { course: 'Z-2', grade: 'A' }).proposal).toMatchObject({ type: 'setCourseTarget', code: 'Z-2', grade: 'A' });
    expect(run('propose_target', {}).error).toBeTruthy();
    expect(JSON.stringify(ctx.profile)).toBe(before);
  });
});
