import { AppError } from '../errors.js';

/** State-changing requests must be JSON and come from our own site (CSRF defence on top of SameSite=Lax). */
export function checkRequest({ method, headers }) {
  if (method !== 'POST') throw new AppError('method', 'Use POST.', 405);
  if (!String(headers['content-type'] ?? '').toLowerCase().startsWith('application/json')) throw new AppError('invalid_input', 'Content-Type must be application/json.', 415);
  const origin = headers.origin;
  const host = headers['x-forwarded-host'] ?? headers.host;
  let originHost;
  try { originHost = new URL(origin).host; } catch { originHost = null; }
  if (!originHost || originHost !== host) throw new AppError('forbidden', 'Request origin not allowed.', 403);
}

/**
 * Fixed-window limiter backed by the `attempts` collection (shared by all serverless instances).
 * The store must provide hit(key, windowMs) -> count after this hit.
 */
export async function limit(attempts, key, max, windowMs) {
  const count = await attempts.hit(key, windowMs);
  if (count > max) throw new AppError('rate_limited', 'Too many attempts. Please wait and try again.', 429);
}
