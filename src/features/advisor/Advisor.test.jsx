// @vitest-environment jsdom
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import App from '../../App.jsx';

// Scripted model: replies to /api/agent in order. No real AI is used in tests.
const mockModel = (replies) => {
  const q = [...replies];
  globalThis.fetch = vi.fn(async () => ({ json: async () => ({ ok: true, data: q.shift() }) }));
};
const openAdvisor = async () => {
  render(<App />);
  await userEvent.click(await screen.findByText(/Try a SAMPLE student/));
  await userEvent.click(await screen.findByRole('button', { name: 'Advisor' }));
};
beforeEach(() => { cleanup(); localStorage.clear(); });

describe('Advisor UI', () => {
  it('quick button runs tools on the sample student and shows steps and a grounded answer', async () => {
    mockModel([{ type: 'tool', tool: 'required_avg', args: {} }, { type: 'final', text: 'You need an average GPA of 3.675 on 122.5 credits.' }]);
    await openAdvisor();
    expect(screen.getByText(/Pick a quick question/)).toBeTruthy();
    await userEvent.click(screen.getByRole('button', { name: 'Can I reach my target?' }));
    expect(await screen.findByText(/average GPA of 3.675/)).toBeTruthy();
    expect(screen.getByText(/Checked required average/)).toBeTruthy();
    expect(screen.getByText('AI suggestion')).toBeTruthy();
    expect(screen.queryByText(/Could not verify/)).toBeNull();
  });
  it('warns about numbers the tools did not produce', async () => {
    mockModel([{ type: 'tool', tool: 'get_summary', args: {} }, { type: 'final', text: 'Your CGPA is 3.99.' }, { type: 'final', text: 'Your CGPA is 3.98.' }]);
    await openAdvisor();
    await userEvent.click(screen.getByRole('button', { name: 'Predict my result' }));
    expect(await screen.findByText(/Could not verify these numbers from the tools: 3.98/)).toBeTruthy();
  });
  it('a proposal changes nothing until Apply is clicked; Dismiss keeps the goal', async () => {
    mockModel([{ type: 'tool', tool: 'propose_target', args: { goalCgpa: 3.7 } }, { type: 'final', text: 'I suggest a goal of 3.7.' }]);
    await openAdvisor();
    await userEvent.type(screen.getByLabelText('Your question'), 'Set my goal to 3.7');
    await userEvent.click(screen.getByRole('button', { name: 'Ask' }));
    expect(await screen.findByText(/Set your goal CGPA to 3.7/)).toBeTruthy();
    expect(JSON.parse(localStorage.getItem('lokkho.profile.v1')).goalCgpa).toBe(3.6);
    await userEvent.click(screen.getByRole('button', { name: 'Apply' }));
    expect(JSON.parse(localStorage.getItem('lokkho.profile.v1')).goalCgpa).toBe(3.7);
    expect(await screen.findByText('Applied.')).toBeTruthy();
  });
  it('shows a clear error and keeps manual use possible when the AI fails', async () => {
    globalThis.fetch = vi.fn(async () => ({ json: async () => ({ ok: false, error: { code: 'quota', message: 'The AI service is busy.' } }) }));
    await openAdvisor();
    await userEvent.click(screen.getByRole('button', { name: 'Should I retake something?' }));
    expect(await screen.findByText(/The AI service is busy/)).toBeTruthy();
    expect(screen.getByText(/enter everything by hand/)).toBeTruthy();
  });
});
