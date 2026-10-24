// One standard error shape for every route: { ok:false, error:{ code, message } }.
export class AppError extends Error {
  constructor(code, message, status = 400) {
    super(message);
    this.code = code;
    this.status = status;
  }
}
export const fail = (e) => {
  const err = e instanceof AppError ? e : new AppError('internal', 'Something went wrong on the server.', 500);
  // Log only the code, never user text or secrets.
  if (!(e instanceof AppError)) console.error('[server] unexpected error:', e?.name);
  return { status: err.status, body: { ok: false, error: { code: err.code, message: err.message } } };
};
export const ok = (data) => ({ status: 200, body: { ok: true, data } });
