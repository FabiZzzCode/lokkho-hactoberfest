import { describe, it, expect } from 'vitest';
import { applyProposal } from './proposals.js';
import { newProfile, makeCourse } from '../../engine/profile.js';

describe('applyProposal', () => {
  const p = newProfile('cse', 2, 3.5);
  p.current.courses = [makeCourse({ code: 'A-1', name: 'A' }), makeCourse({ code: 'B-1', name: 'B' })];
  it('sets the goal without mutating the original', () => {
    expect(applyProposal(p, { type: 'setGoal', goalCgpa: 3.8 }).goalCgpa).toBe(3.8);
    expect(p.goalCgpa).toBe(3.5);
  });
  it('sets a target grade on exactly one course', () => {
    const next = applyProposal(p, { type: 'setCourseTarget', code: 'B-1', grade: 'A' });
    expect(next.current.courses.map((c) => c.targetGrade)).toEqual([undefined, 'A']);
    expect(p.current.courses[1].targetGrade).toBeUndefined();
  });
  it('ignores unknown proposal types', () => expect(applyProposal(p, { type: 'x' })).toBe(p));
});
