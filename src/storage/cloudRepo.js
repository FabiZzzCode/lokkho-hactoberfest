// Cloud copy of the profile through api/profile.js. The browser keeps only the random code.
const CODE_KEY = 'lokkho.cloudCode';

export const newCode = () => {
  const bytes = crypto.getRandomValues(new Uint8Array(24));
  return btoa(String.fromCharCode(...bytes)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
};
export const getCode = () => { try { return localStorage.getItem(CODE_KEY); } catch { return null; } };
export const setCode = (c) => { try { c ? localStorage.setItem(CODE_KEY, c) : localStorage.removeItem(CODE_KEY); } catch { /* storage blocked */ } };

async function call(action, code, extra = {}) {
  let res;
  try {
    res = await fetch('/api/profile', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ action, code, ...extra }) });
  } catch { return { ok: false, error: { code: 'network', message: 'No connection.' } }; }
  try { return await res.json(); } catch { return { ok: false, error: { code: 'internal', message: 'Bad server answer.' } }; }
}
export const CloudRepo = {
  load: (code) => call('load', code),
  save: (code, profile) => call('save', code, { profile }),
  remove: (code) => call('delete', code),
};
