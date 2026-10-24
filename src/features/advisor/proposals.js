/** Applies one advisor proposal to a profile and returns the new profile. Called only after the student clicks Apply. */
export function applyProposal(profile, proposal) {
  if (proposal.type === 'setGoal') return { ...profile, goalCgpa: proposal.goalCgpa };
  if (proposal.type === 'setCourseTarget') {
    return { ...profile, current: { ...profile.current, courses: profile.current.courses.map((c) => (c.code === proposal.code ? { ...c, targetGrade: proposal.grade } : c)) } };
  }
  return profile;
}
