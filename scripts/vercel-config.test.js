import { describe, it, expect } from 'vitest';
import fs from 'node:fs';

// Vercel fails the whole build if a `functions` pattern matches no file in api/.
describe('vercel.json', () => {
  const cfg = JSON.parse(fs.readFileSync('vercel.json', 'utf8'));
  it('every functions entry matches a real file', () => {
    for (const pattern of Object.keys(cfg.functions ?? {})) expect(fs.existsSync(pattern), pattern).toBe(true);
  });
  it('keeps the SPA rewrite and stays within 4 api functions', () => {
    expect(cfg.rewrites[0].destination).toBe('/index.html');
    expect(fs.readdirSync('api').filter((f) => f.endsWith('.js')).length).toBeLessThanOrEqual(4);
  });
});
