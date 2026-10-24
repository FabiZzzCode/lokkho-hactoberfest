import { SignJWT, jwtVerify } from 'jose';

export const COOKIE = 'lokkho_session';
export const MAX_AGE_S = 7 * 24 * 60 * 60;

function key(secret = process.env.SESSION_SECRET) {
  if (!secret || secret.length < 32) throw new Error('SESSION_SECRET missing or shorter than 32 characters');
  return new TextEncoder().encode(secret);
}
export const signSession = (userId, secret) =>
  new SignJWT({}).setProtectedHeader({ alg: 'HS256' }).setSubject(userId).setIssuedAt().setExpirationTime(`${MAX_AGE_S}s`).sign(key(secret));

/** Returns the user id, or null for a missing, forged or expired token. */
export async function verifySession(token, secret) {
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, key(secret), { algorithms: ['HS256'] });
    return typeof payload.sub === 'string' ? payload.sub : null;
  } catch { return null; }
}

export const readCookie = (header, name = COOKIE) => {
  for (const part of String(header ?? '').split(';')) {
    const i = part.indexOf('=');
    if (i > 0 && part.slice(0, i).trim() === name) return decodeURIComponent(part.slice(i + 1).trim());
  }
  return null;
};
const secure = () => (process.env.VERCEL || process.env.NODE_ENV === 'production' ? '; Secure' : '');
export const sessionCookie = (token) => `${COOKIE}=${token}; HttpOnly; SameSite=Lax; Path=/; Max-Age=${MAX_AGE_S}${secure()}`;
export const clearCookie = () => `${COOKIE}=; HttpOnly; SameSite=Lax; Path=/; Max-Age=0${secure()}`;
