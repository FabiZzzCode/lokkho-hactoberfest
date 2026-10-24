import { validateProfile } from '../engine/profile.js';

// One repository interface: load(), save(profile), remove(). Storage backends are swappable.
const KEY = 'lokkho.profile.v1';

export const LocalStorageRepo = {
  async load() {
    try {
      const raw = localStorage.getItem(KEY);
      if (!raw) return null;
      const p = JSON.parse(raw);
      return validateProfile(p).length ? null : p;
    } catch { return null; }
  },
  async save(profile) {
    try { localStorage.setItem(KEY, JSON.stringify(profile)); return true; } catch { return false; }
  },
  async remove() {
    try { localStorage.removeItem(KEY); } catch { /* storage blocked: nothing to remove */ }
  },
};
