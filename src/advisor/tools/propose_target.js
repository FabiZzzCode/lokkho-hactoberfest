// Write actions never change data. They return a proposal the student must Apply or Dismiss.
export default {
  name: 'propose_target',
  description: 'PROPOSE a new goal CGPA or a target grade for one course. Nothing changes until the student clicks Apply.',
  args: {
    goalCgpa: { type: 'number', min: 0.01, max: 4, required: false },
    course: { type: 'string', required: false, max: 80 },
    grade: { type: 'string', required: false, max: 3 },
  },
  run({ goalCgpa, course, grade }, ctx) {
    if (goalCgpa != null) return { proposal: { type: 'setGoal', goalCgpa } };
    if (course && grade) {
      const q = course.toLowerCase();
      const c = ctx.profile.current.courses.find((x) => x.code.toLowerCase() === q) ?? ctx.profile.current.courses.find((x) => x.name.toLowerCase().includes(q));
      if (!c) return { error: `No current course matches "${course}".` };
      return { proposal: { type: 'setCourseTarget', code: c.code, name: c.name, grade } };
    }
    return { error: 'Give goalCgpa, or both course and grade.' };
  },
};
