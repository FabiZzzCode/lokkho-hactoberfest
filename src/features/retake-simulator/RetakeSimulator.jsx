import { useState } from 'react';
import { derive } from '../../engine/profile.js';
import { rankRetakes } from '../../engine/planning.js';
import { fmt } from '../../engine/grades.js';
import { GRADES, RETAKE_POLICY } from '../../config/grading.config.js';
import { Card, Empty, Field, Notice } from '../../components/ui.jsx';
import { useT } from '../../i18n/index.jsx';

export default function RetakeSimulator({ profile }) {
  const { t } = useT();
  const [grade, setGrade] = useState('A');
  const d = derive(profile, RETAKE_POLICY);
  const ranked = rankRetakes(d.attempts, RETAKE_POLICY, grade);
  return (
    <Card title={t('retake.title')}>
      <p>{t('retake.intro')}</p>
      <Notice kind="warn">{t('retake.policy', { mode: t(`retake.mode.${RETAKE_POLICY.mode}`), grades: RETAKE_POLICY.eligibleGrades.join(', ') })} {t('rules.unverified')}</Notice>
      <Field label={t('retake.assume')}>
        <select value={grade} onChange={(e) => setGrade(e.target.value)}>
          {GRADES.filter((g) => g.points > 0).map((g) => <option key={g.grade}>{g.grade}</option>)}
        </select>
      </Field>
      <p>{t('retake.now', { cgpa: fmt(d.cgpa) })}</p>
      {ranked.length === 0 ? <Empty>{t('retake.none')}</Empty> : (
        <div className="table-wrap"><table>
          <thead><tr><th>#</th><th>{t('common.course')}</th><th>{t('retake.from')}</th><th>{t('retake.newCgpa')}</th><th>{t('retake.gain')}</th></tr></thead>
          <tbody>{ranked.map((r, i) => (
            <tr key={r.code}><td>{i + 1}</td><td>{r.name}</td><td>{r.from} → {r.to}</td><td>{fmt(r.newCgpa)}</td><td className="good">+{fmt(r.gain)}</td></tr>
          ))}</tbody>
        </table></div>
      )}
    </Card>
  );
}
