import { useState } from 'react';
import { useT } from '../i18n/index.jsx';

/**
 * Editable checklist of courses. Used for registration and for reviewing AI imports.
 * rows: [{code,name,credits,type,checked}]
 */
export default function CourseListEditor({ rows, onChange }) {
  const { t } = useT();
  const [draft, setDraft] = useState({ code: '', name: '', credits: '3', type: 'theory' });
  const patch = (i, p) => onChange(rows.map((r, j) => (j === i ? { ...r, ...p } : r)));
  const add = () => {
    if (!draft.name.trim() || !(Number(draft.credits) > 0)) return;
    onChange([...rows, { ...draft, credits: Number(draft.credits), checked: true }]);
    setDraft({ code: '', name: '', credits: '3', type: 'theory' });
  };
  return (
    <div>
      <ul className="rows">
        {rows.map((r, i) => (
          <li key={`${r.code}-${i}`} className="row">
            <input type="checkbox" checked={r.checked} aria-label={t('reg.include', { name: r.name })} onChange={(e) => patch(i, { checked: e.target.checked })} />
            <div className="grow"><strong>{r.code}</strong> {r.name}</div>
            <input className="narrow" type="number" min="0.5" step="0.5" aria-label={t('common.credits')} value={r.credits} onChange={(e) => patch(i, { credits: Number(e.target.value) })} />
          </li>
        ))}
      </ul>
      <fieldset className="add-row">
        <legend>{t('reg.addCourse')}</legend>
        <input aria-label={t('common.code')} placeholder={t('common.code')} value={draft.code} onChange={(e) => setDraft({ ...draft, code: e.target.value })} />
        <input aria-label={t('common.name')} placeholder={t('common.name')} value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })} />
        <input className="narrow" type="number" min="0.5" step="0.5" aria-label={t('common.credits')} value={draft.credits} onChange={(e) => setDraft({ ...draft, credits: e.target.value })} />
        <select aria-label={t('common.type')} value={draft.type} onChange={(e) => setDraft({ ...draft, type: e.target.value })}>
          <option value="theory">{t('common.theory')}</option><option value="lab">{t('common.lab')}</option>
        </select>
        <button type="button" className="btn" onClick={add}>{t('common.add')}</button>
      </fieldset>
    </div>
  );
}
