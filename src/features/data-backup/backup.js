import { validateProfile } from '../../engine/profile.js';

export const toBackupText = (profile) => JSON.stringify(profile, null, 2);

/** Returns {profile} or {error:'invalid_json'|'invalid_profile'}; never trusts file content blindly. */
export function parseBackup(text) {
  let p;
  try { p = JSON.parse(text); } catch { return { error: 'invalid_json' }; }
  return validateProfile(p).length ? { error: 'invalid_profile' } : { profile: p };
}
