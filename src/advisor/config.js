// Advisor settings in one place. Prediction ratios are simple assumptions, shown to the student.
export const MAX_TOOL_CALLS = 6;
export const STEP_TIMEOUT_MS = 25_000;
export const MAX_QUESTION_CHARS = 500;
export const PREDICTION = {
  fallbackRatio: 0.7, // used when no component of a course has been marked yet
  worstRatio: 0.4, // worst case: only 40% of the remaining marks (the lowest passing share)
  bestRatio: 1, // best case: full marks on everything left
};
