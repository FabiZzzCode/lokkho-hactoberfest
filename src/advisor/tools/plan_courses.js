import { planSemester } from '../../engine/planning.js';
import { courseNeeds } from '../../engine/course.js';
import { GRADES } from '../../config/grading.config.js';
import { derived, round } from './helpers.js';

export default {
  name: 'plan_courses',
  description: 'For every current course: the target grade that reaches the goal, and the marks needed in the parts still to come (usually the final), given the marks already entered (attendance, CT, mid). Also gives the best grade still possible when the target is out of reach.',
  args: {},
  run(_args, ctx) {
    const g = derived(ctx).goal;
    const courses = ctx.profile.current.courses;
    if (!courses.length) return { error: 'No courses are registered for this semester.' };
    if (g.status === 'on_track') return { status: 'on_track', note: 'The goal is already secured; any passing grades keep it.' };
    if (g.status === 'not_reachable') return { status: 'not_reachable', bestPossibleCgpa: round(g.best) };
    return {
      status: 'needs', requiredSemesterGpa: round(g.needed),
      courses: planSemester(g.needed, courses).map((p, i) => ({
        course: p.code, name: p.name, targetGrade: p.targetGrade, marksStillAvailable: p.remainingMax,
        remainingParts: courses[i].scheme.filter((x) => x.obtained == null || x.obtained === '').map((x) => `${x.name} (${x.max})`),
        bestGradePossible: GRADES.find((gr) => !courseNeeds(courses[i].scheme).rows.find((r) => r.grade === gr.grade).impossible)?.grade,
        marksNeeded: p.row.impossible ? null : round(p.row.needed, 1),
        status: p.row.impossible ? 'impossible' : p.row.achieved ? 'already_achieved' : 'possible',
      })),
    };
  },
};
