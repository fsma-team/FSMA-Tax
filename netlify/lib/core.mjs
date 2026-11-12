// Core helpers: database, sessions, HTTP responses, small utils.
import postgres from 'postgres';
import crypto from 'node:crypto';

export const env = (k) => (globalThis.Netlify?.env?.get?.(k)) ?? process.env[k];

// ---------- Database ----------
let _sql;
export function db() {
  if (!_sql) {
    const url = env('DATABASE_URL');
    if (!url) throw new HttpError(500, 'DATABASE_URL is not set');
    _sql = postgres(url, {
      prepare: false,                 // required for Supabase transaction pooler (port 6543)
      max: 3,
      idle_timeout: 20,
      connect_timeout: 15,
      ssl: env('PGSSL') === 'disable' ? false : 'require',
      types: { date: { to: 1082, from: [1082], serialize: (x) => x, parse: (x) => x } }, // keep dates as 'YYYY-MM-DD'
    });
  }
  return _sql;
}

// ---------- Errors / responses ----------
export class HttpError extends Error {
  constructor(status, message, extra) { super(message); this.status = status; this.extra = extra; }
}
export function json(data, status = 200, headers = {}) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store', ...headers },
  });
}

// ---------- Sessions ----------
export const COOKIE = 'tax_sess';
const IDLE_MIN = 45;      // log out after 45 min without activity
const MAX_HOURS = 12;     // and always after 12 hours

export const sha256 = (s) => crypto.createHash('sha256').update(s).digest('hex');
export const newToken = () => crypto.randomBytes(32).toString('base64url');

export function cookieHeader(token, maxAgeSec) {
  const secure = env('INSECURE_COOKIE') === '1' ? '' : ' Secure;';
  return `${COOKIE}=${token}; Path=/; HttpOnly;${secure} SameSite=Strict; Max-Age=${maxAgeSec}`;
}

export async function createSession(userId) {
  const token = newToken();
  await db()`insert into sessions (token_hash, user_id, expires_at)
             values (${sha256(token)}, ${userId}, now() + ${MAX_HOURS + ' hours'}::interval)`;
  return { token, maxAge: MAX_HOURS * 3600 };
}

function readCookie(req) {
  const c = req.headers.get('cookie') || '';
  const m = c.match(new RegExp('(?:^|;\\s*)' + COOKIE + '=([^;]+)'));
  return m ? m[1] : null;
}

// Returns the logged-in user or throws 401.
export async function requireUser(req) {
  const token = readCookie(req);
  if (!token) throw new HttpError(401, 'Not logged in');
  const h = sha256(token);
  const rows = await db()`
    with s as (
      update sessions set last_seen = now()
      where token_hash = ${h} and expires_at > now()
        and last_seen > now() - ${IDLE_MIN + ' minutes'}::interval
      returning user_id
    )
    select u.id, u.username, u.full_name, u.display_name, u.role, u.tab_id, u.active, u.must_change, u.appt_font, u.theme, u.food, u.zodiac
    from s join users u on u.id = s.user_id`;
  const u = rows[0];
  if (!u || !u.active) throw new HttpError(401, 'Session expired - please log in again');
  u.token_hash = h;
  return u;
}

export function requireAdmin(user) {
  if (user.role !== 'admin') throw new HttpError(403, 'Only Admin can do this');
}

// ---------- names without accents ----------
export const nameKey = (v) => String(v || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[đĐ]/g, 'd').replace(/\s+/g, ' ').trim().toLowerCase();

// ---------- small utils ----------
export const s = (v, max = 500) => {
  if (v === null || v === undefined) return null;
  const t = String(v).trim();
  return t === '' ? null : t.slice(0, max);
};
export const isoDate = (v) => {
  const t = s(v, 20);
  if (!t) return null;
  if (/^\d{4}-\d{2}-\d{2}$/.test(t)) {
    const d = new Date(t + 'T00:00:00Z');
    if (Number.isNaN(d.getTime()) || d.toISOString().slice(0, 10) !== t) throw new HttpError(400, `Bad date: ${t}`);
    return t;
  }
  throw new HttpError(400, `Bad date: ${t}`);
};
export const num = (v, { min = -1e7, max = 1e7 } = {}) => {
  if (v === null || v === undefined || v === '') return 0;
  const n = Number(v);
  if (!Number.isFinite(n) || n < min || n > max) throw new HttpError(400, `Bad number: ${v}`);
  return Math.round(n * 100) / 100;
};
export const bool = (v) => v === true || v === 'true' || v === 1 || v === '1' || v === 'on';
export const todayLA = () => new Date().toLocaleDateString('en-CA', { timeZone: 'America/Los_Angeles' });
export const hhmm = (m) => String(Math.floor(m / 60)).padStart(2, '0') + ':' + String(m % 60).padStart(2, '0');
export const toMin = (t) => { const p = String(t).split(':'); return Number(p[0]) * 60 + Number(p[1]); };
