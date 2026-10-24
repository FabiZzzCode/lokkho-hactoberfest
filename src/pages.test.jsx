// @vitest-environment jsdom
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import App from './App.jsx';

const TABS = ['Dashboard', 'Advisor', 'Registration', 'Past results', 'Courses', 'Retake & improve', 'AI import'];
beforeEach(() => { cleanup(); localStorage.clear(); globalThis.fetch = vi.fn(async () => ({ json: async () => ({ ok: false, error: { code: 'network', message: 'x' } }) })); });

describe('every page opens without crashing', () => {
  it('with the sample student', async () => {
    render(<App />);
    await userEvent.click(await screen.findByText(/Try a SAMPLE student/));
    for (const tab of TABS) {
      await userEvent.click(await screen.findByRole('button', { name: tab }));
      expect(screen.getByRole('main').textContent.length, tab).toBeGreaterThan(20);
      expect(screen.getByRole('button', { name: tab }).getAttribute('aria-current')).toBe('page');
    }
  });
  it('with a brand-new student (no data)', async () => {
    render(<App />);
    await screen.findByText('Set your goal');
    await userEvent.click(screen.getByText('Continue'));
    await screen.findByText(/Registered courses for semester 3/);
    for (const tab of TABS) {
      await userEvent.click(screen.getByRole('button', { name: tab }));
      expect(screen.getByRole('main').textContent.length, tab).toBeGreaterThan(20);
    }
  });
  it('past results and AI import pages have a text-file input', async () => {
    render(<App />);
    await userEvent.click(await screen.findByText(/Try a SAMPLE student/));
    await userEvent.click(await screen.findByRole('button', { name: 'Past results' }));
    expect(screen.getByLabelText(/load a text file/i)).toBeTruthy();
    await userEvent.click(screen.getByRole('button', { name: 'AI import' }));
    expect(screen.getByLabelText(/load a text file/i)).toBeTruthy();
  });
  it('mid/CT marks entered on Courses go to the advisor with the final-exam question', async () => {
    const replies = [{ type: 'tool', tool: 'plan_courses', args: {} }, { type: 'final', text: 'Plan ready.' }];
    globalThis.fetch = vi.fn(async () => ({ json: async () => ({ ok: true, data: replies.shift() }) }));
    render(<App />);
    await userEvent.click(await screen.findByText(/Try a SAMPLE student/));
    await userEvent.click(await screen.findByRole('button', { name: 'Courses' }));
    const ct = screen.getAllByRole('spinbutton')[2]; // row 2 = CT / Quiz, "obtained" box
    await userEvent.clear(ct); await userEvent.type(ct, '9');
    expect(JSON.parse(localStorage.getItem('lokkho.profile.v1')).current.courses[0].scheme[1].obtained).toBe(9);
    await userEvent.click(screen.getByRole('button', { name: 'Ask the AI advisor what I need' }));
    expect(await screen.findByText('Plan ready.')).toBeTruthy();
    expect(JSON.parse(globalThis.fetch.mock.calls[0][1].body).question).toMatch(/what marks do I need in the final/i);
    expect(screen.getByText(/Planned your courses/)).toBeTruthy();
  });
});
