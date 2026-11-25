// Payroll secrets (owner SSN, EFTPS PIN, password, bank, owner DL).
// v20.1: PR_ENC_KEY is OPTIONAL. Without it values are stored as plain text (that is how sql/11 loads them).
// With it (32 random bytes base64), new values are stored "v1:" + base64(iv 12 | tag 16 | ciphertext) and both forms are read.
import crypto from 'node:crypto';
import { env, HttpError } from './core.mjs';

let _key;
function key() {
  if (_key) return _key;
  const raw = env('PR_ENC_KEY');
  if (!raw) return null;
  const k = Buffer.from(raw, 'base64');
  if (k.length !== 32) throw new HttpError(500, 'PR_ENC_KEY phải là 32 bytes base64 (openssl rand -base64 32)');
  _key = k;
  return k;
}
export const hasKey = () => !!key();

export function enc(plain) {
  const v = plain == null ? '' : String(plain).trim();
  if (!v) return null;
  const k = key();
  if (!k) return v; // no key set: stored as plain text (database is private; only Admin API reads it)
  const iv = crypto.randomBytes(12);
  const c = crypto.createCipheriv('aes-256-gcm', k, iv);
  const body = Buffer.concat([c.update(v, 'utf8'), c.final()]);
  return 'v1:' + Buffer.concat([iv, c.getAuthTag(), body]).toString('base64');
}

export function dec(stored) {
  if (!stored) return '';
  if (!String(stored).startsWith('v1:')) return String(stored); // plain text
  const k = key();
  if (!k) return '(cần PR_ENC_KEY)';
  try {
    const b = Buffer.from(String(stored).replace(/^v1:/, ''), 'base64');
    const d = crypto.createDecipheriv('aes-256-gcm', k, b.subarray(0, 12));
    d.setAuthTag(b.subarray(12, 28));
    return Buffer.concat([d.update(b.subarray(28)), d.final()]).toString('utf8');
  } catch {
    return '(không giải mã được)';
  }
}
