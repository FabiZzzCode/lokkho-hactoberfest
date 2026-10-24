import { Card } from './ui.jsx';
import { useT } from '../i18n/index.jsx';

/** Shown instead of empty numbers. `onLoadSample` replaces the profile with the SAMPLE student. */
export default function NoData({ title, body, go, onLoadSample }) {
  const { t } = useT();
  return (
    <Card title={title}>
      <p>{body}</p>
      <div className="actions">
        <button className="btn primary" onClick={() => go('past')}>{t('dash.start.button')}</button>
        <button className="btn" onClick={onLoadSample}>{t('nodata.sample')}</button>
      </div>
    </Card>
  );
}
