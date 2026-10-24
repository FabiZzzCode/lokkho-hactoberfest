import { describe, it, expect, vi } from 'vitest';
import { runAgent } from './runAgent.js';
import { newProfile, makeCourse } from '../engine/profile.js';

const profile = () => {
  const p = newProfile('cse', 2, 3.6);
  p.totalCredits = 30;
  p.pastSemesters = [{ semester: 1, courses: [{ code: 'X-1', name: 'Ex', credits: 3, grade: 'A+' }, { code: 'Y-1', name: 'Why', credits: 3, grade: 'B' }] }];
  p.current.courses = [makeCourse({ code: 'Z-2', name: 'Zed', credits: 3 })];
  return p;
};
// A scripted fake model: each call returns the next scripted reply.
const script = (replies) => { const q = [...replies]; return vi.fn(async () => ({ ok: true, data: q.shift() })); };
const base = { question: 'Can I reach my target?', language: 'en', ctx: { profile: profile() } };

describe('agent loop (mock model)', () => {
  it('calls a tool, runs it locally, and returns a grounded answer', async () => {
    const call = script([{ type: 'tool', tool: 'required_avg', args: {} }, { type: 'final', text: 'You need an average GPA of 3.625 on the 24 credits left.' }]);
    const seen = [];
    const r = await runAgent({ ...base, call, onStep: (s) => seen.push(s.tool) });
    expect(r.grounded).toBe(true);
    expect(seen).toEqual(['required_avg']);
    expect(call.mock.calls[1][0].steps[0].result.requiredAverageGpa).toBe(3.625); // result is sent back to the model
  });
  it('asks the model to fix an ungrounded draft once, then accepts a grounded one', async () => {
    const call = script([
      { type: 'tool', tool: 'required_avg', args: {} },
      { type: 'final', text: 'You need 3.77.' },
      { type: 'final', text: 'You need 3.625.' },
    ]);
    const r = await runAgent({ ...base, call });
    expect(r).toMatchObject({ answer: 'You need 3.625.', grounded: true });
    expect(call.mock.calls[2][0].fix).toEqual({ draft: 'You need 3.77.', numbers: ['3.77'] });
  });
  it('shows a warning (grounded:false) if the fix is still wrong', async () => {
    const call = script([{ type: 'tool', tool: 'get_summary', args: {} }, { type: 'final', text: 'CGPA is 3.77.' }, { type: 'final', text: 'CGPA is 3.78.' }]);
    const r = await runAgent({ ...base, call });
    expect(r).toMatchObject({ grounded: false, ungrounded: ['3.78'] });
  });
  it('collects proposals but does not change the profile', async () => {
    const ctx = { profile: profile() }; const before = JSON.stringify(ctx.profile);
    const call = script([{ type: 'tool', tool: 'propose_target', args: { goalCgpa: 3.5 } }, { type: 'final', text: 'I suggest a goal of 3.5. Apply it if you agree.' }]);
    const r = await runAgent({ ...base, ctx, call });
    expect(r.proposals).toEqual([{ type: 'setGoal', goalCgpa: 3.5 }]);
    expect(JSON.stringify(ctx.profile)).toBe(before);
  });
  it('forces a final answer after 6 tool calls', async () => {
    const calls = Array.from({ length: 6 }, () => ({ type: 'tool', tool: 'get_summary', args: {} }));
    const call = script([...calls, { type: 'final', text: 'Done.' }]);
    const r = await runAgent({ ...base, call });
    expect(r.steps).toHaveLength(6);
    expect(call.mock.calls.at(-1)[0].mustFinish).toBe(true);
  });
  it('turns bad tool args into an error result the model can read', async () => {
    const call = script([{ type: 'tool', tool: 'marks_needed', args: {} }, { type: 'final', text: 'Which course?' }]);
    const r = await runAgent({ ...base, call });
    expect(r.steps[0].result.error).toMatch(/missing/);
  });
  it('returns the server error when the model call fails', async () => {
    const call = vi.fn(async () => ({ ok: false, error: { code: 'quota', message: 'busy' } }));
    expect(await runAgent({ ...base, call })).toEqual({ error: { code: 'quota', message: 'busy' } });
  });
});
