import { describe, it, expect } from 'vitest';
import { buildDraft, mergeParsed, draftToSaved } from './pastResults.js';
import { newProfile } from '../../engine/profile.js';

describe('past results draft', () => {
  const p = newProfile('cse', 3, 3.5);
  it('creates one draft semester per past semester from the catalog, ungraded', () => {
    const d = buildDraft(p);
    expect(d.map((s) => s.semester)).toEqual([1, 2]);
    expect(d[0].courses[0]).toMatchObject({ code: 'CSE-1121', grade: '' });
    expect(draftToSaved(d)).toEqual([]);
  });
  it('merge replaces matching semesters and ignores future ones', () => {
    const d = mergeParsed(buildDraft(p), [
      { semester: 1, term: 'T1', courses: [{ code: 'X-1', name: 'x', credits: 3, grade: 'A' }] },
      { semester: 5, term: 'T5', courses: [{ code: 'Y-1', name: 'y', credits: 3, grade: 'A' }] },
    ]);
    expect(d).toHaveLength(2);
    expect(draftToSaved(d)).toHaveLength(1);
  });
  it('skipped semester is kept even with no grades', () => {
    const d = buildDraft(p); d[1].skipped = true;
    expect(draftToSaved(d).map((s) => s.semester)).toEqual([2]);
  });
});
