import { useState } from 'react';
import { PROGRAM_LIST, getProgram } from '../../data/curricula/index.js';
import { newProfile } from '../../engine/profile.js';
import { sampleStudent } from '../../data/sampleStudent.js';
import { Card, Field, Notice } from '../../components/ui.jsx';
import { useT } from '../../i18n/index.jsx';

export default function Onboarding({ onDone, lang }) {
  const { t } = useT();
  const [programId, setProgramId] = useState('cse');
  const [semester, setSemester] = useState(3);
  const [goal, setGoal] = useState('3.50');
  const program = getProgram(programId);
  const goalNum = Number(goal);
  const valid = goalNum > 0 && goalNum <= 4;

  const start = (e) => {
    e.preventDefault();
    if (!valid) return;
    const p = newProfile(programId, Number(semester), goalNum);
    p.totalCredits = program.totalCredits;
    onDone({ ...p, language: lang }, 'register');
  };

  return (
    <Card title={t('onb.title')}>
      <p>{t('onb.intro')}</p>
      <form onSubmit={start} className="stack">
        <Field label={t('onb.program')}>
          <select value={programId} onChange={(e) => setProgramId(e.target.value)}>
            {PROGRAM_LIST.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
        </Field>
        <Notice kind="warn">{program.note}</Notice>
        <Field label={t('onb.semester')}>
          <select value={semester} onChange={(e) => setSemester(e.target.value)}>
            {Array.from({ length: 8 }, (_, i) => i + 1).map((n) => <option key={n} value={n}>{n}</option>)}
          </select>
        </Field>
        <Field label={t('onb.goal')} hint={valid ? '' : t('onb.goalBad')}>
          <input type="number" step="0.01" min="0.01" max="4" value={goal} onChange={(e) => setGoal(e.target.value)} />
        </Field>
        <div className="actions">
          <button className="btn primary" type="submit" disabled={!valid}>{t('onb.start')}</button>
          <button className="btn" type="button" onClick={() => onDone({ ...sampleStudent(programId), language: lang }, 'dashboard')}>{t('onb.sample')}</button>
        </div>
      </form>
    </Card>
  );
}
