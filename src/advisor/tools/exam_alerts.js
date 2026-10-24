import { examAlerts } from '../../engine/planning.js';

export default {
  name: 'exam_alerts',
  description: 'Mid and final exams in the next 30 days.',
  args: {},
  run(_args, ctx) {
    const alerts = examAlerts(ctx.profile.current.courses, ctx.today ?? new Date());
    return { count: alerts.length, exams: alerts.map((a) => ({ course: a.code, name: a.name, exam: a.component, date: a.date, daysLeft: a.daysLeft })) };
  },
};
