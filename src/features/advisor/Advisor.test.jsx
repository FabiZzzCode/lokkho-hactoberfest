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
    expect(screen.getByText(/not guarantees/)).toBeTruthy(); // visible disclaimer
    await userEvent.click(screen.getByRole('button', { name: 'Can I reach my target?' }));
    expect(await screen.findByText(/average GPA of 3.675/)).toBeTruthy();
    expect(screen.getByText(/Checked required average/)).toBeTruthy();
    expect(screen.getByText('AI suggestion')).toBeTruthy();
    expect(screen.queryByText(/Could not verify/)).toBeNull();
    // keyboard use: focus returns to the question box after an answer
    expect(document.activeElement).toBe(screen.getByLabelText('Your question'));
  });
  it('every control on the page has an accessible name', async () => {
    mockModel([]);
    await openAdvisor();
    for (const el of [...screen.getAllByRole('button'), ...screen.getAllByRole('textbox'), ...screen.getAllByRole('combobox')]) {
      expect((el.getAttribute('aria-label') || el.textContent || '').trim() || el.labels?.length, el.outerHTML).toBeTruthy();
    }
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
  it('on a model failure it still shows the tool results and a Retry button', async () => {
    const replies = [{ ok: true, data: { type: 'tool', tool: 'required_avg', args: {} } }, { ok: false, error: { code: 'timeout', message: 'x' } }];
    globalThis.fetch = vi.fn(async () => ({ json: async () => replies.shift() ?? { ok: false, error: { code: 'timeout', message: 'x' } } }));
    await openAdvisor();
    await userEvent.click(screen.getByRole('button', { name: 'Can I reach my target?' }));
    expect(await screen.findByText(/could not write an explanation/)).toBeTruthy();
    expect(screen.getByText(/requiredAverageGpa/)).toBeTruthy();
    expect(screen.getByText(/took too long/)).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Retry' })).toBeTruthy();
  });
  it('with no data the Advisor, Dashboard and Retake tabs offer the sample student, not zeros', async () => {
    render(<App />);
    await screen.findByText('Set your goal');
    await userEvent.click(screen.getByText('Continue'));
    await screen.findByText(/Registered courses for semester 3/);
    for (const tab of ['Dashboard', 'Advisor', 'Retake & improve']) {
      await userEvent.click(screen.getByRole('button', { name: tab }));
      expect(await screen.findByRole('button', { name: 'Load sample student' })).toBeTruthy();
      expect(screen.queryByText('0.000')).toBeNull();
    }
  });
});
