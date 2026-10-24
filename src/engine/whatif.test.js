import { describe, it, expect } from 'vitest';
import { runScenario } from './whatif.js';
import { newProfile, derive } from './profile.js';

const p = newProfile('custom', 3, 3.5); p.totalCredits = 12;
p.pastSemesters = [{ semester: 1, courses: [{ code: 'A', name: 'a', credits: 3, grade: 'B' }, { code: 'F1', name: 'f', credits: 3, grade: 'F' }] }];
const d = derive(p);

describe('what-if scenarios', () => {
  it('semester GPA 4.0 over 3 credits: (9 + 12)/9 = 2.3333', () => {
    expect(runScenario({ kind: 'semesterGpa', gpa: 4, credits: 3 }, p, d).cgpa).toBeCloseTo(2.333333, 5);
  });
  it('retaking F1 with A: (9 + 11.25)/6 = 3.375', () => {
    expect(runScenario({ kind: 'retake', code: 'F1', grade: 'A' }, p, d).cgpa).toBeCloseTo(3.375, 6);
  });
  it('unknown course is reported, not guessed', () => {
    expect(runScenario({ kind: 'retake', code: 'NOPE', grade: 'A' }, p, d).unknownCourse).toBe('NOPE');
  });
  it('goal scenario: target 3 over 12 credits: (36-9)/6 = 4.5 -> not reachable', () => {
    expect(runScenario({ kind: 'goal', target: 3 }, p, d).goal.status).toBe('not_reachable');
  });
});
