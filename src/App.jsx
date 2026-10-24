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
import Backup from './features/data-backup/Backup.jsx';
import CloudSync from './features/cloud-sync/CloudSync.jsx';
import { Notice } from './components/ui.jsx';

const NAV = ['dashboard', 'register', 'past', 'course', 'retake', 'import', 'backup', 'sync'];

function Shell({ profile, setProfile, lang, setLang, view, setView }) {
  const { t } = useT();

  // Save a profile and optionally move to another view.
  const save = (p, next) => { setProfile(p); if (next) setView(next); };

  useEffect(() => { document.documentElement.lang = lang; }, [lang]);

  const body = !profile ? (
    <Onboarding lang={lang} onDone={(p, next) => save(p, next)} />
  ) : {
    dashboard: <Dashboard profile={profile} go={setView} />,
    register: <Registration profile={profile} onSave={(p) => save(p, 'dashboard')} onImport={() => setView('import')} />,
    past: <PastResults profile={profile} onSave={(p) => save(p, 'dashboard')} onImport={() => setView('import')} />,
    course: <CourseTracker profile={profile} onSave={(p) => save(p)} go={setView} />,
    retake: <RetakeSimulator profile={profile} />,
    import: <AiImport profile={profile} onSave={(p, next) => save(p, next ?? 'dashboard')} />,
    backup: <Backup profile={profile} onReplace={(p) => save(p, 'dashboard')} onReset={() => { setProfile(null); setView('onboarding'); }} />,
    sync: <CloudSync profile={profile} onReplace={(p) => save(p, 'dashboard')} />,
  }[view];

  return (
    <>
      <header className="top">
        <h1>{t('app.name')} <span className="tag">{t('app.tagline')}</span></h1>
        <label className="lang"><span className="sr">{t('app.language')}</span>
          <select value={lang} onChange={(e) => { setLang(e.target.value); if (profile) setProfile({ ...profile, language: e.target.value }); }}>
            <option value="en">English</option><option value="bn">বাংলা</option>
          </select>
        </label>
      </header>
      {profile && (
        <nav className="nav" aria-label={t('app.menu')}>
          {NAV.map((n) => (
            <button key={n} className={view === n ? 'active' : ''} aria-current={view === n ? 'page' : undefined} onClick={() => setView(n)}>{t(`nav.${n}`)}</button>
          ))}
        </nav>
      )}
      <main>{body}</main>
      <footer><Notice kind="info">{t('app.disclaimer')}</Notice></footer>
    </>
  );
}

export default function App() {
  const { profile, setProfile, ready } = useProfile();
  const [lang, setLang] = useState(null);
  const [view, setView] = useState(null);
  if (!ready) return null;
  const current = lang ?? profile?.language ?? 'en';
  return (
    <I18nProvider lang={current}>
      <Shell profile={profile} setProfile={setProfile} lang={current} setLang={setLang} view={view ?? (profile ? 'dashboard' : 'onboarding')} setView={setView} />
    </I18nProvider>
  );
}
