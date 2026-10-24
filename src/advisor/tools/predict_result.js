import { RETAKE_POLICY } from '../../config/grading.config.js';
import { summarize, gradeForMarks, pointsOf, semesterGpa } from '../../engine/grades.js';
import { goalMath } from '../../engine/grades.js';
import { courseNeeds } from '../../engine/course.js';
import { PREDICTION } from '../config.js';
import { derived, round } from './helpers.js';

// Share of the marks scored so far; the student's own pace is the "likely" assumption.
function paceOf(scheme) {
  const done = scheme.filter((c) => c.obtained != null && c.obtained !== '');
  const max = done.reduce((s, c) => s + c.max, 0);
  return max ? done.reduce((s, c) => s + Number(c.obtained), 0) / max : null;
}

function scenario(label, ratioOf, ctx, d) {
  const courses = ctx.profile.current.courses.map((c) => {
    const n = courseNeeds(c.scheme);
    const ratio = ratioOf(paceOf(c.scheme));
    const percent = ((n.obtained + ratio * n.remainingMax) / n.total) * 100;
    const grade = gradeForMarks(percent);
    return { code: c.code, credits: c.credits, expectedPercent: round(percent, 1), grade, points: pointsOf(grade) };
  });
  const sem = semesterGpa(courses);
  const all = summarize([...d.attempts, ...courses.map((c) => ({ code: c.code, credits: c.credits, grade: c.grade }))], RETAKE_POLICY);
  const goal = goalMath({ target: ctx.profile.goalCgpa, totalCredits: ctx.profile.totalCredits, creditsDone: all.credits, quality: all.quality });
  return { label, semesterGpa: round(sem.gpa), projectedCgpa: round(all.cgpa), courses: courses.map(({ points, credits, ...c }) => c), targetStatus: goal.status };
}

export default {
  name: 'predict_result',
  description: 'Predict this semester: best, likely and worst semester GPA and projected CGPA, using marks so far and assumptions about the remaining components.',
  args: {},
  run(_args, ctx) {
    if (!ctx.profile.current.courses.length) return { error: 'No courses are registered for this semester.' };
    const d = derived(ctx);
    const { fallbackRatio, worstRatio, bestRatio } = PREDICTION;
    return {
      assumptions: [
        `Best: full marks (${bestRatio * 100}%) on every remaining component.`,
        `Likely: the same share of marks as scored so far (${fallbackRatio * 100}% if nothing is marked yet).`,
        `Worst: only ${worstRatio * 100}% of the remaining marks.`,
        'Marks ranges per grade are unverified defaults.',
      ],
      best: scenario('best', () => bestRatio, ctx, d),
      likely: scenario('likely', (p) => p ?? fallbackRatio, ctx, d),
      worst: scenario('worst', (p) => Math.min(worstRatio, p ?? worstRatio), ctx, d),
    };
  },
};
