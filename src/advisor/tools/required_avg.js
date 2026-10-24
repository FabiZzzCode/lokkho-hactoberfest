import { derived, round } from './helpers.js';

export default {
  name: 'required_avg',
  description: 'Average GPA needed on all remaining credits to reach the target CGPA (optionally for a different target). Says when the target is impossible.',
  args: { target: { type: 'number', min: 0.01, max: 4, required: false } },
  run({ target }, ctx) {
    const d = derived(ctx);
    const goalCgpa = target ?? ctx.profile.goalCgpa;
    const g = target == null ? d.goal : derived({ profile: { ...ctx.profile, goalCgpa } }).goal;
    return {
      targetCgpa: goalCgpa,
      status: g.status, // on_track | needs | not_reachable
      requiredAverageGpa: g.needed == null ? null : round(g.needed),
      bestPossibleCgpa: round(g.best),
      creditsLeft: g.remaining,
      impossible: g.status === 'not_reachable',
    };
  },
};
