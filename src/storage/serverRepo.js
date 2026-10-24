import { callApi } from '../api.js';

// Same interface as LocalStorageRepo, but the profile lives in the user's account (api/profile.js).
// save() resolves to true/false so the UI can show "Saved" or an error.
export const ServerRepo = {
  async load() {
    const r = await callApi('profile', { action: 'get' });
    return r.ok ? r.data.profile : null;
  },
  async save(profile) { return (await callApi('profile', { action: 'put', profile })).ok; },
  async remove() { /* the account owns the data; delete the account instead */ },
};
