// AES-256-GCM for payroll secrets (owner SSN, EFTPS PIN, password, bank, owner DL).
// Key: env PR_ENC_KEY = 32 random bytes in base64 (openssl rand -base64 32). Keep 2 copies outside Netlify/GitHub.
// Stored format: "v1:" + base64(iv 12 | tag 16 | ciphertext)
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
  if (!k) throw new HttpError(500, 'Chưa đặt PR_ENC_KEY trên Netlify (xem addendum-v20.md)');
  const iv = crypto.randomBytes(12);
  const c = crypto.createCipheriv('aes-256-gcm', k, iv);
  const body = Buffer.concat([c.update(v, 'utf8'), c.final()]);
  return 'v1:' + Buffer.concat([iv, c.getAuthTag(), body]).toString('base64');
}

export function dec(stored) {
  if (!stored) return '';
  const k = key();
  if (!k) return '';
  try {
    const b = Buffer.from(String(stored).replace(/^v1:/, ''), 'base64');
    const d = crypto.createDecipheriv('aes-256-gcm', k, b.subarray(0, 12));
    d.setAuthTag(b.subarray(12, 28));
    return Buffer.concat([d.update(b.subarray(28)), d.final()]).toString('utf8');
  } catch {
    return '(không giải mã được)';
  }
}
