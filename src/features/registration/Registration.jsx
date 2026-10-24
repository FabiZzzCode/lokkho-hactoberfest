import { useState } from 'react';
import { buildRows, rowsToCourses } from './registration.js';
import CourseListEditor from '../../components/CourseListEditor.jsx';
import { getProgram } from '../../data/curricula/index.js';
import { Card, Notice, Empty } from '../../components/ui.jsx';
import { useT } from '../../i18n/index.jsx';

export default function Registration({ profile, onSave, onImport }) {
  const { t } = useT();
  const [rows, setRows] = useState(() => buildRows(profile));
  const program = getProgram(profile.programId);
  const total = rows.filter((r) => r.checked).reduce((s, r) => s + r.credits, 0);

  const save = () => onSave({ ...profile, current: { ...profile.current, courses: rowsToCourses(rows, profile.current.courses) } });

  return (
    <Card title={t('reg.title', { n: profile.currentSemester })}>
      <p>{t('reg.intro')}</p>
      <Notice kind="warn">{program.note}</Notice>
      {rows.length === 0 && <Empty>{program.emptyMessage ?? t('reg.empty')}</Empty>}
      <CourseListEditor rows={rows} onChange={setRows} />
      <p><strong>{t('reg.total', { n: total })}</strong></p>
      <div className="actions">
        <button className="btn primary" onClick={save} disabled={!rows.some((r) => r.checked)}>{t('reg.save')}</button>
        <button className="btn" onClick={onImport}>{t('reg.useAi')}</button>
      </div>
    </Card>
  );
}
