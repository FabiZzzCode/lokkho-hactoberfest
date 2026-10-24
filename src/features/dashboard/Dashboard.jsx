import { derive } from '../../engine/profile.js';
import { planSemester } from '../../engine/planning.js';
import { fmt } from '../../engine/grades.js';
import { RETAKE_POLICY } from '../../config/grading.config.js';
import ExamBanner from '../exam-alerts/ExamBanner.jsx';
import Coach from '../coach/Coach.jsx';
import WhatIf from '../ai-import/WhatIf.jsx';
import { Card, Empty, UnverifiedNote } from '../../components/ui.jsx';
import { useT } from '../../i18n/index.jsx';

export default function Dashboard({ profile, go }) {
  const { t } = useT();
  const d = derive(profile, RETAKE_POLICY);
  const { goal } = d;
  const courses = profile.current.courses;
  const plan = goal.status === 'needs' && courses.length ? planSemester(goal.needed, courses) : [];
  const statusKey = goal.status;

  return (
    <div className="stack">
      <ExamBanner courses={courses} />
      <Card className={`goal goal-${statusKey}`}>
        <p className="eyebrow">{t('dash.goalLabel', { goal: fmt(profile.goalCgpa, 2) })}</p>
        <h2 className="big">{t(`dash.status.${statusKey}`, { gpa: fmt(goal.needed ?? 0), best: fmt(goal.best) })}</h2>
        {statusKey === 'not_reachable' && <p>{t('dash.best', { best: fmt(goal.best) })}</p>}
        {statusKey === 'needs' && <p>{t('dash.needsHelp', { credits: goal.remaining })}</p>}
      </Card>

      <div className="stats">
        <Card><p className="eyebrow">{t('dash.cgpa')}</p><p className="big">{d.credits ? fmt(d.cgpa) : '–'}</p></Card>
        <Card><p className="eyebrow">{t('dash.creditsDone')}</p><p className="big">{d.credits}</p></Card>
        <Card><p className="eyebrow">{t('dash.creditsLeft')}</p><p className="big">{goal.remaining}</p></Card>
      </div>
      {!d.credits && <Empty>{t('dash.noPast')} <button className="link" onClick={() => go('past')}>{t('nav.past')}</button></Empty>}

      <Card title={t('dash.plan')}>
        {courses.length === 0 ? (
          <Empty>{t('dash.noCourses')} <button className="link" onClick={() => go('register')}>{t('nav.register')}</button></Empty>
        ) : goal.status !== 'needs' ? (
          <p className="muted">{t('dash.planNA')}</p>
        ) : (
          <div className="table-wrap">
            <table>
              <thead><tr><th>{t('common.course')}</th><th>{t('dash.target')}</th><th>{t('dash.marksNeeded')}</th></tr></thead>
              <tbody>
                {plan.map((p) => (
                  <tr key={p.code + p.name}>
                    <td>{p.name}</td><td><strong>{p.targetGrade}</strong></td>
                    <td>{p.row?.impossible ? t('course.impossible') : p.row?.achieved ? t('course.achieved') : `${fmt(p.row.needed, 1)} / ${p.remainingMax}`}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <UnverifiedNote />
      </Card>

      <Coach profile={profile} derived={d} plan={plan} />
      <WhatIf profile={profile} derived={d} />
    </div>
  );
}
