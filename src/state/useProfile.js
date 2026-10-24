import { useCallback, useEffect, useRef, useState } from 'react';
import { LocalStorageRepo } from '../storage/repo.js';

// Holds the one profile document and saves every change through the repository.
// `delay` > 0 debounces saves (used for the server); status is idle | saving | saved | error.
export function useProfile(repo = LocalStorageRepo, delay = 0) {
  const [profile, setProfileState] = useState(null);
  const [ready, setReady] = useState(false);
  const [status, setStatus] = useState('idle');
  const timer = useRef(null);
  const latest = useRef(null);

  useEffect(() => {
    repo.load().then((p) => { setProfileState(p); setReady(true); });
    return () => clearTimeout(timer.current);
  }, [repo]);

  const flush = useCallback(async () => {
    setStatus('saving');
    const okSave = await repo.save(latest.current);
    // A newer change may have arrived while saving; its own timer will report the final state.
    if (!timer.current) setStatus(okSave === false ? 'error' : 'saved');
  }, [repo]);

  const setProfile = useCallback((next) => {
    setProfileState(next);
    latest.current = next;
    clearTimeout(timer.current);
    if (!next) { timer.current = null; repo.remove(); return; }
    if (!delay) { repo.save(next); return; }
    setStatus('saving');
    timer.current = setTimeout(() => { timer.current = null; flush(); }, delay);
  }, [repo, delay, flush]);

  return { profile, setProfile, ready, status, retry: flush };
}
