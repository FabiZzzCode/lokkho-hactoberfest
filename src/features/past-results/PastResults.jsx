import { useState } from 'react';
import { buildDraft, mergeParsed, draftToSaved } from './pastResults.js';
import { parseIiucResult, verifyParsed } from './iiucParser.js';
import { semesterGpa, fmt } from '../../engine/grades.js';
import GradeSelect from '../../components/GradeSelect.jsx';
import { Card, Notice } from '../../components/ui.jsx';
import { useT } from '../../i18n/index.jsx';

import TextFileInput from '../../components/TextFileInput.jsx';

export default function PastResults({ profile, onSave, onImport }) {
  const { t } = useT();
  const [draft, setDraft] = useState(() => buildDraft(profile));
  const [paste, setPaste] = useState('');
  const [warnings, setWarnings] = useState([]);
  const [parseMsg, setParseMsg] = useState(null);
  const [extra, setExtra] = useState({});

  const patchSem = (sem, fn) => setDraft(draft.map((s) => (s.semester === sem ? fn(s) : s)));
  const setGrade = (sem, i, grade) => patchSem(sem, (s) => ({ ...s, courses: s.courses.map((c, j) => (j === i ? { ...c, grade } : c)) }));

  const runParse = () => {
    const parsed = parseIiucResult(paste);
    if (!parsed.semesters.length) { setParseMsg('none'); return; }
    setDraft(mergeParsed(draft, parsed.semesters));
    setWarnings(verifyParsed(parsed));
    setParseMsg('ok');
    setPaste(''); // the pasted page is not kept anywhere
  };

  const addCourse = (sem) => {
    const e = extra[sem] ?? {};
    if (!e.name?.trim() || !(Number(e.credits) > 0)) return;
    patchSem(sem, (s) => ({ ...s, courses: [...s.courses, { code: e.code ?? '', name: e.name.trim(), credits: Number(e.credits), grade: '' }] }));
    setExtra({ ...extra, [sem]: {} });
  };

  if (profile.currentSemester <= 1) return <Card title={t('past.title')}><p>{t('past.none')}</p></Card>;

  return (
    <div className="stack">
      <Card title={t('past.paste')}>
        <p>{t('past.pasteHelp')}</p>
        <textarea rows={5} aria-label={t('past.paste')} value={paste} onChange={(e) => setPaste(e.target.value)} />
        <TextFileInput onText={setPaste} />
        <div className="actions">
          <button className="btn" onClick={runParse} disabled={!paste.trim()}>{t('past.parse')}</button>
          <button className="btn" onClick={onImport}>{t('past.useAi')}</button>
        </div>
        {parseMsg === 'none' && <Notice kind="warn">{t('past.noMatch')}</Notice>}
        {parseMsg === 'ok' && <Notice kind="info">{t('past.parsed')}</Notice>}
        {warnings.map((w, i) => (
          <Notice key={i} kind="warn">{t(`past.warn.${w.key}`, { sem: w.semester ?? '', computed: fmt(w.computed), page: fmt(w.page) })}</Notice>
        ))}
      </Card>

      {draft.map((s) => {
        const g = semesterGpa(s.courses);
        return (
          <Card key={s.semester} title={`${t('past.semester', { n: s.semester })}${s.term ? ` · ${s.term}` : ''}`}>
            <label className="inline"><input type="checkbox" checked={!!s.skipped} onChange={(e) => patchSem(s.semester, (x) => ({ ...x, skipped: e.target.checked }))} /> {t('past.skip')}</label>
            {!s.skipped && (
              <>
                {s.courses.length === 0 && <p className="muted">{t('reg.empty')}</p>}
                <ul className="rows">
                  {s.courses.map((c, i) => (
                    <li key={`${c.code}-${i}`} className="row">
                      <div className="grow"><strong>{c.code}</strong> {c.name} <span className="muted">· {c.credits} {t('common.credits')}</span></div>
                      <GradeSelect label={t('past.gradeFor', { name: c.name })} value={c.grade} onChange={(v) => setGrade(s.semester, i, v)} />
                    </li>
                  ))}
                </ul>
                <fieldset className="add-row">
                  <legend>{t('reg.addCourse')}</legend>
                  <input aria-label={t('common.code')} placeholder={t('common.code')} value={extra[s.semester]?.code ?? ''} onChange={(e) => setExtra({ ...extra, [s.semester]: { ...extra[s.semester], code: e.target.value } })} />
                  <input aria-label={t('common.name')} placeholder={t('common.name')} value={extra[s.semester]?.name ?? ''} onChange={(e) => setExtra({ ...extra, [s.semester]: { ...extra[s.semester], name: e.target.value } })} />
                  <input className="narrow" type="number" min="0.5" step="0.5" aria-label={t('common.credits')} placeholder={t('common.credits')} value={extra[s.semester]?.credits ?? ''} onChange={(e) => setExtra({ ...extra, [s.semester]: { ...extra[s.semester], credits: e.target.value } })} />
                  <button className="btn" type="button" onClick={() => addCourse(s.semester)}>{t('common.add')}</button>
                </fieldset>
                {g.credits > 0 && <p><strong>{t('past.gpa', { gpa: fmt(g.gpa), credits: g.credits })}</strong></p>}
              </>
            )}
          </Card>
        );
      })}
      <div className="actions"><button className="btn primary" onClick={() => onSave({ ...profile, pastSemesters: draftToSaved(draft) })}>{t('past.save')}</button></div>
    </div>
  );
}
