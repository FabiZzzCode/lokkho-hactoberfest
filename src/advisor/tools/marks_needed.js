import { courseNeeds } from '../../engine/course.js';
import { findCurrentCourse, unknownCourse, round } from './helpers.js';

export default {
  name: 'marks_needed',
  description: 'For ONE current-semester course (by code or name): marks needed in the remaining components for each grade, from its marking scheme.',
  args: { course: { type: 'string', required: true, max: 80 } },
  run({ course }, ctx) {
    const c = findCurrentCourse(ctx, course);
    if (!c) return unknownCourse(ctx, course);
    const n = courseNeeds(c.scheme);
    return {
      course: c.code, name: c.name,
      marksSoFar: round(n.obtained, 1), totalMarks: n.total, marksStillAvailable: n.remainingMax,
      grades: n.rows.filter((r) => r.grade !== 'F').map((r) => ({
        grade: r.grade, marksNeeded: round(r.needed, 1), percentOfRemaining: round(r.percent, 1),
        status: r.impossible ? 'impossible' : r.achieved ? 'already_achieved' : 'possible',
      })),
      note: 'Marks ranges per grade are unverified defaults.',
    };
  },
};
