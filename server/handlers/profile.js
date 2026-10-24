import { AppError, fail, ok } from '../errors.js';
import { mongoStores } from '../db/stores.js';
import { verifySession, readCookie } from '../auth/session.js';
import { checkRequest, limit } from '../auth/guards.js';
import { validateProfile } from '../../src/engine/profile.js';

const MAX_PROFILE_BYTES = 200_000;

export function createProfileHandler(stores = mongoStores) {
  const { users, profiles, attempts } = stores;
  return async function handleProfile({ method, body, headers = {} }) {
    try {
      checkRequest({ method, headers });
      const id = await verifySession(readCookie(headers.cookie));
      const user = id && await users.findById(id);
      if (!user) throw new AppError('unauthorized', 'Please log in first.', 401);
      switch (body?.action) {
        case 'get':
          return ok({ profile: await profiles.get(user.id) });
        case 'put': {
          await limit(attempts, `save:${user.id}`, 120, 60_000);
          if (JSON.stringify(body.profile ?? null).length > MAX_PROFILE_BYTES) throw new AppError('invalid_input', 'Profile is too large (max 200 KB).', 413);
          if (!body.profile || validateProfile(body.profile).length) throw new AppError('invalid_input', 'Profile data is not valid.');
          await profiles.put(user.id, body.profile);
          return ok({ saved: true });
        }
        default:
          throw new AppError('invalid_input', 'Unknown action.');
      }
    } catch (e) {
      return fail(e);
    }
  };
}
export const handleProfile = createProfileHandler();
