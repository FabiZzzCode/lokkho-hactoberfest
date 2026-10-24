import { WITHDRAW_GRADE } from '../../config/grading.config.js';
import { semesterGpa, summarize } from '../../engine/grades.js';

// Deterministic parser for a copied IIUC "Result View" page. Runs in the browser.
// Identity lines (name, matric, registration) are never read or stored.
const ORDINALS = { first: 1, second: 2, third: 3, fourth: 4, fifth: 5, sixth: 6, seventh: 7, eighth: 8, ninth: 9, tenth: 10 };
const HEADER = /Semester:\s*(\S+).*?Semester Enrolled:\s*(\w+)/i;
const ROW = /([A-Z]{2,5}-\d{4})\s+(.+?)\s+(\d+(?:\.\d+)?)\s+(A\+|A-|A|B\+|B-|B|C\+|C|D|F|W)(?=\s|$)/;
const TOTAL_CREDITS = /Total Credit Hours\D*?(\d+(?:\.\d+)?)/i;
const GPA_LINE = /(?<![A-Za-z])GPA\D*?(\d\.\d+)/i;
const CGPA_LINE = /CGPA\D*?(\d\.\d+)/i;

export function parseIiucResult(text) {
  const semesters = [];
  let cur = null;
  let pageCgpa = null;
  for (const line of String(text).split(/\r?\n/)) {
    const h = line.match(HEADER);
    if (h) {
      cur = { semester: ORDINALS[h[2].toLowerCase()] ?? null, term: h[1], courses: [], pageCredits: null, pageGpa: null };
      semesters.push(cur);
      continue;
    }
    if (!cur) continue;
    const r = line.match(ROW);
    if (r) {
      cur.courses.push({ code: r[1], name: r[2].trim(), credits: Number(r[3]), grade: r[4] });
      continue;
    }
    const cg = line.match(CGPA_LINE);
    if (cg) { pageCgpa = Number(cg[1]); continue; }
    const tc = line.match(TOTAL_CREDITS);
    if (tc) cur.pageCredits = Number(tc[1]);
    const g = line.match(GPA_LINE);
    if (g) cur.pageGpa = Number(g[1]);
  }
  return { semesters: semesters.filter((s) => s.semester && s.courses.length), pageCgpa };
}

/** Compare computed numbers with the page's own totals; returns human-checkable warnings. */
export function verifyParsed({ semesters, pageCgpa }) {
  const warnings = [];
  const tol = 0.0015; // page shows 3 decimals
  for (const s of semesters) {
    const { credits, gpa } = semesterGpa(s.courses);
    if (s.pageCredits != null && Math.abs(credits - s.pageCredits) > 0.001)
      warnings.push({ key: 'credits', semester: s.semester, computed: credits, page: s.pageCredits });
    if (s.pageGpa != null && Math.abs(gpa - s.pageGpa) > tol)
      warnings.push({ key: 'gpa', semester: s.semester, computed: gpa, page: s.pageGpa });
  }
  if (pageCgpa != null) {
    const all = semesters.flatMap((s) => s.courses);
    const cgpa = summarize(all).cgpa;
    if (Math.abs(cgpa - pageCgpa) > tol) warnings.push({ key: 'cgpa', computed: cgpa, page: pageCgpa });
  }
  return warnings;
}

export const isWithdrawnGrade = (g) => g === WITHDRAW_GRADE;
