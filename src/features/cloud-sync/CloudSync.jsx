import { useState } from 'react';
import { CloudRepo, getCode, setCode, newCode } from '../../storage/cloudRepo.js';
import { Card, Notice, Spinner } from '../../components/ui.jsx';
import { useT } from '../../i18n/index.jsx';

const CODE_OK = /^[A-Za-z0-9_-]{32,64}$/;

export default function CloudSync({ profile, onReplace }) {
  const { t } = useT();
  const [code, setLocalCode] = useState(getCode());
  const [entry, setEntry] = useState('');
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState(null);

  const run = async (fn, okKey) => {
    setBusy(true); setMsg(null);
    const r = await fn();
    setBusy(false);
    setMsg(r.ok ? { kind: 'info', text: t(okKey) } : { kind: 'error', text: r.error.code === 'network' ? t('sync.network') : r.error.message });
    return r;
  };
  const enable = async () => {
    const c = newCode();
    const r = await run(() => CloudRepo.save(c, profile), 'sync.saved');
    if (r.ok) { setCode(c); setLocalCode(c); }
  };
  const connect = async () => {
    const c = entry.trim();
    if (!CODE_OK.test(c)) return setMsg({ kind: 'error', text: t('sync.badCode') });
    const r = await run(() => CloudRepo.load(c), 'sync.loaded');
    if (r.ok) { setCode(c); setLocalCode(c); setEntry(''); onReplace(r.data.profile); }
  };
  const del = async () => {
    if (!window.confirm(t('sync.confirmDelete'))) return;
    const r = await run(() => CloudRepo.remove(code), 'sync.deleted');
    if (r.ok) { setCode(null); setLocalCode(null); }
  };

  return (
    <Card title={t('sync.title')}>
      <Notice kind="warn">{t('sync.warning')}</Notice>
      {busy && <Spinner label={t('sync.working')} />}
      {code ? (
        <>
          <p>{t('sync.yourCode')}</p>
          <p><input readOnly className="code" aria-label={t('sync.yourCode')} value={code} onFocus={(e) => e.target.select()} /></p>
          <div className="actions">
            <button className="btn" onClick={() => navigator.clipboard?.writeText(code).then(() => setMsg({ kind: 'info', text: t('sync.copied') }))}>{t('sync.copy')}</button>
            <button className="btn primary" disabled={busy} onClick={() => run(() => CloudRepo.save(code, profile), 'sync.saved')}>{t('sync.saveNow')}</button>
            <button className="btn danger" disabled={busy} onClick={del}>{t('sync.delete')}</button>
          </div>
        </>
      ) : (
        <>
          <div className="actions"><button className="btn primary" disabled={busy} onClick={enable}>{t('sync.enable')}</button></div>
          <p>{t('sync.haveCode')}</p>
          <p><input className="code" aria-label={t('sync.haveCode')} value={entry} onChange={(e) => setEntry(e.target.value)} /></p>
          <div className="actions"><button className="btn" disabled={busy || !entry.trim()} onClick={connect}>{t('sync.connect')}</button></div>
        </>
      )}
      {msg && <Notice kind={msg.kind}>{msg.text}</Notice>}
    </Card>
  );
}
