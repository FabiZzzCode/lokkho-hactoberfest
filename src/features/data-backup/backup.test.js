import { describe, it, expect } from 'vitest';
import { toBackupText, parseBackup } from './backup.js';
import { newProfile } from '../../engine/profile.js';

describe('backup', () => {
  it('round-trips a profile', () => {
    const p = newProfile('cse', 4, 3.7);
    expect(parseBackup(toBackupText(p)).profile).toEqual(p);
  });
  it('rejects bad json and bad profiles', () => {
    expect(parseBackup('{oops').error).toBe('invalid_json');
    expect(parseBackup('{"version":1}').error).toBe('invalid_profile');
  });
});
