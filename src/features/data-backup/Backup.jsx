import { useState } from 'react';
import { toBackupText, parseBackup } from './backup.js';
import { Card, Notice } from '../../components/ui.jsx';
import { useT } from '../../i18n/index.jsx';

export default function Backup({ profile, onReplace, onReset }) {
  const { t } = useT();
  const [msg, setMsg] = useState(null);
  const download = () => {
    const url = URL.createObjectURL(new Blob([toBackupText(profile)], { type: 'application/json' }));
    const a = document.createElement('a');
    a.href = url; a.download = 'lokkho-backup.json'; a.click();
    URL.revokeObjectURL(url);
  };
  const upload = async (file) => {
    if (!file) return;
    if (file.size > 200_000) return setMsg({ kind: 'error', key: 'backup.bad' });
    const r = parseBackup(await file.text());
    if (r.error) return setMsg({ kind: 'error', key: 'backup.bad' });
    onReplace(r.profile);
    setMsg({ kind: 'info', key: 'backup.ok' });
  };
  return (
    <Card title={t('backup.title')}>
      <p>{t('backup.help')}</p>
      <div className="actions">
        <button className="btn primary" onClick={download}>{t('backup.export')}</button>
        <label className="btn">{t('backup.import')}<input hidden type="file" accept="application/json" onChange={(e) => upload(e.target.files[0])} /></label>
        <button className="btn danger" onClick={() => window.confirm(t('backup.confirmReset')) && onReset()}>{t('backup.reset')}</button>
      </div>
      {msg && <Notice kind={msg.kind}>{t(msg.key)}</Notice>}
    </Card>
  );
}
