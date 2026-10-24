import { useState } from 'react';
import { courseNeeds } from '../../engine/course.js';
import { fmt } from '../../engine/grades.js';
import AiError from '../../components/AiError.jsx';
import { callAi } from '../../api.js';
import { Card, Empty, Notice, Spinner, UnverifiedNote } from '../../components/ui.jsx';
import { useT } from '../../i18n/index.jsx';

export default function CourseTracker({ profile, onSave, go, onAsk }) {
  const { t } = useT();
  const courses = profile.current.courses;
  const [idx, setIdx] = useState(0);
  const [ai, setAi] = useState({ text: '', busy: false, error: null, review: null });
  if (!courses.length) return <Card title={t('course.title')}><Empty>{t('dash.noCourses')} <button className="link" onClick={() => go('register')}>{t('nav.register')}</button></Empty></Card>;
  const course = courses[Math.min(idx, courses.length - 1)];
  const needs = courseNeeds(course.scheme);

  const update = (patch) => onSave({ ...profile, current: { courses: courses.map((c) => (c === course ? { ...c, ...patch } : c)) } });
  const setComp = (i, p) => update({ scheme: course.scheme.map((c, j) => (j === i ? { ...c, ...p } : c)) });
  const setObtained = (i, v) => {
    const max = course.scheme[i].max;
    setComp(i, { obtained: v === '' ? null : Math.min(Math.max(Number(v), 0), max) }); // clamp to 0..max
  };

  const runScheme = async () => {
    setAi({ ...ai, busy: true, error: null, review: null });
    const r = await callAi('importScheme', { text: ai.text });
    setAi((a) => ({ ...a, busy: false, error: r.ok ? null : r.error, review: r.ok ? r.data.components : null }));
  };
  const applyScheme = () => { update({ scheme: ai.review.map((c) => ({ ...c, obtained: null })) }); setAi({ text: '', busy: false, error: null, review: null }); };

  return (
    <div className="stack">
      <Card title={t('course.title')}>
        <label className="field"><span>{t('common.course')}</span>
          <select value={idx} onChange={(e) => setIdx(Number(e.target.value))}>
            {courses.map((c, i) => <option key={i} value={i}>{c.code} {c.name}</option>)}
          </select>
        </label>
        {course.targetGrade && <p className="badge">{t('course.target', { grade: course.targetGrade })}</p>}
        <h3>{t('course.marks')}</h3>
        <ul className="rows">
          {course.scheme.map((c, i) => (
            <li key={i} className="row">
              <input className="grow" aria-label={t('course.compName')} value={c.name} onChange={(e) => setComp(i, { name: e.target.value })} />
              <input className="narrow" type="number" min="0" max={c.max} step="0.5" aria-label={t('course.obtained', { name: c.name })} placeholder="–" value={c.obtained ?? ''} onChange={(e) => setObtained(i, e.target.value)} />
              <span>/</span>
              <input className="narrow" type="number" min="1" aria-label={t('course.max', { name: c.name })} value={c.max} onChange={(e) => setComp(i, { max: Math.max(Number(e.target.value), 1) })} />
            </li>
          ))}
        </ul>
        <h3>{t('course.dates')}</h3>
        <div className="row">
          {['mid', 'final'].map((k) => (
            <label key={k} className="field grow"><span>{t(`comp.${k}`)}</span>
              <input type="date" value={course.examDates?.[k] ?? ''} onChange={(e) => update({ examDates: { ...course.examDates, [k]: e.target.value } })} />
            </label>
          ))}
        </div>
      </Card>

      <Card title={t('course.need')}>
        <button className="btn primary" onClick={() => onAsk(t('course.askQ', { course: `${course.code} ${course.name}` }))}>{t('course.ask')}</button>
        <p>{t('course.sofar', { got: needs.obtained, left: needs.remainingMax, total: needs.total })}</p>
        <div className="table-wrap">
          <table>
            <thead><tr><th>{t('common.grade')}</th><th>{t('course.needed')}</th><th>%</th></tr></thead>
            <tbody>
              {needs.rows.map((r) => (
                <tr key={r.grade} className={r.impossible ? 'dim' : r.achieved ? 'good' : ''}>
                  <td><strong>{r.grade}</strong></td>
                  <td>{r.impossible ? t('course.impossible') : r.achieved ? t('course.achieved') : `${fmt(r.needed, 1)} / ${needs.remainingMax}`}</td>
                  <td>{r.impossible || r.achieved ? '' : `${fmt(r.percent, 0)}%`}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <UnverifiedNote />
      </Card>

      <Card title={t('course.importScheme')}>
        <textarea rows={3} aria-label={t('course.importScheme')} placeholder={t('course.schemePh')} value={ai.text} onChange={(e) => setAi({ ...ai, text: e.target.value })} />
        <button className="btn" disabled={!ai.text.trim() || ai.busy} onClick={runScheme}>{t('ai.run')}</button>
        {ai.busy && <Spinner label={t('ai.working')} />}
        {ai.error && <AiError error={ai.error} onRetry={runScheme} />}
        {ai.review && (
          <div className="stack">
            <Notice kind="info">{t('ai.reviewFirst')}</Notice>
            <ul className="rows">
              {ai.review.map((c, i) => (
                <li key={i} className="row">
                  <input className="grow" aria-label={t('course.compName')} value={c.name} onChange={(e) => setAi({ ...ai, review: ai.review.map((x, j) => (j === i ? { ...x, name: e.target.value } : x)) })} />
                  <input className="narrow" type="number" min="1" aria-label={t('course.max', { name: c.name })} value={c.max} onChange={(e) => setAi({ ...ai, review: ai.review.map((x, j) => (j === i ? { ...x, max: Number(e.target.value) } : x)) })} />
                </li>
              ))}
            </ul>
            <button className="btn primary" onClick={applyScheme}>{t('ai.apply')}</button>
          </div>
        )}
      </Card>
    </div>
  );
}
