import { AppError, fail, ok } from '../errors.js';
import { mongoStores } from '../db/stores.js';
import { hashPassword, verifyPassword, DUMMY_HASH } from '../auth/password.js';
import { signSession, verifySession, readCookie, sessionCookie, clearCookie } from '../auth/session.js';
import { checkRequest, limit } from '../auth/guards.js';
import { readEmail, readNewPassword, readLoginPassword, readDisplayName } from '../auth/validate.js';
import { validateProfile } from '../../src/engine/profile.js';

const HOUR = 3_600_000;
const MAX_PROFILE_BYTES = 200_000;
const publicUser = (u) => ({ email: u.email, ...(u.displayName && { displayName: u.displayName }) });

export function createAuthHandler(stores = mongoStores) {
  const { users, profiles, attempts } = stores;

  const startSession = async (user) => [sessionCookie(await signSession(user.id))];
  const currentUser = async (headers) => {
    const id = await verifySession(readCookie(headers.cookie));
    return id ? users.findById(id) : null;
  };

  const actions = {
    async signup({ body, ip }) {
      await limit(attempts, `signup:${ip}`, 5, HOUR);
      const email = readEmail(body.email);
      const password = readNewPassword(body.password);
      const displayName = readDisplayName(body.displayName);
      // Optional guest data to move into the new account; it must pass the same validation as a normal save.
      let seed = null;
      if (body.profile != null) {
        if (JSON.stringify(body.profile).length > MAX_PROFILE_BYTES || validateProfile(body.profile).length) throw new AppError('invalid_input', 'Guest data is not valid.');
        seed = body.profile;
      }
      let user;
      try { user = await users.create({ email, passwordHash: await hashPassword(password), displayName }); }
      catch (e) {
        if (e?.code === 11000) throw new AppError('email_taken', 'That email is already registered.', 409);
        throw e;
      }
      if (seed) await profiles.put(user.id, seed);
      return ok({ user: publicUser(user) }, await startSession(user));
    },
    async login({ body, ip }) {
      const email = readEmail(body.email);
      await limit(attempts, `login-ip:${ip}`, 30, 15 * 60_000);
      await limit(attempts, `login-email:${email}`, 8, 15 * 60_000);
      const password = readLoginPassword(body.password);
      const user = await users.findByEmail(email);
      const good = await verifyPassword(password, user?.passwordHash ?? DUMMY_HASH);
      // One generic message for unknown email and wrong password.
      if (!user || !good) throw new AppError('invalid_credentials', 'Wrong email or password.', 401);
      return ok({ user: publicUser(user) }, await startSession(user));
    },
    async logout() { return ok({ loggedOut: true }, [clearCookie()]); },
    async me({ headers }) {
      const user = await currentUser(headers);
      return ok({ user: user ? publicUser(user) : null }, user ? undefined : headers.cookie?.includes('lokkho_session') ? [clearCookie()] : undefined);
    },
    async deleteAccount({ headers }) {
      const user = await currentUser(headers);
      if (!user) throw new AppError('unauthorized', 'Please log in first.', 401);
      await profiles.remove(user.id);
      await users.remove(user.id);
      return ok({ deleted: true }, [clearCookie()]);
    },
  };

  return async function handleAuth({ method, body, headers = {}, ip }) {
    try {
      checkRequest({ method, headers });
      const run = Object.hasOwn(actions, body?.action) ? actions[body.action] : null;
      if (!run) throw new AppError('invalid_input', 'Unknown action.');
      return await run({ body, headers, ip });
    } catch (e) {
      return fail(e);
    }
  };
}
export const handleAuth = createAuthHandler();
