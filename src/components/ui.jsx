import { useT } from '../i18n/index.jsx';

export const Card = ({ title, children, className = '' }) => (
  <section className={`card ${className}`}>{title && <h2>{title}</h2>}{children}</section>
);

export const Field = ({ label, children, hint }) => (
  <label className="field"><span>{label}</span>{children}{hint && <small>{hint}</small>}</label>
);

export const Notice = ({ kind = 'info', children }) => (
  <div className={`notice notice-${kind}`} role={kind === 'error' ? 'alert' : 'status'}>{children}</div>
);

export const Spinner = ({ label }) => <p className="muted" role="status" aria-live="polite">⏳ {label}</p>;

export const Empty = ({ children }) => <p className="muted empty">{children}</p>;

/** Shown wherever marks ranges or grade rules appear. */
export const UnverifiedNote = () => {
  const { t } = useT();
  return <Notice kind="warn">{t('rules.unverified')}</Notice>;
};
