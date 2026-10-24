import { AppError, fail, ok } from '../errors.js';
import { rateLimited } from '../rateLimit.js';
import { hashCode, mongoStore } from '../db/profileStore.js';
import { validateProfile } from '../../src/engine/profile.js';

const MAX_BYTES = 200_000;
const RATE_PER_MIN = 20;
// Long random codes only: short guessable ones would let strangers read data.
const CODE_RE = /^[A-Za-z0-9_-]{32,64}$/;

function readCode(code) {
  if (typeof code !== 'string' || !CODE_RE.test(code)) throw new AppError('invalid_input', 'Invalid profile code.');
  return hashCode(code);
}

export function createProfileHandler(store = mongoStore) {
  return async function handleProfile({ method, body, ip }) {
    try {
      if (rateLimited(`profile:${ip}`, RATE_PER_MIN)) throw new AppError('rate_limited', 'Too many requests. Please wait a minute.', 429);
      // POST-only with an "action" keeps the code out of URLs and logs.
      if (method !== 'POST') throw new AppError('method', 'Use POST.', 405);
      const id = readCode(body?.code);
      switch (body.action) {
        case 'load': {
          const profile = await store.get(id);
          if (!profile) throw new AppError('not_found', 'No data found for this code.', 404);
          return ok({ profile });
        }
        case 'save': {
          const size = JSON.stringify(body.profile ?? null).length;
          if (size > MAX_BYTES) throw new AppError('invalid_input', 'Profile is too large (max 200 KB).', 413);
          if (!body.profile || validateProfile(body.profile).length) throw new AppError('invalid_input', 'Profile data is not valid.');
          await store.put(id, body.profile);
          return ok({ saved: true });
        }
        case 'delete':
          await store.remove(id);
          return ok({ deleted: true });
        default:
          throw new AppError('invalid_input', 'Unknown action.');
      }
    } catch (e) {
      return fail(e);
    }
  };
}

export const handleProfile = createProfileHandler();
