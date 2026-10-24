import { useState } from 'react';
import { callApi } from '../../api.js';
import { Card, Field, Notice, Spinner } from '../../components/ui.jsx';
import { useT } from '../../i18n/index.jsx';

const ERRORS = { invalid_credentials: 'account.err.credentials', email_taken: 'account.err.taken', rate_limited: 'account.err.rate', network: 'account.err.network' };

function AuthForm({ guestProfile, onAuthed, onGuestMoved }) {
  const { t } = useT();
  const [mode, setMode] = useState('login');
  const [f, setF] = useState({ email: '', password: '', displayName: '' });
  const [move, setMove] = useState(true);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState(null);
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });
  const signup = mode === 'signup';

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true); setErr(null);
    const body = signup
      ? { action: 'signup', ...f, displayName: f.displayName || undefined, ...(guestProfile && move && { profile: guestProfile }) }
      : { action: 'login', email: f.email, password: f.password };
    const r = await callApi('auth', body);
    setBusy(false);
    if (!r.ok) return setErr(ERRORS[r.error.code] ? t(ERRORS[r.error.code]) : r.error.message);
    if (signup && guestProfile && move) onGuestMoved();
    onAuthed(r.data.user);
  };

  return (
    <Card title={t(signup ? 'account.signup' : 'account.login')}>
      <Notice kind="warn">{t('account.prototype')}</Notice>
      <form onSubmit={submit} className="stack">
        <Field label={t('account.email')}><input type="email" autoComplete="email" required value={f.email} onChange={set('email')} /></Field>
        {signup && <Field label={t('account.name')}><input autoComplete="nickname" maxLength={60} value={f.displayName} onChange={set('displayName')} /></Field>}
        <Field label={t('account.password')} hint={signup ? t('account.passwordHint') : ''}>
          <input type="password" autoComplete={signup ? 'new-password' : 'current-password'} required minLength={signup ? 8 : 1} maxLength={72} value={f.password} onChange={set('password')} />
        </Field>
        {signup && guestProfile && (
          <label className="check"><input type="checkbox" checked={move} onChange={(e) => setMove(e.target.checked)} /> {t('account.moveGuest')}</label>
        )}
        {busy && <Spinner label={t('account.working')} />}
        {err && <Notice kind="error">{err}</Notice>}
        <div className="actions">
          <button className="btn primary" type="submit" disabled={busy}>{t(signup ? 'account.signup' : 'account.login')}</button>
          <button className="btn" type="button" onClick={() => { setMode(signup ? 'login' : 'signup'); setErr(null); }}>{t(signup ? 'account.haveAccount' : 'account.needAccount')}</button>
        </div>
      </form>
    </Card>
  );
}

export default function Account({ user, guestProfile, onAuthed, onGuestMoved, onLoggedOut, onDeleted, onResetLocal }) {
  const { t } = useT();
  const [err, setErr] = useState(null);

  const leave = async (action, done) => {
    const r = await callApi('auth', { action });
    if (r.ok) done(); else setErr(t(ERRORS[r.error.code] ?? 'account.err.generic'));
  };

  if (!user) {
    return (
      <div className="stack">
        <AuthForm guestProfile={guestProfile} onAuthed={onAuthed} onGuestMoved={onGuestMoved} />
        {guestProfile && (
          <Card title={t('account.guestTitle')}>
            <p>{t('account.guestHelp')}</p>
            <button className="btn danger" onClick={() => window.confirm(t('account.confirmReset')) && onResetLocal()}>{t('account.resetLocal')}</button>
          </Card>
        )}
      </div>
    );
  }
  return (
    <Card title={t('account.title')}>
      <p>{t('account.signedInAs', { who: user.displayName ? `${user.displayName} (${user.email})` : user.email })}</p>
      <Notice kind="info">{t('account.prototype')}</Notice>
      <div className="actions">
        <button className="btn" onClick={() => leave('logout', onLoggedOut)}>{t('account.logout')}</button>
        <button className="btn danger" onClick={() => window.confirm(t('account.confirmDelete')) && leave('deleteAccount', onDeleted)}>{t('account.delete')}</button>
      </div>
      {err && <Notice kind="error">{err}</Notice>}
    </Card>
  );
}
