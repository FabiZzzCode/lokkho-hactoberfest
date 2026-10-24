import get_summary from './tools/get_summary.js';
import required_avg from './tools/required_avg.js';
import marks_needed from './tools/marks_needed.js';
import plan_courses from './tools/plan_courses.js';
import predict_result from './tools/predict_result.js';
import simulate_retake from './tools/simulate_retake.js';
import exam_alerts from './tools/exam_alerts.js';
import propose_target from './tools/propose_target.js';

// Config-driven registry: to add a tool, write one file and list it here.
export const TOOLS = [get_summary, required_avg, marks_needed, plan_courses, predict_result, simulate_retake, exam_alerts, propose_target];
const byName = new Map(TOOLS.map((t) => [t.name, t]));

export const toolNames = () => TOOLS.map((t) => t.name);
export const getTool = (name) => byName.get(name);
/** What the model is told about each tool (no code). */
export const toolCatalog = () => TOOLS.map(({ name, description, args }) => ({ name, description, args }));

/** Validates tool arguments against the tool's schema. Returns { ok, args } or { ok:false, error }. */
export function validateArgs(tool, args) {
  const input = args == null ? {} : args;
  if (typeof input !== 'object' || Array.isArray(input)) return { ok: false, error: 'args must be an object' };
  const clean = {};
  for (const key of Object.keys(input)) if (!(key in tool.args)) return { ok: false, error: `unknown argument "${key}"` };
  for (const [key, spec] of Object.entries(tool.args)) {
    const v = input[key];
    if (v == null) { if (spec.required) return { ok: false, error: `missing argument "${key}"` }; continue; }
    if (spec.type === 'number') {
      const n = typeof v === 'string' && v.trim() !== '' ? Number(v) : v;
      if (typeof n !== 'number' || !Number.isFinite(n) || n < (spec.min ?? -Infinity) || n > (spec.max ?? Infinity)) return { ok: false, error: `"${key}" must be a number between ${spec.min} and ${spec.max}` };
      clean[key] = n;
    } else {
      if (typeof v !== 'string' || !v.trim() || v.length > (spec.max ?? 100)) return { ok: false, error: `"${key}" must be a short text` };
      clean[key] = v.trim();
    }
  }
  return { ok: true, args: clean };
}

/** Runs a tool by name. Always returns a plain object; failures become { error }. */
export function runTool(name, rawArgs, ctx) {
  const tool = byName.get(name);
  if (!tool) return { error: `Unknown tool "${name}".` };
  const v = validateArgs(tool, rawArgs);
  if (!v.ok) return { error: v.error };
  try { return tool.run(v.args, ctx); } catch { return { error: 'The tool failed.' }; }
}
