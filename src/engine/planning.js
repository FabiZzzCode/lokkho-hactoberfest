import { GRADES, MAX_GPA, EXAM_ALERT_DAYS, EXAM_COMPONENTS } from '../config/grading.config.js';
import { summarize } from './grades.js';
import { courseNeeds, needFor } from './course.js';

/** Lowest grade whose points reach the required GPA (same target for every course). */
export function targetGradeFor(requiredGpa) {
  if (requiredGpa > MAX_GPA) return GRADES[0].grade;
  const ok = GRADES.filter((g) => g.points >= requiredGpa);
  return ok.length ? ok[ok.length - 1].grade : GRADES[0].grade;
}

export function planSemester(requiredGpa, courses) {
  const grade = targetGradeFor(requiredGpa);
  return courses.map((c) => {
    const needs = courseNeeds(c.scheme ?? []);
    return { code: c.code, name: c.name, targetGrade: grade, row: needFor(needs, grade), remainingMax: needs.remainingMax };
  });
}

/** Rank retakes/improvements by CGPA gain if each course reached `assumedGrade`. */
export function rankRetakes(attempts, policy, assumedGrade, currentCredits = 0) {
  const base = summarize(attempts, policy);
  const eligible = base.counted.filter((c) => policy.eligibleGrades.includes(c.grade));
  const out = eligible.map((c) => {
    const sim = summarize([...attempts, { code: c.code, credits: c.credits, grade: assumedGrade }], policy);
    return { code: c.code, name: c.name, from: c.grade, to: assumedGrade, credits: c.credits, newCgpa: sim.cgpa, gain: sim.cgpa - base.cgpa };
  });
  return out.filter((r) => r.gain > 0).sort((a, b) => b.gain - a.gain);
}

/** Exam alerts: mid/final within `days` days (past exams are skipped). */
export function examAlerts(courses, today = new Date(), days = EXAM_ALERT_DAYS) {
  const start = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const alerts = [];
  for (const c of courses) {
    for (const key of EXAM_COMPONENTS) {
      const d = c.examDates?.[key];
      if (!d) continue;
      const diff = Math.round((new Date(`${d}T00:00:00`) - start) / 86400000);
      if (diff >= 0 && diff <= days) alerts.push({ code: c.code, name: c.name, component: key, date: d, daysLeft: diff });
    }
  }
  return alerts.sort((a, b) => a.daysLeft - b.daysLeft);
}
