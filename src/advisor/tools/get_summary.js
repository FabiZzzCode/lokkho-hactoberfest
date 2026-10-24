import { derived, round } from './helpers.js';

export default {
  name: 'get_summary',
  description: 'Current CGPA, credits completed, credits left, target CGPA and current semester.',
  args: {},
  run(_args, ctx) {
    const d = derived(ctx);
    return {
      currentCgpa: d.credits ? round(d.cgpa) : null,
      creditsDone: d.credits,
      creditsLeft: d.goal.remaining,
      targetCgpa: ctx.profile.goalCgpa,
      currentSemester: ctx.profile.currentSemester,
      registeredCourses: ctx.profile.current.courses.length,
    };
  },
};
