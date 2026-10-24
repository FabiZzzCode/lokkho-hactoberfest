import { Notice } from './ui.jsx';
import { useT } from '../i18n/index.jsx';

/** One error display for every AI call: translated text for timeout/network, a Retry button, and the manual-entry reminder. */
export default function AiError({ error, onRetry }) {
  const { t } = useT();
  const text = error.code === 'timeout' || error.code === 'network' ? t(`ai.err.${error.code}`) : error.message;
  return (
    <Notice kind="error">
      {text} {t('ai.manual')}
      {onRetry && <> <button className="btn small" onClick={onRetry}>{t('ai.retry')}</button></>}
    </Notice>
  );
}
