// @vitest-environment jsdom
import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import App from './App.jsx';

beforeEach(() => { cleanup(); localStorage.clear(); });

describe('app smoke', () => {
  it('sample student shows dashboard with CGPA and goal', async () => {
    render(<App />);
    await userEvent.click(await screen.findByText(/Try a SAMPLE student/));
    expect(await screen.findByText('Current CGPA')).toBeTruthy();
    expect(screen.getByText(/Goal CGPA 3.60/)).toBeTruthy();
    expect(screen.getByText(/Exams coming up/)).toBeTruthy();
  });
  it('CSE and BBA registration lists load from the catalog', async () => {
    render(<App />);
    await screen.findByText('Set your goal');
    await userEvent.click(screen.getByText('Continue'));
    expect(await screen.findByText(/Registered courses for semester 3/)).toBeTruthy();
    expect(screen.getByLabelText('Include Data Structures')).toBeTruthy();
    cleanup(); localStorage.clear();
    render(<App />);
    await screen.findByText('Set your goal');
    await userEvent.selectOptions(screen.getAllByRole('combobox')[1], 'bba');
    await userEvent.click(screen.getByText('Continue'));
    expect(await screen.findByLabelText('Include Sample BBA Course 3.1')).toBeTruthy();
  });
  it('switches to Bangla', async () => {
    render(<App />);
    await screen.findByText('Set your goal');
    await userEvent.selectOptions(screen.getByLabelText('Language'), 'bn');
    expect(await screen.findByText('আপনার লক্ষ্য ঠিক করুন')).toBeTruthy();
  });
  it('a new student with no past results sees a friendly card, not a 3.800 target', async () => {
    render(<App />);
    await screen.findByText('Set your goal');
    await userEvent.click(screen.getByText('Continue'));
    await screen.findByText(/Registered courses for semester 3/);
    await userEvent.click(screen.getByRole('button', { name: 'Dashboard' }));
    expect(await screen.findByText('Add your past results to start')).toBeTruthy();
    expect(screen.queryByText(/You need an average GPA/)).toBeNull();
  });
  it('reset data clears the profile after confirming', async () => {
    window.confirm = () => true;
    render(<App />);
    await userEvent.click(await screen.findByText(/Try a SAMPLE student/));
    await screen.findByText('Current CGPA');
    await userEvent.click(screen.getByText('Reset data'));
    expect(await screen.findByText('Set your goal')).toBeTruthy();
    expect(localStorage.getItem('lokkho.profile.v1')).toBeNull();
  });
});
