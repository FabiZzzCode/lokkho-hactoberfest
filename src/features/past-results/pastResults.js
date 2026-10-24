import { defaultCourses } from '../../data/curricula/index.js';

/** Draft = one entry per past semester (1..current-1): saved data if any, else the catalog defaults with empty grades. */
export function buildDraft(profile) {
  return Array.from({ length: profile.currentSemester - 1 }, (_, i) => {
    const sem = i + 1;
    const saved = profile.pastSemesters.find((s) => s.semester === sem);
    if (saved) return { ...saved, courses: saved.courses.map((c) => ({ ...c })) };
    return { semester: sem, skipped: false, courses: defaultCourses(profile.programId, sem).map((c) => ({ code: c.code, name: c.name, credits: c.credits, grade: '' })) };
  });
}

/** Merge parsed pages (keyed by semester number) over the draft, adding semesters beyond the current one is not allowed. */
export function mergeParsed(draft, parsedSemesters) {
  const bySem = new Map(draft.map((s) => [s.semester, s]));
  for (const p of parsedSemesters) {
    if (!bySem.has(p.semester)) continue;
    bySem.set(p.semester, { semester: p.semester, term: p.term, skipped: false, courses: p.courses.map((c) => ({ ...c })) });
  }
  return [...bySem.values()].sort((a, b) => a.semester - b.semester);
}

/** Only semesters with a graded course (or explicitly skipped) are saved. */
export function draftToSaved(draft) {
  return draft
    .map((s) => ({ ...s, courses: s.courses.filter((c) => c.grade) }))
    .filter((s) => s.skipped || s.courses.length > 0);
}
