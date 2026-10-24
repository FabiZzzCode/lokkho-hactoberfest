// Single client for the backend. Always resolves to {ok, data} or {ok:false, error:{code,message}}.
export async function callApi(route, body) {
  try {
    const res = await fetch(`/api/${route}`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body) });
    return await res.json();
  } catch {
    return { ok: false, error: { code: 'network', message: 'Could not reach the server.' } };
  }
}
export const callAi = (action, payload) => callApi('ai', { action, ...payload });
