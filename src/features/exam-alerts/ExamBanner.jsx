import { examAlerts } from '../../engine/planning.js';
import { Notice } from '../../components/ui.jsx';
import { useT } from '../../i18n/index.jsx';

export default function ExamBanner({ courses }) {
  const { t } = useT();
  const alerts = examAlerts(courses);
  if (!alerts.length) return null;
  return (
    <Notice kind="alert">
      <strong>{t('exam.title')}</strong>
      <ul className="plain">
        {alerts.map((a) => (
          <li key={`${a.code}-${a.component}`}>
            {t('exam.line', { course: a.name, exam: t(`comp.${a.component}`), date: a.date, days: a.daysLeft })}
          </li>
        ))}
      </ul>
    </Notice>
  );
}
