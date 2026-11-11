import { useEffect, useState } from 'react';
import Logo from './Logo.jsx';

const DURATION = 2200; // ms for 0 -> 100%
const SEEN = 'lokkho.splash';

const seenBefore = () => { try { return sessionStorage.getItem(SEEN) === '1'; } catch { return false; } };

/** Opening screen with a 0-100% progress counter. Shown once per browser session; click or any key skips it. */
export default function Splash({ children }) {
  const [done, setDone] = useState(seenBefore);
  const [leaving, setLeaving] = useState(false);
  const [pct, setPct] = useState(0);

  const finish = () => {
    try { sessionStorage.setItem(SEEN, '1'); } catch { /* storage unavailable: fine */ }
    setLeaving(true);
    setTimeout(() => setDone(true), 450);
  };

  useEffect(() => {
    if (done) return undefined;
    const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    const start = performance.now();
    let raf;
    const tick = (now) => {
      const p = Math.min(1, (now - start) / (reduce ? 400 : DURATION));
      const eased = 1 - Math.pow(1 - p, 2.2); // quick start, gentle finish
      setPct(Math.round(eased * 100));
      if (p < 1) raf = requestAnimationFrame(tick);
      else setTimeout(finish, 250);
    };
    raf = requestAnimationFrame(tick);
    const skip = () => finish();
    window.addEventListener('keydown', skip);
    return () => { cancelAnimationFrame(raf); window.removeEventListener('keydown', skip); };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  if (done) return children;
  return (
    <>
      <div className={`splash${leaving ? ' splash-out' : ''}`} onClick={finish} role="progressbar" aria-label="Loading Lokkho" aria-valuemin={0} aria-valuemax={100} aria-valuenow={pct}>
        <div className="splash-orb splash-orb-a" /><div className="splash-orb splash-orb-b" />
        <div className="splash-center">
          <div className="splash-logo"><Logo size={84} /></div>
          <h1 className="splash-name">Lokkho</h1>
          <p className="splash-tag">লক্ষ্য · Know the marks you need</p>
          <div className="splash-bar"><span style={{ inlineSize: `${pct}%` }} /></div>
          <p className="splash-pct">{pct}%</p>
        </div>
      </div>
    </>
  );
}
