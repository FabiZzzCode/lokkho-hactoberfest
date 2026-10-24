// Turns a pure handler({method, body, query, ip}) into a Vercel-style (req, res) function.
export const toNodeHandler = (handler) => async (req, res) => {
  const ip = String(req.headers['x-forwarded-for'] ?? req.socket?.remoteAddress ?? 'unknown').split(',')[0].trim();
  const { status, body } = await handler({ method: req.method, body: req.body ?? {}, query: req.query ?? {}, ip });
  res.statusCode = status;
  res.setHeader('content-type', 'application/json');
  res.setHeader('cache-control', 'no-store');
  res.end(JSON.stringify(body));
};
