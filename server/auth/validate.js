import { AppError } from '../errors.js';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function readEmail(v) {
  const email = typeof v === 'string' ? v.trim().toLowerCase() : '';
  if (email.length > 254 || !EMAIL_RE.test(email)) throw new AppError('invalid_input', 'Please enter a valid email address.');
  return email;
}
// bcrypt only uses the first 72 bytes, so longer passwords are refused instead of silently cut.
export function readNewPassword(v) {
  if (typeof v !== 'string' || v.length < 8) throw new AppError('invalid_input', 'Password must be at least 8 characters.');
  if (Buffer.byteLength(v) > 72) throw new AppError('invalid_input', 'Password is too long (max 72 bytes).');
  return v;
}
export const readLoginPassword = (v) => (typeof v === 'string' && v.length > 0 && Buffer.byteLength(v) <= 72 ? v : '');
export function readDisplayName(v) {
  if (v == null || v === '') return undefined;
  const name = typeof v === 'string' ? v.trim() : '';
  if (!name || name.length > 60) throw new AppError('invalid_input', 'Name must be 1 to 60 characters.');
  return name;
}
