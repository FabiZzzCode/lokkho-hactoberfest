import { summarize, goalMath } from './grades.js';
import { RETAKE_POLICY } from '../config/grading.config.js';

/** Computes a validated scenario (from the AI) with plain code. The model never calculates. */
export function runScenario(s, profile, derived) {
  const base = { target: profile.goalCgpa, totalCredits: profile.totalCredits };
  if (s.kind === 'semesterGpa') {
    const credits = derived.credits + s.credits;
    const quality = derived.quality + s.gpa * s.credits;
    return { kind: s.kind, cgpa: quality / credits, goal: goalMath({ ...base, creditsDone: credits, quality }) };
  }
  if (s.kind === 'retake') {
    const known = derived.counted.find((c) => c.code === s.code);
    if (!known) return { kind: s.kind, unknownCourse: s.code };
    const sim = summarize([...derived.attempts, { code: s.code, credits: known.credits, grade: s.grade }], RETAKE_POLICY);
    return { kind: s.kind, cgpa: sim.cgpa, goal: goalMath({ ...base, creditsDone: sim.credits, quality: sim.quality }) };
  }
  return { kind: 'goal', goal: goalMath({ target: s.target, totalCredits: profile.totalCredits, creditsDone: derived.credits, quality: derived.quality }) };
}
