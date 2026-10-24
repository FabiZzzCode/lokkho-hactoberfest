import { useEffect, useState } from 'react';
import { I18nProvider, useT } from './i18n/index.jsx';
import { useProfile } from './state/useProfile.js';
import { callApi } from './api.js';
import { LocalStorageRepo } from './storage/repo.js';
import { ServerRepo } from './storage/serverRepo.js';
import Onboarding from './features/onboarding/Onboarding.jsx';
import Registration from './features/registration/Registration.jsx';
import PastResults from './features/past-results/PastResults.jsx';
import Dashboard from './features/dashboard/Dashboard.jsx';
import CourseTracker from './features/course-tracker/CourseTracker.jsx';
import RetakeSimulator from './features/retake-simulator/RetakeSimulator.jsx';
import AiImport from './features/ai-import/AiImport.jsx';
import Account from './features/account/Account.jsx';
import { Notice } from './components/ui.jsx';

const NAV = ['dashboard', 'register', 'past', 'course', 'retake', 'import', 'account'];
const SAVE_DELAY_MS = 800;

function SaveStatus({ status, retry }) {
  const { t } = useT();
  if (status === 'idle') return null;
  if (status === 'error') return <span className="save save-error" role="alert">{t('save.error')} <button className="link" onClick={retry}>{t('save.retry')}</button></span>;
  return <span className="save" role="status">{t(`save.${status}`)}</span>;
}

function Shell({ user, setUser, lang, setLang, view, setView }) {
  const { t } = useT();
  const repo = user ? ServerRepo : LocalStorageRepo;
  const { profile, setProfile, ready, status, retry } = useProfile(repo, user ? SAVE_DELAY_MS : 0);

  // Save a profile and optionally move to another view.
  const save = (p, next) => { setProfile(p); if (next) setView(next); };

  useEffect(() => { document.documentElement.lang = lang; }, [lang]);
  // Use the language stored with the profile (local or account) once it has loaded.
  useEffect(() => { if (ready && profile?.language) setLang(profile.language); }, [ready]); // eslint-disable-line react-hooks/exhaustive-deps
  if (!ready) return null;

  const account = (
    <Account
      user={user}
      guestProfile={user ? null : profile}
      onAuthed={(u) => { setUser(u); setView('dashboard'); }}
      onGuestMoved={() => LocalStorageRepo.remove()}
      onLoggedOut={() => { setUser(null); setView(null); }}
      onDeleted={() => { setUser(null); setView(null); }}
      onResetLocal={() => { setProfile(null); setView('onboarding'); }}
    />
  );
  const body = view === 'account' ? account : !profile ? (
    <Onboarding lang={lang} onDone={(p, next) => save(p, next)} />
  ) : {
    dashboard: <Dashboard profile={profile} go={setView} />,
    register: <Registration profile={profile} onSave={(p) => save(p, 'dashboard')} onImport={() => setView('import')} />,
    past: <PastResults profile={profile} onSave={(p) => save(p, 'dashboard')} onImport={() => setView('import')} />,
    course: <CourseTracker profile={profile} onSave={(p) => save(p)} go={setView} />,
    retake: <RetakeSimulator profile={profile} />,
    import: <AiImport profile={profile} onSave={(p, next) => save(p, next ?? 'dashboard')} />,
  }[view];
  const current = view ?? (profile ? 'dashboard' : 'onboarding');

  return (
    <>
      <header className="top">
        <h1>{t('app.name')} <span className="tag">{t('app.tagline')}</span></h1>
        <div className="top-end">
          {user && <SaveStatus status={status} retry={retry} />}
          <button className="btn small" onClick={() => setView('account')}>{user ? (user.displayName ?? user.email) : t('header.login')}</button>
          <label className="lang"><span className="sr">{t('app.language')}</span>
            <select value={lang} onChange={(e) => { setLang(e.target.value); if (profile) setProfile({ ...profile, language: e.target.value }); }}>
              <option value="en">English</option><option value="bn">বাংলা</option>
            </select>
          </label>
        </div>
      </header>
      {profile && (
        <nav className="nav" aria-label={t('app.menu')}>
          {NAV.map((n) => (
            <button key={n} className={current === n ? 'active' : ''} aria-current={current === n ? 'page' : undefined} onClick={() => setView(n)}>{t(`nav.${n}`)}</button>
          ))}
        </nav>
      )}
      <main>{body}</main>
      <footer><Notice kind="info">{t('app.disclaimer')}</Notice></footer>
    </>
  );
}

export default function App() {
  // session: undefined while checking, null for a guest, or { email, displayName }
  const [user, setUser] = useState(undefined);
  const [lang, setLang] = useState(null);
  const [view, setView] = useState(null);
  const initialLang = lang ?? 'en';

  useEffect(() => {
    callApi('auth', { action: 'me' }).then((r) => setUser(r.ok ? r.data.user : null));
  }, []);
  if (user === undefined) return null;
  return (
    <I18nProvider lang={initialLang}>
      <Shell key={user?.email ?? 'guest'} user={user} setUser={setUser} lang={initialLang} setLang={setLang} view={view} setView={setView} />
    </I18nProvider>
  );
}
