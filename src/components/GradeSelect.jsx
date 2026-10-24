import { GRADES, WITHDRAW_GRADE } from '../config/grading.config.js';
import { useT } from '../i18n/index.jsx';

export default function GradeSelect({ value, onChange, label }) {
  const { t } = useT();
  return (
    <select aria-label={label} value={value ?? ''} onChange={(e) => onChange(e.target.value)}>
      <option value="">{t('common.noGrade')}</option>
      {GRADES.map((g) => <option key={g.grade} value={g.grade}>{g.grade} ({g.points.toFixed(2)})</option>)}
      <option value={WITHDRAW_GRADE}>{WITHDRAW_GRADE} ({t('common.withdrawn')})</option>
    </select>
  );
}
