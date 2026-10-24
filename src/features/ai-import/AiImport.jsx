import { useState } from 'react';
import { IMAGE_IMPORT } from '../../config/features.js';
import AiError from '../../components/AiError.jsx';
import { callAi } from '../../api.js';
import CourseListEditor from '../../components/CourseListEditor.jsx';
import { rowsToCourses } from '../registration/registration.js';
import { Card, Notice, Spinner } from '../../components/ui.jsx';
import { useT } from '../../i18n/index.jsx';

const MAX_IMG = 2_000_000;
const readB64 = (file) => new Promise((resolve, reject) => {
  const fr = new FileReader();
  fr.onload = () => resolve(String(fr.result).split(',')[1]);
  fr.onerror = reject;
  fr.readAsDataURL(file);
});

export default function AiImport({ profile, onSave }) {
  const { t } = useT();
  const [text, setText] = useState('');
  const [image, setImage] = useState(null);
  const [target, setTarget] = useState('current');
  const [state, setState] = useState({ busy: false, error: null, rows: null });

  const pick = async (file) => {
    if (!file) return setImage(null);
    if (file.size > MAX_IMG) return setState({ busy: false, error: { code: 'invalid_input', message: t('ai.imageBig') }, rows: null });
    setImage({ mime: file.type, data: await readB64(file), name: file.name });
  };
  const run = async () => {
    setState({ busy: true, error: null, rows: null });
    const r = await callAi('importCourses', { text, image: image ? { mime: image.mime, data: image.data } : undefined });
    setState(r.ok ? { busy: false, error: null, rows: r.data.courses.map((c) => ({ ...c, checked: true })) } : { busy: false, error: r.error, rows: null });
  };
  const apply = () => {
    const picked = state.rows.filter((r) => r.checked);
    if (target === 'current') {
      const merged = [...profile.current.courses.map((c) => ({ ...c, checked: true })), ...picked];
      onSave({ ...profile, current: { courses: rowsToCourses(merged, profile.current.courses) } });
    } else {
      const sem = Number(target);
      const list = picked.map((r) => ({ code: r.code, name: r.name, credits: r.credits, grade: '' }));
      const rest = profile.pastSemesters.filter((s) => s.semester !== sem);
      const old = profile.pastSemesters.find((s) => s.semester === sem);
      onSave({ ...profile, pastSemesters: [...rest, { semester: sem, skipped: false, courses: [...(old?.courses ?? []), ...list] }] }, 'past');
    }
  };

  return (
    <Card title={t('ai.importTitle')}>
      <p>{t('ai.importHelp')}</p>
      <textarea rows={6} maxLength={8000} aria-label={t('ai.importTitle')} value={text} onChange={(e) => setText(e.target.value)} />
      <label className="field"><span>{t('ai.photo')}</span>
        <input type="file" accept="image/png,image/jpeg,image/webp" disabled={!IMAGE_IMPORT} onChange={(e) => pick(e.target.files[0])} />
        {!IMAGE_IMPORT && <small>{t('ai.photoOff')}</small>}
      </label>
      <button className="btn primary" disabled={(!text.trim() && !image) || state.busy} onClick={run}>{t('ai.run')}</button>
      {state.busy && <Spinner label={t('ai.working')} />}
      {state.error && <AiError error={state.error} onRetry={run} />}
      {state.rows && (
        <div className="stack">
          <p className="badge">{t('ai.label')}</p>
          <Notice kind="info">{t('ai.reviewFirst')}</Notice>
          <CourseListEditor rows={state.rows} onChange={(rows) => setState({ ...state, rows })} />
          <label className="field"><span>{t('ai.target')}</span>
            <select value={target} onChange={(e) => setTarget(e.target.value)}>
              <option value="current">{t('ai.targetCurrent', { n: profile.currentSemester })}</option>
              {Array.from({ length: profile.currentSemester - 1 }, (_, i) => <option key={i} value={i + 1}>{t('past.semester', { n: i + 1 })}</option>)}
            </select>
          </label>
          <button className="btn primary" onClick={apply}>{t('ai.apply')}</button>
        </div>
      )}
    </Card>
  );
}
