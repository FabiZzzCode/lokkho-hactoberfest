import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import en from './en.json';
import bn from './bn.json';

const files = (dir) => fs.readdirSync(dir, { withFileTypes: true }).flatMap((e) => (e.isDirectory() ? files(path.join(dir, e.name)) : [path.join(dir, e.name)]));
const src = files('src').filter((f) => f.endsWith('.jsx')).map((f) => fs.readFileSync(f, 'utf8')).join('\n');
const used = new Set([...src.matchAll(/\bt\('([a-zA-Z.]+)'/g)].map((m) => m[1]));
const prefixes = [...src.matchAll(/\bt\(`([a-zA-Z.]+)\$\{/g)].map((m) => m[1]);

describe('i18n', () => {
  it('every static key exists in English and Bangla', () => {
    for (const k of used) { expect(en[k], `en ${k}`).toBeTruthy(); expect(bn[k], `bn ${k}`).toBeTruthy(); }
  });
  it('every dynamic key prefix has entries', () => {
    for (const p of prefixes) expect(Object.keys(en).some((k) => k.startsWith(p)), p).toBe(true);
  });
  it('both files have identical keys', () => expect(Object.keys(bn).sort()).toEqual(Object.keys(en).sort()));
});
