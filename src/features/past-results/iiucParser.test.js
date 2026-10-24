import { describe, it, expect } from 'vitest';
import { parseIiucResult, verifyParsed } from './iiucParser.js';

// Synthetic page: invented name and fake IDs.
const PAGE = `Name: Test Student One   Matric No: 000000   Registration No: FAKE-1
Semester: Spring-2024 Semester Enrolled: First Semester
SL\tISCED\tCourse Code\tCourse Name\tCredit Hours\tGrade\tPoint\tGrade Point\tComments
1\t0611\tCSE-1121\tComputer Programming 1\t3.00\tA+\t4.00\t12.00\t
2\t0611\tCSE-1122\tComputer Programming 1 Lab\t1.50\tB\t3.00\t4.50\t
3\t0531\tPHY-1101\tPhysics I (Mechanics, Waves)\t3.00\tW\t0.00\t0.00\t
Total Credit Hours: 4.50 GPA: 3.667
Semester: Fall-2024 Semester Enrolled: Second Semester
1 0611 CSE-1221 Computer Programming II 3.00 A 3.75 11.25
2 0611 CSE-1230 Competitive Programming 1 1.00 C+ 2.50 2.50
Total Credit Hours: 4.00 GPA: 3.438
CGPA: 3.559`;

describe('IIUC parser', () => {
  const parsed = parseIiucResult(PAGE);
  it('maps blocks to semester numbers and keeps term labels', () => {
    expect(parsed.semesters.map((s) => [s.semester, s.term, s.courses.length])).toEqual([[1, 'Spring-2024', 3], [2, 'Fall-2024', 2]]);
  });
  it('parses rows incl. half credits, W grade, and drops identity', () => {
    const c = parsed.semesters[0].courses;
    expect(c[1]).toEqual({ code: 'CSE-1122', name: 'Computer Programming 1 Lab', credits: 1.5, grade: 'B' });
    expect(c[2].grade).toBe('W');
    expect(JSON.stringify(parsed)).not.toMatch(/Test Student|FAKE|000000/);
  });
  it('totals match: sem1 (12+4.5)/4.5=3.667, sem2 (11.25+2.5)/4=3.4375', () => {
    expect(verifyParsed(parsed)).toEqual([]);
  });
  it('warns on mismatch', () => {
    const w = verifyParsed(parseIiucResult(PAGE.replace('GPA: 3.667', 'GPA: 3.900')));
    expect(w[0]).toMatchObject({ key: 'gpa', semester: 1 });
  });
});
