import { GRADES, WITHDRAW_GRADE, RETAKE_POLICY, MAX_GPA, GPA_DECIMALS } from '../config/grading.config.js';

export const pointsOf = (grade) => GRADES.find((g) => g.grade === grade)?.points ?? null;
export const isWithdrawn = (grade) => grade === WITHDRAW_GRADE;
export const fmt = (n, d = GPA_DECIMALS) => (Number.isFinite(n) ? n.toFixed(d) : '–');
// Round only for display; keep full precision in maths.
export const gradeForMarks = (marks) =>
  GRADES.find((g) => marks >= g.min)?.grade ?? GRADES[GRADES.length - 1].grade;

// Cap points of a retake attempt if the policy has a maximum grade.
function attemptPoints(a, policy, isRetake) {
  const p = pointsOf(a.grade);
  const cap = policy.maxGradeAfterRetake && isRetake ? pointsOf(policy.maxGradeAfterRetake) : null;
  return cap != null ? Math.min(p, cap) : p;
}

/** Pick which attempt of each course code counts. attempts are in chronological order. */
export function countedAttempts(attempts, policy = RETAKE_POLICY) {
  const byCode = new Map();
  attempts.forEach((a, i) => {
    if (isWithdrawn(a.grade) || pointsOf(a.grade) == null) return; // W and unknown grades never count
    const key = a.code || `__${i}`;
    (byCode.get(key) ?? byCode.set(key, []).get(key)).push(a);
  });
  return [...byCode.values()].map((list) => {
    const scored = list.map((a, idx) => ({ ...a, points: attemptPoints(a, policy, idx > 0) }));
    if (policy.mode === 'best') return scored.reduce((b, a) => (a.points > b.points ? a : b));
    return scored[scored.length - 1];
  });
}

export function summarize(attempts, policy = RETAKE_POLICY) {
  const counted = countedAttempts(attempts, policy);
  const credits = counted.reduce((s, c) => s + c.credits, 0);
  const quality = counted.reduce((s, c) => s + c.credits * c.points, 0);
  const earned = counted.filter((c) => c.points > 0).reduce((s, c) => s + c.credits, 0);
  return { credits, quality, earned, cgpa: credits ? quality / credits : 0, counted };
}

/** GPA of one semester's courses (no retake replacement across semesters). */
export function semesterGpa(courses) {
  const rows = courses.filter((c) => !isWithdrawn(c.grade) && pointsOf(c.grade) != null);
  const credits = rows.reduce((s, c) => s + c.credits, 0);
  const quality = rows.reduce((s, c) => s + c.credits * pointsOf(c.grade), 0);
  return { credits, quality, gpa: credits ? quality / credits : 0 };
}

/** Goal math: GPA needed over the remaining credits to reach the target CGPA. */
export function goalMath({ target, totalCredits, creditsDone, quality }) {
  const remaining = Math.max(totalCredits - creditsDone, 0);
  if (remaining === 0) {
    const cgpa = creditsDone ? quality / creditsDone : 0;
    return { remaining, needed: null, status: cgpa >= target ? 'on_track' : 'not_reachable', best: cgpa };
  }
  const needed = (target * totalCredits - quality) / remaining;
  const best = (quality + MAX_GPA * remaining) / totalCredits;
  const status = needed > MAX_GPA ? 'not_reachable' : needed <= 0 ? 'on_track' : 'needs';
  return { remaining, needed: Math.max(needed, 0), status, best };
}
