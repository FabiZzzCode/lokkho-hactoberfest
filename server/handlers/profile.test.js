import { describe, it, expect } from 'vitest';
import { createProfileHandler } from './profile.js';
import { hashCode } from '../db/profileStore.js';
import { newProfile } from '../../src/engine/profile.js';

const memory = () => {
  const m = new Map();
  return { m, get: async (k) => m.get(k) ?? null, put: async (k, v) => m.set(k, v), remove: async (k) => m.delete(k) };
};
const CODE = 'a'.repeat(40);
let n = 0;
const call = (h, body) => h({ method: 'POST', body, ip: `ip${n++}` });

describe('profile handler', () => {
  it('saves, loads and deletes by code, storing only the hash', async () => {
    const store = memory();
    const h = createProfileHandler(store);
    expect((await call(h, { action: 'save', code: CODE, profile: newProfile() })).status).toBe(200);
    expect([...store.m.keys()]).toEqual([hashCode(CODE)]);
    expect((await call(h, { action: 'load', code: CODE })).body.data.profile.version).toBe(newProfile().version);
    await call(h, { action: 'delete', code: CODE });
    expect((await call(h, { action: 'load', code: CODE })).status).toBe(404);
  });
  it('rejects short codes, bad profiles and oversized profiles', async () => {
    const h = createProfileHandler(memory());
    expect((await call(h, { action: 'load', code: 'short' })).body.error.code).toBe('invalid_input');
    expect((await call(h, { action: 'save', code: CODE, profile: { nope: 1 } })).status).toBe(400);
    const big = { ...newProfile(), junk: 'x'.repeat(210_000) };
    expect((await call(h, { action: 'save', code: CODE, profile: big })).status).toBe(413);
  });
  it('rejects non-POST', async () => {
    expect((await createProfileHandler(memory())({ method: 'GET', body: {}, ip: 'z' })).status).toBe(405);
  });
});
