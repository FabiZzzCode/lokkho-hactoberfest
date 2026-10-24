import { newProfile, makeCourse } from '../engine/profile.js';
import { defaultCourses } from './curricula/index.js';

// SAMPLE student with invented grades, for demos and screenshots only.
const GRADES_S1 = ['A', 'A+', 'B+', 'A', 'B+', 'A-', 'A', 'A+'];
const GRADES_S2 = ['A-', 'A', 'B+', 'A+', 'B', 'B+', 'B', 'B+', 'A-', 'A'];
const iso = (offsetDays) => {
  const d = new Date(); d.setDate(d.getDate() + offsetDays);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

export function sampleStudent(programId = 'cse') {
  const p = newProfile(programId, 3, 3.6);
  const withGrades = (sem, grades) => ({
    semester: sem, term: 'SAMPLE',
    courses: defaultCourses(programId, sem).map((c, i) => ({ code: c.code, name: c.name, credits: c.credits, grade: grades[i % grades.length] })),
  });
  p.pastSemesters = [withGrades(1, GRADES_S1), withGrades(2, GRADES_S2)];
  p.current.courses = defaultCourses(programId, 3).map((c, i) => {
    const m = makeCourse(c);
    if (i < 3) { // a few components already marked
      m.scheme[0].obtained = 9; m.scheme[1].obtained = 8; if (m.scheme[2]?.name === 'mid') m.scheme[2].obtained = 22 + i;
    }
    m.examDates = i === 0 ? { mid: iso(9), final: iso(55) } : i === 1 ? { mid: iso(14) } : {};
    return m;
  });
  return p;
}
