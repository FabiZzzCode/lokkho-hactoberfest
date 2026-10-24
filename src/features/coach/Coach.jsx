import { useState } from 'react';
import { callAi } from '../../api.js';
import { Card, Notice, Spinner } from '../../components/ui.jsx';
import { useT } from '../../i18n/index.jsx';

const r2 = (n) => Math.round(n * 100) / 100;

// The model only gets numbers computed by the engine, rounded so it can copy them exactly.
export function buildFacts(profile, derived, plan) {
  const g = derived.goal;
  return {
    language: profile.language,
    currentCgpa: r2(derived.cgpa),
    goalCgpa: r2(profile.goalCgpa),
    goalStatus: g.status,
    averageGpaNeeded: g.needed == null ? null : r2(g.needed),
    bestPossibleCgpa: r2(g.best),
    creditsDone: derived.credits,
    creditsRemaining: g.remaining,
    courses: plan.map((p) => ({ name: p.name, targetGrade: p.targetGrade, marksStillAvailable: p.remainingMax })),
  };
}

export default function Coach({ profile, derived, plan }) {
  const { t } = useT();
  const [state, setState] = useState({ busy: false, error: null, tips: null, rejected: 0 });
  const run = async () => {
    setState({ busy: true, error: null, tips: null, rejected: 0 });
    const r = await callAi('coach', { facts: buildFacts(profile, derived, plan) });
    setState(r.ok ? { busy: false, error: null, tips: r.data.tips, rejected: r.data.rejected } : { busy: false, error: r.error.message, tips: null, rejected: 0 });
  };
  return (
    <Card title={t('coach.title')}>
      <p className="muted">{t('coach.help')}</p>
      <button className="btn" onClick={run} disabled={state.busy || !derived.credits}>{t('coach.run')}</button>
      {state.busy && <Spinner label={t('ai.working')} />}
      {state.error && <Notice kind="error">{state.error} {t('ai.manual')}</Notice>}
      {state.tips && (
        <>
          <p className="badge">{t('ai.label')}</p>
          <ul>{state.tips.map((tip, i) => <li key={i}>{tip}</li>)}</ul>
          {state.rejected > 0 && <p className="muted">{t('coach.rejected', { n: state.rejected })}</p>}
        </>
      )}
    </Card>
  );
}
