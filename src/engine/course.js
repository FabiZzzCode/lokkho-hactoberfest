import { GRADES } from '../config/grading.config.js';

/**
 * components: [{name, max, obtained|null}]. Marks ranges are percentages of the total.
 * For each grade: marks still needed in the unfilled components.
 */
export function courseNeeds(components) {
  const total = components.reduce((s, c) => s + c.max, 0);
  const done = components.filter((c) => c.obtained != null && c.obtained !== '');
  const obtained = done.reduce((s, c) => s + Number(c.obtained), 0);
  const remainingMax = components.filter((c) => !done.includes(c)).reduce((s, c) => s + c.max, 0);
  const rows = GRADES.map(({ grade, min }) => {
    const threshold = (min / 100) * total;
    const needed = Math.max(threshold - obtained, 0);
    const impossible = needed > remainingMax;
    return {
      grade,
      needed,
      percent: remainingMax ? (needed / remainingMax) * 100 : 0,
      impossible,
      achieved: needed === 0,
    };
  });
  return { total, obtained, remainingMax, rows };
}

/** Marks needed to reach a given target grade (row from courseNeeds). */
export const needFor = (needs, grade) => needs.rows.find((r) => r.grade === grade);
