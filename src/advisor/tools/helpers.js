import { RETAKE_POLICY } from '../../config/grading.config.js';
import { derive } from '../../engine/profile.js';

// Round for output: the model copies numbers, so keep them short and exact.
export const round = (n, d = 3) => (Number.isFinite(n) ? Math.round(n * 10 ** d) / 10 ** d : null);
export const derived = (ctx) => derive(ctx.profile, RETAKE_POLICY);

/** Find a current-semester course by code or by (part of) its name. */
export function findCurrentCourse(ctx, query) {
  const q = String(query ?? '').trim().toLowerCase();
  if (!q) return null;
  const list = ctx.profile.current.courses;
  return list.find((c) => c.code.toLowerCase() === q) ?? list.find((c) => c.name.toLowerCase().includes(q)) ?? null;
}
export const unknownCourse = (ctx, query) => ({
  error: `No current course matches "${query}".`,
  knownCourses: ctx.profile.current.courses.map((c) => c.code),
});
