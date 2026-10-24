import { describe, it, expect } from 'vitest';
import { newProfile, validateProfile, derive, pastAttempts } from './profile.js';

describe('profile', () => {
  it('new profile is valid', () => expect(validateProfile(newProfile())).toEqual([]));
  it('rejects bad goal and unknown grade', () => {
    const p = newProfile(); p.goalCgpa = 5;
    p.pastSemesters = [{ semester: 1, courses: [{ code: 'X', name: 'n', credits: 3, grade: 'Z' }] }];
    expect(validateProfile(p)).toEqual(expect.arrayContaining(['goalCgpa', 'pastCourse']));
  });
  it('derives CGPA and goal across semesters, skipping skipped ones', () => {
    const p = newProfile('custom', 3, 3.5); p.totalCredits = 12;
    p.pastSemesters = [
      { semester: 2, courses: [{ code: 'B', name: 'b', credits: 3, grade: 'B' }] },
      { semester: 1, courses: [{ code: 'A', name: 'a', credits: 3, grade: 'A+' }] },
      { semester: 4, skipped: true, courses: [{ code: 'Z', name: 'z', credits: 3, grade: 'F' }] },
    ];
    expect(pastAttempts(p).map((c) => c.code)).toEqual(['A', 'B']);
    const d = derive(p);
    // (12 + 9) / 6 = 3.5 ; need (3.5*12 - 21)/6 = 3.5
    expect(d.cgpa).toBeCloseTo(3.5, 6); expect(d.goal.needed).toBeCloseTo(3.5, 6);
  });
});
