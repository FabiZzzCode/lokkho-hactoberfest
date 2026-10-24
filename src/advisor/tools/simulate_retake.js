import { RETAKE_POLICY } from '../../config/grading.config.js';
import { summarize, pointsOf } from '../../engine/grades.js';
import { rankRetakes } from '../../engine/planning.js';
import { derived, round } from './helpers.js';

export default {
  name: 'simulate_retake',
  description: 'New CGPA if a past course is retaken or improved with a given grade. Give "course" (code or name) for one course, or omit it to rank the best retakes.',
  args: { grade: { type: 'string', required: true, max: 3 }, course: { type: 'string', required: false, max: 80 } },
  run({ grade, course }, ctx) {
    if (pointsOf(grade) == null || pointsOf(grade) === 0) return { error: `"${grade}" is not a passing grade on the scale.` };
    const d = derived(ctx);
    const base = round(d.cgpa);
    if (!course) {
      const ranked = rankRetakes(d.attempts, RETAKE_POLICY, grade).slice(0, 3);
      return { assumedGrade: grade, currentCgpa: base, best: ranked.map((r) => ({ course: r.code, name: r.name, from: r.from, newCgpa: round(r.newCgpa), gain: round(r.gain) })), note: ranked.length ? undefined : 'No past course is eligible for a worthwhile retake under the current policy.' };
    }
    const q = String(course).toLowerCase();
    const hit = d.counted.find((c) => c.code.toLowerCase() === q) ?? d.counted.find((c) => c.name?.toLowerCase().includes(q));
    if (!hit) return { error: `No past course matches "${course}".`, knownCourses: d.counted.map((c) => c.code).slice(0, 30) };
    const sim = summarize([...d.attempts, { code: hit.code, credits: hit.credits, grade }], RETAKE_POLICY);
    return {
      course: hit.code, name: hit.name, oldGrade: hit.grade, newGrade: grade, currentCgpa: base,
      newCgpa: round(sim.cgpa), gain: round(sim.cgpa - d.cgpa),
      eligibleUnderPolicy: RETAKE_POLICY.eligibleGrades.includes(hit.grade),
      policy: `${RETAKE_POLICY.mode === 'latest' ? 'The latest attempt replaces the earlier one' : 'The better grade counts'} (unverified default).`,
    };
  },
};
