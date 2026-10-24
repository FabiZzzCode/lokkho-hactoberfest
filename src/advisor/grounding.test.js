import { describe, it, expect } from 'vitest';
import { checkGrounding, numbersIn } from './grounding.js';

const results = [{ currentCgpa: 3.481, requiredAverageGpa: 3.625, exams: [{ date: '2026-11-02', daysLeft: 3 }], creditsLeft: 24 }];

describe('grounding check', () => {
  it('accepts numbers that appear in tool results, also rounded shorter', () => {
    expect(checkGrounding('Your CGPA is 3.481 and you need 3.63 over 24 credits.', results).ok).toBe(true);
    expect(checkGrounding('Your CGPA is about 3.5.', results).ok).toBe(true);
  });
  it('flags invented numbers', () => {
    const r = checkGrounding('You will finish with 3.92 and need 28 credits.', results);
    expect(r).toEqual({ ok: false, ungrounded: ['3.92', '28'] });
  });
  it('does not treat list markers, course codes, small counts or the 4.00 scale as claims', () => {
    expect(checkGrounding('1. Study CSE-2321\n2) Rest well. Two of 3 exams, out of 4.00.', results).ok).toBe(true);
  });
  it('reads numbers inside date strings and accepts numbers from the question', () => {
    expect(checkGrounding('Your mid is on 2026-11-02.', results).ok).toBe(true);
    expect(checkGrounding('If you score 3.9 next term…', results, 'What if I get 3.9 next term?').ok).toBe(true);
  });
  it('reads Bangla digits', () => {
    expect(numbersIn('আপনার সিজিপিএ ৩.৪৮১').map((n) => n.value)).toEqual([3.481]);
    expect(checkGrounding('আপনার সিজিপিএ ৩.৯২', results).ok).toBe(false);
  });
  it('whole numbers above 10 must match exactly', () => {
    expect(checkGrounding('24 credits left', results).ok).toBe(true);
    expect(checkGrounding('25 credits left', results).ok).toBe(false);
  });
});
