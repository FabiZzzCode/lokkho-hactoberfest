// Turns a pure handler({method, body, headers, ip}) into a Vercel-style (req, res) function.
// A handler may also return `cookies` (Set-Cookie strings).
export const toNodeHandler = (handler) => async (req, res) => {
  const ip = String(req.headers['x-forwarded-for'] ?? req.socket?.remoteAddress ?? 'unknown').split(',')[0].trim();
  const { status, body, cookies } = await handler({ method: req.method, body: req.body ?? {}, headers: req.headers ?? {}, ip });
  res.statusCode = status;
  res.setHeader('content-type', 'application/json');
  res.setHeader('cache-control', 'no-store');
  if (cookies?.length) res.setHeader('set-cookie', cookies);
  res.end(JSON.stringify(body));
};
