// Best-effort per-IP limit. Serverless instances do not share memory, so this only slows abuse.
const hits = new Map();
export function rateLimited(key, max, windowMs = 60_000) {
  const now = Date.now();
  const list = (hits.get(key) ?? []).filter((t) => now - t < windowMs);
  list.push(now);
  hits.set(key, list);
  if (hits.size > 5000) hits.clear();
  return list.length > max;
}
