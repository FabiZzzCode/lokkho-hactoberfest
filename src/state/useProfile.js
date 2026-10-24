import { useCallback, useEffect, useState } from 'react';
import { LocalStorageRepo } from '../storage/repo.js';

// Holds the one profile document and saves every change through the repository.
export function useProfile(repo = LocalStorageRepo) {
  const [profile, setProfileState] = useState(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    repo.load().then((p) => { setProfileState(p); setReady(true); });
  }, [repo]);

  const setProfile = useCallback((next) => {
    setProfileState(next);
    if (next) repo.save(next); else repo.remove();
  }, [repo]);

  return { profile, setProfile, ready };
}
