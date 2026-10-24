// Single client for the backend. Always resolves to {ok, data} or {ok:false, error:{code,message}}.
export async function callApi(route, body, timeoutMs = 35_000) {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    const res = await fetch(`/api/${route}`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body), signal: ctrl.signal });
    return await res.json();
  } catch {
    return { ok: false, error: { code: 'network', message: 'Could not reach the server.' } };
  } finally {
    clearTimeout(timer);
  }
}
export const callAi = (action, payload) => callApi('ai', { action, ...payload });
export const callAgent = (payload) => callApi('agent', payload);
