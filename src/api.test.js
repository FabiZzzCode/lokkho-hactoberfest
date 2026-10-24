import { describe, it, expect, vi, afterEach } from 'vitest';
import { callApi } from './api.js';

afterEach(() => vi.restoreAllMocks());
describe('callApi', () => {
  it('maps an aborted request to code "timeout" and other failures to "network"', async () => {
    globalThis.fetch = vi.fn(async () => { throw Object.assign(new Error('x'), { name: 'AbortError' }); });
    expect((await callApi('ai', {})).error.code).toBe('timeout');
    globalThis.fetch = vi.fn(async () => { throw new TypeError('fail'); });
    expect((await callApi('ai', {})).error.code).toBe('network');
  });
  it('really aborts a hanging request after the timeout', async () => {
    globalThis.fetch = vi.fn((_u, { signal }) => new Promise((_r, reject) => signal.addEventListener('abort', () => reject(Object.assign(new Error('a'), { name: 'AbortError' })))));
    expect((await callApi('ai', {}, 20)).error.code).toBe('timeout');
  });
});
