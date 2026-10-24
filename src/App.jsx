import { useEffect, useState } from 'react';
import { I18nProvider, useT } from './i18n/index.jsx';
import { useProfile } from './state/useProfile.js';
import Onboarding from './features/onboarding/Onboarding.jsx';
import Registration from './features/registration/Registration.jsx';
import PastResults from './features/past-results/PastResults.jsx';
import Dashboard from './features/dashboard/Dashboard.jsx';
import CourseTracker from './features/course-tracker/CourseTracker.jsx';
import RetakeSimulator from './features/retake-simulator/RetakeSimulator.jsx';
import AiImport from './features/ai-import/AiImport.jsx';
import { Notice } from './components/ui.jsx';

const NAV = ['dashboard', 'register', 'past', 'course', 'retake', 'import'];

function Shell({ lang, setLang, view, setView }) {
  const { t } = useT();
  const { profile, setProfile, ready } = useProfile();

  // Save a profile and optionally move to another view.
  const save = (p, next) => { setProfile(p); if (next) setView(next); };

  useEffect(() => { document.documentElement.lang = lang; }, [lang]);
  // Use the language stored with the profile (local or account) once it has loaded.
  useEffect(() => { if (ready && profile?.language) setLang(profile.language); }, [ready]); // eslint-disable-line react-hooks/exhaustive-deps
  if (!ready) return null;

  const body = !profile ? (
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
      <footer>
        <Notice kind="info">{t('app.disclaimer')}</Notice>
        {profile && <button className="btn danger small" onClick={() => window.confirm(t('app.confirmReset')) && (setProfile(null), setView('onboarding'))}>{t('app.reset')}</button>}
      </footer>
    </>
  );
}

export default function App() {
  const [lang, setLang] = useState(null);
  const [view, setView] = useState(null);
  return (
    <I18nProvider lang={lang ?? 'en'}>
      <Shell lang={lang ?? 'en'} setLang={setLang} view={view} setView={setView} />
    </I18nProvider>
  );
}
