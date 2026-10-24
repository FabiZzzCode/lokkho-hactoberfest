// ONE grading system shared by every program. All values are DEFAULTS, not any
// university's official rules. `verified:false` means "check with your department".
export const GRADES = [
  { grade: 'A+', points: 4.0, min: 80, max: 100, verified: true },
  { grade: 'A', points: 3.75, min: 75, max: 79, verified: true },
  { grade: 'A-', points: 3.5, min: 70, max: 74, verified: true },
  { grade: 'B+', points: 3.25, min: 65, max: 69, verified: true },
  { grade: 'B', points: 3.0, min: 60, max: 64, verified: true },
  { grade: 'B-', points: 2.75, min: 55, max: 59, verified: true },
  { grade: 'C+', points: 2.5, min: 50, max: 54, verified: true },
  { grade: 'C', points: 2.25, min: 45, max: 49, verified: false },
  { grade: 'D', points: 2.0, min: 40, max: 44, verified: false },
  { grade: 'F', points: 0.0, min: 0, max: 39, verified: false },
];

// Marks ranges per grade are unverified defaults (points for A+..C+ were seen on a real result page).
export const MARKS_RANGES_VERIFIED = false;

// W = withdrawn: no points, credits excluded from attempted credits and GPA.
export const WITHDRAW_GRADE = 'W';
export const MAX_GPA = 4.0;
export const GPA_DECIMALS = 3;

export const RETAKE_POLICY = {
  verified: false,
  // 'latest' = latest attempt replaces earlier ones; 'best' = keep the better grade
  mode: 'latest',
  maxGradeAfterRetake: null, // e.g. 'B+' caps a retake attempt; null = no cap
  eligibleGrades: ['F', 'D', 'C', 'C+', 'B-'],
};
export const IMPROVEMENT_POLICY = { keepBetter: true, verified: false };
// Earned credits exclude failed courses; attempted credits include them.
export const CREDIT_RULE = { verified: false, earnedExcludesFailed: true };

export const PROGRAM_TOTAL_CREDITS = { cse: 163, bba: 130, custom: 120 };

export const SCHEME_TEMPLATES = {
  theory: [
    { name: 'Attendance', max: 10 },
    { name: 'CT / Quiz', max: 10 },
    { name: 'Mid', max: 30 },
    { name: 'Final', max: 50 },
  ],
  lab: [
    { name: 'Attendance', max: 10 },
    { name: 'Lab work', max: 40 },
    { name: 'Lab final', max: 50 },
  ],
};

export const EXAM_ALERT_DAYS = 30;
export const EXAM_COMPONENTS = ['mid', 'final', 'labFinal'];
