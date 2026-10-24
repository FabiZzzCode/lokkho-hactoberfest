// Single client for the backend. Always resolves to {ok, data} or {ok:false, error:{code,message}}.
export async function callApi(route, body, timeoutMs = 30_000) {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    const res = await fetch(`/api/${route}`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body), signal: ctrl.signal });
    return await res.json();
  } catch (e) {
    // The UI shows translated text for these two codes (see AiError); `message` is only a fallback.
    return e?.name === 'AbortError'
      ? { ok: false, error: { code: 'timeout', message: 'The request took too long.' } }
      : { ok: false, error: { code: 'network', message: 'Could not reach the server.' } };
  } finally {
    clearTimeout(timer);
  }
}
export const callAi = (action, payload) => callApi('ai', { action, ...payload });
export const callAgent = (payload) => callApi('agent', payload);
