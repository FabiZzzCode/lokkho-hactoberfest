import { planSemester } from '../../engine/planning.js';
import { derived, round } from './helpers.js';

export default {
  name: 'plan_courses',
  description: 'Target grade for every current course and the marks needed in each, to reach the required semester GPA.',
  args: {},
  run(_args, ctx) {
    const g = derived(ctx).goal;
    const courses = ctx.profile.current.courses;
    if (!courses.length) return { error: 'No courses are registered for this semester.' };
    if (g.status === 'on_track') return { status: 'on_track', note: 'The goal is already secured; any passing grades keep it.' };
    if (g.status === 'not_reachable') return { status: 'not_reachable', bestPossibleCgpa: round(g.best) };
    return {
      status: 'needs', requiredSemesterGpa: round(g.needed),
      courses: planSemester(g.needed, courses).map((p) => ({
        course: p.code, name: p.name, targetGrade: p.targetGrade, marksStillAvailable: p.remainingMax,
        marksNeeded: p.row.impossible ? null : round(p.row.needed, 1),
        status: p.row.impossible ? 'impossible' : p.row.achieved ? 'already_achieved' : 'possible',
      })),
    };
  },
};
