import { useState } from 'react';
import { callAi } from '../../api.js';
import { runScenario } from '../../engine/whatif.js';
import { fmt } from '../../engine/grades.js';
import AiError from '../../components/AiError.jsx';
import { Card, Notice, Spinner } from '../../components/ui.jsx';
import { useT } from '../../i18n/index.jsx';

export default function WhatIf({ profile, derived }) {
  const { t } = useT();
  const [q, setQ] = useState('');
  const [state, setState] = useState({ busy: false, error: null, scenario: null });
  const ask = async () => {
    setState({ busy: true, error: null, scenario: null });
    const codes = derived.counted.map((c) => c.code);
    const r = await callAi('whatif', { text: q, codes });
    setState(r.ok ? { busy: false, error: null, scenario: r.data.scenario } : { busy: false, error: r.error, scenario: null });
  };
  const result = state.scenario && runScenario(state.scenario, profile, derived);
  return (
    <Card title={t('whatif.title')}>
      <p className="muted">{t('whatif.help')}</p>
      <textarea rows={2} aria-label={t('whatif.title')} placeholder={t('whatif.ph')} value={q} maxLength={300} onChange={(e) => setQ(e.target.value)} />
      <button className="btn" disabled={!q.trim() || state.busy || !derived.credits} onClick={ask}>{t('whatif.ask')}</button>
      {state.busy && <Spinner label={t('ai.working')} />}
      {state.error && <AiError error={state.error} onRetry={ask} />}
      {result && (
        <div className="two-col">
          <div><p className="badge">{t('ai.label')}</p><h3>{t('whatif.parsed')}</h3><pre>{JSON.stringify(state.scenario, null, 2)}</pre></div>
          <div><h3>{t('whatif.result')}</h3>
            {result.unknownCourse ? <p>{t('whatif.unknown', { code: result.unknownCourse })}</p> : (
              <>
                {result.cgpa != null && <p>{t('whatif.cgpa', { cgpa: fmt(result.cgpa) })}</p>}
                <p>{t(`dash.status.${result.goal.status}`, { gpa: fmt(result.goal.needed ?? 0), best: fmt(result.goal.best) })}</p>
              </>
            )}
          </div>
        </div>
      )}
    </Card>
  );
}
