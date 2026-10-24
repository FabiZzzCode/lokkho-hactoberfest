import { MAX_TOOL_CALLS } from './config.js';
import { runTool } from './registry.js';
import { checkGrounding } from './grounding.js';

/**
 * The browser-side agent loop. The server only asks the model for the next step; the tools run here,
 * on the student's own data. `call(payload)` is injected (the real one posts to /api/agent) so tests can mock the model.
 * Resolves to { answer, grounded, ungrounded, steps, proposals } or { error }.
 */
export async function runAgent({ question, language, ctx, call, onStep = () => {} }) {
  const steps = [];
  const proposals = [];
  const results = () => steps.map((s) => s.result);

  while (true) {
    const r = await call({ question, language, steps, mustFinish: steps.length >= MAX_TOOL_CALLS });
    if (!r.ok) return { error: r.error, steps };
    if (r.data.type === 'tool') {
      const result = runTool(r.data.tool, r.data.args, ctx);
      const step = { tool: r.data.tool, args: r.data.args, result };
      steps.push(step);
      if (result.proposal) proposals.push(result.proposal);
      onStep(step);
      continue;
    }

    let answer = r.data.text;
    let check = checkGrounding(answer, results(), question);
    if (!check.ok) {
      // Ask the model to fix its draft once; if it still invents numbers, show a warning instead.
      const fixed = await call({ question, language, steps, mustFinish: true, fix: { draft: answer, numbers: check.ungrounded } });
      if (fixed.ok && fixed.data.type === 'final') {
        answer = fixed.data.text;
        check = checkGrounding(answer, results(), question);
      }
    }
    return { answer, grounded: check.ok, ungrounded: check.ungrounded, steps, proposals };
  }
}
