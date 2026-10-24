import { describe, it, expect, beforeEach } from 'vitest';
import { createAuthHandler } from '../handlers/auth.js';
import { createProfileHandler } from '../handlers/profile.js';
import { hashPassword, verifyPassword } from './password.js';
import { signSession, verifySession, readCookie, sessionCookie } from './session.js';
import { readEmail, readNewPassword, readDisplayName } from './validate.js';
import { checkRequest } from './guards.js';
import { newProfile } from '../../src/engine/profile.js';

process.env.SESSION_SECRET = 'test-secret-test-secret-test-secret-123';

// In-memory stores with the same interface as server/db/stores.js.
function memoryStores() {
  const u = new Map(); const p = new Map(); const a = new Map(); let n = 0;
  return {
    users: {
      async create(d) {
        if ([...u.values()].some((x) => x.email === d.email)) throw Object.assign(new Error('dup'), { code: 11000 });
        const id = `u${++n}`; u.set(id, { id, ...d }); return { id, email: d.email, displayName: d.displayName };
      },
      async findByEmail(email) { return [...u.values()].find((x) => x.email === email) ?? null; },
      async findById(id) { return u.get(id) ?? null; },
      async remove(id) { u.delete(id); },
    },
    profiles: { async get(id) { return p.get(id) ?? null; }, async put(id, v) { p.set(id, v); }, async remove(id) { p.delete(id); } },
    attempts: { async hit(k) { a.set(k, (a.get(k) ?? 0) + 1); return a.get(k); } },
    _p: p,
  };
}
const HEAD = { 'content-type': 'application/json', origin: 'https://app.test', host: 'app.test' };
const cookieOf = (r) => r.cookies?.[0]?.split(';')[0];

describe('passwords', () => {
  it('hashes, verifies, and never stores plain text', async () => {
    const h = await hashPassword('correct horse');
    expect(h).not.toContain('correct');
    expect(await verifyPassword('correct horse', h)).toBe(true);
    expect(await verifyPassword('wrong', h)).toBe(false);
  });
});

describe('sessions', () => {
  it('round-trips a user id and rejects forged or tampered tokens', async () => {
    const t = await signSession('u1');
    expect(await verifySession(t)).toBe('u1');
    expect(await verifySession(t + 'x')).toBeNull();
    expect(await verifySession(await signSession('u1', 'another-secret-another-secret-123456'))).toBeNull();
    expect(await verifySession(null)).toBeNull();
  });
  it('cookie is HttpOnly, SameSite=Lax, 7 days and parses back', async () => {
    const c = sessionCookie('abc');
    expect(c).toMatch(/HttpOnly/); expect(c).toMatch(/SameSite=Lax/); expect(c).toMatch(/Max-Age=604800/);
    expect(readCookie('a=1; lokkho_session=abc; b=2')).toBe('abc');
  });
});

describe('validation', () => {
  it('normalises email and enforces password rules', () => {
    expect(readEmail('  Sara@Example.COM ')).toBe('sara@example.com');
    expect(() => readEmail('nope')).toThrow();
    expect(() => readNewPassword('short')).toThrow();
    expect(() => readNewPassword('x'.repeat(73))).toThrow();
    expect(readNewPassword('longenough')).toBe('longenough');
    expect(readDisplayName('')).toBeUndefined();
    expect(() => readDisplayName('x'.repeat(61))).toThrow();
  });
  it('rejects non-JSON, foreign origin and non-POST', () => {
    expect(() => checkRequest({ method: 'POST', headers: { ...HEAD, 'content-type': 'text/plain' } })).toThrow(/application\/json/);
    expect(() => checkRequest({ method: 'POST', headers: { ...HEAD, origin: 'https://evil.test' } })).toThrow(/origin/);
    expect(() => checkRequest({ method: 'POST', headers: { 'content-type': 'application/json', host: 'app.test' } })).toThrow();
    expect(() => checkRequest({ method: 'GET', headers: HEAD })).toThrow();
    expect(() => checkRequest({ method: 'POST', headers: HEAD })).not.toThrow();
  });
});

describe('auth + profile flow', () => {
  let stores, auth, prof;
  const post = (h, body, cookie, ip = '1.1.1.1') => h({ method: 'POST', body, ip, headers: { ...HEAD, ...(cookie && { cookie }) } });
  beforeEach(() => { stores = memoryStores(); auth = createAuthHandler(stores); prof = createProfileHandler(stores); });

  it('signup sets a session cookie, moves guest data, and a duplicate email is refused', async () => {
    const r = await post(auth, { action: 'signup', email: 'A@b.co', password: 'password1', profile: newProfile() });
    expect(r.status).toBe(200);
    expect(r.body.data.user.email).toBe('a@b.co');
    expect(JSON.stringify(r.body)).not.toMatch(/password/i);
    expect(stores._p.size).toBe(1);
    expect((await post(auth, { action: 'signup', email: 'a@b.co', password: 'password1' }, null, '2.2.2.2')).status).toBe(409);
  });
  it('login gives one generic error for unknown email and wrong password', async () => {
    await post(auth, { action: 'signup', email: 'a@b.co', password: 'password1' });
    const wrong = await post(auth, { action: 'login', email: 'a@b.co', password: 'nope-nope' });
    const none = await post(auth, { action: 'login', email: 'x@b.co', password: 'password1' });
    expect(wrong.status).toBe(401);
    expect(wrong.body).toEqual(none.body);
    expect((await post(auth, { action: 'login', email: 'a@b.co', password: 'password1' })).status).toBe(200);
  });
  it('rate limits signup (5/hour/IP) and login (8 per email)', async () => {
    for (let i = 0; i < 5; i++) await post(auth, { action: 'signup', email: `u${i}@b.co`, password: 'password1' });
    expect((await post(auth, { action: 'signup', email: 'u9@b.co', password: 'password1' })).status).toBe(429);
    for (let i = 0; i < 8; i++) await post(auth, { action: 'login', email: 'u0@b.co', password: 'bad-bad-bad' }, null, '9.9.9.9');
    expect((await post(auth, { action: 'login', email: 'u0@b.co', password: 'password1' }, null, '9.9.9.9')).status).toBe(429);
  });
  it('profile needs a session, validates, saves and reads back; delete removes everything', async () => {
    expect((await post(prof, { action: 'get' })).status).toBe(401);
    const s = await post(auth, { action: 'signup', email: 'a@b.co', password: 'password1' });
    const cookie = cookieOf(s);
    expect((await post(prof, { action: 'get' }, cookie)).body.data.profile).toBeNull();
    expect((await post(prof, { action: 'put', profile: { bad: 1 } }, cookie)).status).toBe(400);
    expect((await post(prof, { action: 'put', profile: { ...newProfile(), junk: 'x'.repeat(210_000) } }, cookie)).status).toBe(413);
    expect((await post(prof, { action: 'put', profile: newProfile('cse', 3, 3.6) }, cookie)).status).toBe(200);
    expect((await post(prof, { action: 'get' }, cookie)).body.data.profile.goalCgpa).toBe(3.6);
    expect((await post(auth, { action: 'me' }, cookie)).body.data.user.email).toBe('a@b.co');
    expect((await post(auth, { action: 'deleteAccount' }, cookie)).status).toBe(200);
    expect(stores._p.size).toBe(0);
    expect((await post(prof, { action: 'get' }, cookie)).status).toBe(401);
    expect((await post(auth, { action: 'me' }, cookie)).body.data.user).toBeNull();
  });
});
