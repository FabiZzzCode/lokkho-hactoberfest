import { defaultCourses } from '../../data/curricula/index.js';
import { makeCourse } from '../../engine/profile.js';

/** Rows for the checklist: saved courses first (checked), then catalog defaults (checked only if nothing saved yet). */
export function buildRows(profile) {
  const saved = profile.current.courses;
  const defaults = defaultCourses(profile.programId, profile.currentSemester);
  const savedCodes = new Set(saved.map((c) => c.code));
  return [
    ...saved.map((c) => ({ ...c, checked: true })),
    ...defaults.filter((c) => !savedCodes.has(c.code)).map((c) => ({ ...c, checked: saved.length === 0 })),
  ];
}

/** Ticked rows become the current semester; keeps marks already entered for known codes. */
export function rowsToCourses(rows, existing) {
  return rows.filter((r) => r.checked).map((r) => {
    const old = existing.find((c) => c.code && c.code === r.code);
    return old ? { ...old, name: r.name, credits: r.credits } : makeCourse(r);
  });
}
