// tax.fsma.team - single API function. Every request goes to /api/...
import bcrypt from 'bcryptjs';
import {
  db, json, HttpError, requireUser, requireAdmin, createSession, cookieHeader, env,
  s, isoDate, num, bool, nameKey, todayLA, hhmm, toMin,
} from '../lib/core.mjs';
import { smsCfg, checkSms, fill, fmtDay, fmtDayLong, fmtHour, linkOf, linkData, newBookToken, laNow, inSeason, queueSms, sendOne, sendAtFor, shortName, siteUrl } from '../lib/sms.mjs';

const STATUS = ['', 'E-file', 'Accepted', 'Rejected', 'Hold', 'Paper Mailed', 'Refund'];
const METHODS = ['Cash', 'Check', 'Zelle', 'Venmo'];
const COLORS = ['Rose', 'Blue', 'Sunshine', 'Green', 'Orange', 'Purple', 'Teal', 'Pink'];
const FONTS = ['Pacifico', 'Lobster', 'Comfortaa', 'Montserrat', 'Nunito', 'Oswald', 'Gloria Hallelujah', 'Quicksand'];
const APPT_FONTS = ['Default', 'Nunito', 'Quicksand', 'Montserrat', 'Comfortaa'];
const THEMES = ['simple', 'genz', 'pro', 'autumn', 'rain', 'amazon', 'hawaii', 'snack', 'chill', 'city'];
const FOODS = ['boba', 'trabb', 'che', 'cavien', 'bovien', 'bttron', 'btcuon', 'bunbo', 'sbux', 'matcha', 'bacxiu'];
const ZODIACS = ['aries', 'taurus', 'gemini', 'cancer', 'leo', 'virgo', 'libra', 'scorpio', 'sagittarius', 'capricorn', 'aquarius', 'pisces'];
const MOODS = ['😎', '☕', '🥱', '🤯', '🥳'];
const CALS = ['Office', 'Daniel', 'Peter'];
const TEMP_PW = '12345';
const DUMMY_HASH = '$2a$10$c5w3A/iP.Nz2R0t0kPqxZ.ePVDX4qlS0yi0wvUulgrpcYeICZUreG';

// ---------- v18: make sure the v17 / v18 columns and tables exist ----------
// The "Server error" when saving a booking happens when sql/07-v17.sql was not run (bookings.token missing).
// On the first request of each server instance we check, and add whatever is missing (safe to repeat).
const SCHEMA_SQL = `-- 07-v17.sql : v17 (Top producers, Lock day, text cho khách, trang xem hẹn).
-- Chạy 1 lần trong Supabase SQL Editor (chạy lại lần 2 cũng không sao).

-- Tên ngắn của tab (hiện ở Top producers và thanh dưới trên phone). Trống = dùng tên tab.
alter table staff_tabs add column if not exists short_name text not null default '';
update staff_tabs set short_name = 'Ngọcs' where name = 'Ngọc' and short_name = '';

-- Cash cuối ngày: Lock day. snap = số đã chốt lúc Lock (để phần sửa sau đó dời qua ngày sau).
create table if not exists cash_locks (
  day       date primary key,
  locked_at timestamptz not null default now(),
  locked_by text,
  snap      jsonb not null default '{}'::jsonb
);
alter table cash_locks enable row level security;

-- Hẹn: mã link cho khách + có gửi text hay không
alter table bookings add column if not exists token text;
alter table bookings add column if not exists sms boolean not null default true;
create unique index if not exists bookings_token_uq on bookings(token) where token is not null;

-- Trang khách xem hẹn (tax.fsma.team/b/<mã>): giữ lại cả khi hẹn đã hủy
create table if not exists booking_links (
  token      text primary key,
  data       jsonb not null,
  status     text not null default 'ok',          -- ok | updated | cancelled
  appt_at    timestamptz,                          -- giờ hẹn (để nhắc + hết hạn)
  updated_at timestamptz not null default now()
);
alter table booking_links enable row level security;

-- Tin nhắn đã / sẽ gửi
create table if not exists sms_log (
  id          bigserial primary key,
  token       text,
  kind        text not null,                       -- created | updated | cancelled | reminder | test
  ref         text not null default '',            -- reminder: "1440@2027-02-03 10:00" (không gửi trùng)
  to_phone    text not null,
  body        text not null,
  send_at     timestamptz not null default now(),
  status      text not null default 'queued',      -- queued | sent | failed | demo | skipped
  tries       int  not null default 0,
  error       text,
  provider_id text,
  created_by  text,
  created_at  timestamptz not null default now(),
  sent_at     timestamptz
);
create unique index if not exists sms_log_ref_uq on sms_log(token, kind, ref) where kind = 'reminder';
create index if not exists sms_log_queue_idx on sms_log(status, send_at);
create index if not exists sms_log_token_idx on sms_log(token);
alter table sms_log enable row level security;

-- Cài đặt tin nhắn mặc định (Admin sửa ở Settings > Customer messages). Mặc định TẮT.
insert into settings (key, value) values ('sms', '{
  "on": false,
  "from": "02-01", "to": "04-15",
  "quiet": ["08:00", "21:00"],
  "business": "First Source",
  "phone": "714-640-6654",
  "email": "contact@fsma.team",
  "address": "9741 Bolsa Avenue Suite 217, Westminster CA 92683",
  "bring": "Photo ID, Social Security cards, W-2 / 1099 forms, last year''s tax return.",
  "created":   {"on": true, "text": "Your booking at {{ business }} is scheduled for {{ date }} at {{ hour }}. Manage it at {{ link }}"},
  "updated":   {"on": true, "text": "Your booking at {{ business }} was updated: {{ link }}"},
  "cancelled": {"on": true, "text": "Your {{ business }} booking was cancelled. Hope to see you another day."},
  "reminder":  {"on": true, "text": "Just a reminder that your {{ business }} booking is on {{ date }} at {{ hour }}. Manage it at {{ link }}", "before": [1440, 60]}
}'::jsonb) on conflict (key) do nothing;

-- Giờ hẹn được đặt / dời lần cuối (để không gửi "nhắc" ngay sau khi vừa đặt hẹn sát giờ)
alter table bookings add column if not exists sched_at timestamptz not null default now();

-- 08-v18.sql : v18 (hình đại diện cho tab nhân viên).
-- Không bắt buộc chạy: server tự thêm các cột / bảng này lần đầu chạy (và tự thêm phần của 07-v17.sql nếu còn thiếu).
-- Chạy tay trong Supabase SQL Editor cũng được (chạy lại lần 2 cũng không sao).

alter table staff_tabs add column if not exists avatar_kind  text not null default '';   -- '' = chữ cái | emo | img
alter table staff_tabs add column if not exists avatar_emoji text not null default '';
alter table staff_tabs add column if not exists avatar_ver   int  not null default 0;

create table if not exists tab_avatars (
  tab_id     int primary key references staff_tabs(id) on delete cascade,
  mime       text not null,
  data       bytea not null,
  updated_at timestamptz not null default now()
);
alter table tab_avatars enable row level security;
`;
const SCHEMA_V19 = `-- 09-v19.sql : v19 (theme từng người, món ruột, cung hoàng đạo, hẹn Business, bảng dán giấy, Trưa nay ăn gì).
-- Không bắt buộc chạy: server tự thêm lần đầu chạy. Chạy tay trong Supabase SQL Editor cũng được (chạy lại không sao).

alter table users add column if not exists theme  text not null default 'simple';
alter table users add column if not exists food   text not null default '';
alter table users add column if not exists zodiac text not null default '';

alter table bookings add column if not exists biz boolean not null default false;

-- Bảng dán giấy trên Homepage (tự ẩn sau 3 ngày)
create table if not exists home_notes (
  id         bigserial primary key,
  user_id    int references users(id) on delete set null,
  user_name  text not null,
  body       text not null,
  hearts     int[] not null default '{}',
  created_at timestamptz not null default now()
);
create index if not exists home_notes_created_idx on home_notes(created_at);
alter table home_notes enable row level security;

-- Trưa nay ăn gì + mood hôm nay (mỗi người 1 phiếu / ngày)
create table if not exists home_votes (
  day     date not null,
  user_id int  not null references users(id) on delete cascade,
  kind    text not null check (kind in ('lunch','mood')),
  choice  text not null,
  primary key (day, user_id, kind)
);
alter table home_votes enable row level security;

insert into settings (key, value) values ('lunch', '["🍜 Phở","🥖 Bánh mì","🍚 Cơm tấm","🍕 Pizza"]'::jsonb) on conflict (key) do nothing;
`;
let _schema = null;
function ensureSchema() {
  if (!_schema) _schema = (async () => {
    const sql = db();
    const cols = await sql`select table_name, column_name from information_schema.columns
      where table_schema = current_schema() and table_name in ('bookings','staff_tabs','users')`;
    const tabs = await sql`select table_name from information_schema.tables
      where table_schema = current_schema() and table_name in ('cash_locks','booking_links','sms_log','tab_avatars','home_notes','home_votes')`;
    const has = (t, c) => cols.some((r) => r.table_name === t && r.column_name === c);
    const ok = ['token', 'sms', 'sched_at'].every((c) => has('bookings', c))
      && ['short_name', 'avatar_kind', 'avatar_emoji', 'avatar_ver'].every((c) => has('staff_tabs', c))
      && ['cash_locks', 'booking_links', 'sms_log', 'tab_avatars'].every((t) => tabs.some((r) => r.table_name === t));
    if (!ok) { console.log('schema: adding v17 / v18 columns'); await sql.unsafe(SCHEMA_SQL); }
    const ok19 = ['theme', 'food', 'zodiac'].every((c) => has('users', c)) && has('bookings', 'biz')
      && ['home_notes', 'home_votes'].every((t) => tabs.some((r) => r.table_name === t));
    if (!ok19) { console.log('schema: adding v19 columns'); await sql.unsafe(SCHEMA_V19); }
  })().catch((e) => { console.error('schema', e); _schema = null; });
  return _schema;
}

// ---------- auth ----------
async function login(req) {
  const body = await req.json().catch(() => ({}));
  const username = s(body.username, 40) || '';
  const password = String(body.password || '');
  const sql = db();
  const [u] = await sql`select * from users where lower(username)=lower(${username})`;
  if (!u || !u.active) {
    await bcrypt.compare(password, DUMMY_HASH);
    throw new HttpError(401, 'Wrong username or password');
  }
  const isAdm = u.role === 'admin';
  if (!isAdm && u.lock_until && new Date(u.lock_until) > new Date()) {
    const t = new Date(u.lock_until).toLocaleTimeString('en-US', { timeZone: 'America/Los_Angeles', hour: 'numeric', minute: '2-digit' });
    throw new HttpError(423, `Too many wrong tries. Locked until ${t}. An admin can unlock it.`);
  }
  const ok = await bcrypt.compare(password, u.pw_hash);
  if (!ok && isAdm) {
    // v18: an admin is never locked out. Slow down each wrong try instead and keep a record.
    await new Promise((r) => setTimeout(r, 1500));
    await sql`insert into activity_log (user_name, tab_name, kind, text) values (${u.display_name}, '', 'login', 'Admin gõ sai mật khẩu')`.catch(() => {});
    throw new HttpError(401, 'Wrong username or password');
  }
  if (!ok) {
    // atomic: 5 wrong = lock 15 min, then 30, 60 ... up to 24h
    const [r] = await sql`update users set
        failed_count = case when failed_count + 1 >= 5 then 0 else failed_count + 1 end,
        lock_until = case when failed_count + 1 >= 5 then now() + least(15 * power(2, lock_level), 1440) * interval '1 minute' else lock_until end,
        lock_level = case when failed_count + 1 >= 5 then least(lock_level + 1, 7) else lock_level end
      where id=${u.id} returning failed_count`;
    if (r.failed_count === 0) throw new HttpError(423, 'Too many wrong tries. Account locked for a while. An admin can unlock it.');
    throw new HttpError(401, `Wrong username or password (${5 - r.failed_count} tries left)`);
  }
  await sql`update users set failed_count=0, lock_level=0, lock_until=null, last_login_at=now() where id=${u.id}`;
  await sql`delete from sessions where expires_at < now() or last_seen < now() - interval '1 day'`;
  const sess = await createSession(u.id);
  return json({ ok: true }, 200, { 'set-cookie': cookieHeader(sess.token, sess.maxAge) });
}

async function health() {
  const out = { DATABASE_URL: !!env('DATABASE_URL') };
  try {
    const [r] = await db()`select (select count(*)::int from users) as users, (select count(*)::int from staff_tabs) as tabs, (select count(*)::int from records_clients) as records`;
    out.database = 'connected'; out.users = r.users; out.tabs = r.tabs; out.records_clients = r.records;
  } catch (e) { out.database = 'ERROR: ' + String(e.message || e).replace(/postgres(ql)?:\/\/[^\s]+/g, '[url]').slice(0, 200); }
  return json(out);
}

const meOut = (u) => ({ id: u.id, username: u.username, full_name: u.full_name, display_name: u.display_name, role: u.role, tab_id: u.tab_id, must_change: u.must_change, appt_font: u.appt_font, theme: u.theme || 'simple', food: u.food || '', zodiac: u.zodiac || '' });

async function changePassword(user, body) {
  const sql = db();
  const [u] = await sql`select pw_hash from users where id=${user.id}`;
  if (!(await bcrypt.compare(String(body.old || ''), u.pw_hash))) throw new HttpError(400, 'Current password is wrong');
  const nw = String(body.new || '');
  if (nw.length < 8) throw new HttpError(400, 'New password must be at least 8 characters');
  if (nw === TEMP_PW || nw === String(body.old || '')) throw new HttpError(400, 'Choose a different password');
  const h = await bcrypt.hash(nw, 10);
  await sql`update users set pw_hash=${h}, must_change=false where id=${user.id}`;
  await sql`delete from sessions where user_id=${user.id} and token_hash<>${user.token_hash}`;
  return { ok: true };
}

// ---------- settings ----------
async function getSettings(sql) {
  const rows = await sql`select key, value from settings`;
  const o = {}; rows.forEach((r) => { o[r.key] = r.value; });
  return o;
}
const HHMM = /^\d{2}:\d{2}$/;
function checkSetting(key, v) {
  if (key === 'notice') { if (typeof v !== 'string' || v.length > 500) throw new HttpError(400, 'Bad notice'); return v; }
  if (key === 'season_year') { const n = Number(v); if (!Number.isInteger(n) || n < 2000 || n > 2100) throw new HttpError(400, 'Bad year'); return n; }
  if (key === 'retirement') {
    if (!Array.isArray(v) || v.length > 20) throw new HttpError(400, 'Bad list');
    return v.map((x) => [String(x?.[0] ?? '').slice(0, 60), String(x?.[1] ?? '').slice(0, 60)]);
  }
  if (key === 'email_formats') {
    if (!v || typeof v !== 'object' || Array.isArray(v)) throw new HttpError(400, 'Bad formats');
    const o = {};
    for (const k of Object.keys(v).slice(0, 20)) o[k.slice(0, 40)] = String(v[k] ?? '').slice(0, 4000);
    return o;
  }
  if (key === 'prep_list') {
    if (!Array.isArray(v) || v.length > 30) throw new HttpError(400, 'Bad list');
    return v.map((x) => String(x).trim().slice(0, 40)).filter(Boolean);
  }
  if (key === 'hours') {
    const o = {};
    for (let i = 0; i < 7; i++) {
      const h = v?.[i] ?? v?.[String(i)] ?? null;
      if (h === null) { o[i] = null; continue; }
      if (!Array.isArray(h) || !HHMM.test(h[0]) || !HHMM.test(h[1])) throw new HttpError(400, 'Bad hours');
      o[i] = [h[0], h[1]];
    }
    return o;
  }
  if (key === 'sms') return checkSms(v);
  if (key === 'lunch') {
    if (!Array.isArray(v) || v.length > 8) throw new HttpError(400, 'Bad list');
    return v.map((x) => String(x).trim().slice(0, 40)).filter(Boolean);
  }
  if (key === 'self_keep') {
    if (!Array.isArray(v) || v.length > 20) throw new HttpError(400, 'Bad list');
    return v.map((x) => String(x).trim().slice(0, 40)).filter(Boolean);
  }
  if (key === 'cal') {
    const o = {};
    for (const c of CALS) {
      const x = v?.[c];
      if (!x || !HHMM.test(x.start) || !HHMM.test(x.last) || ![30, 60].includes(Number(x.step))) throw new HttpError(400, 'Bad calendar settings');
      if (toMin(x.last) < toMin(x.start)) throw new HttpError(400, 'Last appointment is before first slot');
      o[c] = { start: x.start, last: x.last, step: Number(x.step) };
    }
    return o;
  }
  throw new HttpError(400, 'Unknown setting');
}

// ---------- rows ----------
const rowOut = (r) => ({
  id: Number(r.id), tab: r.tab_id, pos: r.pos, date: r.work_date || '', status: r.status, name: r.name, ssn: r.ssn,
  amt: Number(r.amount), method: r.method, online: r.online, esign: r.esign, paid: r.paid, paidDate: r.paid_date || '',
  note: r.note, tip: Number(r.tip),
});
const LABEL = { date: 'Date', status: 'Status', name: 'Name', ssn: 'SSN', amt: 'Tiền', method: 'Method', online: 'Online', esign: 'E-sign', paid: 'Paid', note: 'Notes', tip: 'Tips' };
const PARSE = {
  date: (v) => isoDate(v),
  status: (v) => { const t = String(v ?? ''); if (!STATUS.includes(t)) throw new HttpError(400, 'Bad status'); return t; },
  name: (v) => String(v ?? '').trim().replace(/\s+/g, ' ').slice(0, 120),
  ssn: (v) => { const t = String(v ?? '').trim(); if (!/^\d{0,4}$/.test(t)) throw new HttpError(400, 'SSN: only the last 4 digits'); return t; },
  amt: (v) => num(v, { min: -100000, max: 100000 }),
  method: (v) => { const t = String(v ?? 'Cash'); if (!METHODS.includes(t)) throw new HttpError(400, 'Bad method'); return t; },
  online: bool, esign: bool, paid: bool,
  note: (v) => String(v ?? '').slice(0, 300),
  tip: (v) => num(v, { min: 0, max: 100000 }),
};
const fmtVal = (f, v) => (v === true ? '✓' : v === false ? '✗' : (v === '' || v === null || v === undefined) ? '(trống)' : f === 'date' ? mdy(v) : String(v));
const mdy = (d) => { const p = String(d).split('-'); return p.length === 3 ? `${p[1]}/${p[2]}/${p[0]}` : d; };
const money = (n) => (n < 0 ? '-' : '') + '$' + Math.abs(n).toLocaleString('en-US');

function canEditTab(user, tabId) { return user.role === 'admin' || user.tab_id === tabId; }

async function tabInfo(sql, id) {
  const [t] = await sql`select id, name, sheet_len from staff_tabs where id=${id} and deleted_at is null`;
  if (!t) throw new HttpError(404, 'Tab not found');
  return t;
}

function applyFields(base, fields) {
  const out = { ...base };
  for (const [k, v] of Object.entries(fields || {})) {
    if (!PARSE[k]) continue;
    out[k] = PARSE[k](v);
  }
  if (!out.online) { out.esign = false; out.paid = false; out.paidDate = ''; }
  return out;
}

async function createRow(user, body) {
  const sql = db();
  const tabId = Number(body.tab_id), pos = Number(body.pos);
  if (!Number.isInteger(tabId) || !Number.isInteger(pos) || pos < 0 || pos > 100000) throw new HttpError(400, 'Bad row position');
  await tabInfo(sql, tabId);
  if (!canEditTab(user, tabId)) throw new HttpError(403, 'You can only edit your own tab');
  const base = { date: '', status: '', name: '', ssn: '', amt: 0, method: 'Cash', online: false, esign: false, paid: false, paidDate: '', note: '', tip: 0 };
  const r = applyFields(base, body.fields);
  if (r.paid) r.paidDate = todayLA();
  try {
    const [row] = await sql`insert into rows (tab_id,pos,work_date,status,name,name_key,ssn,amount,method,online,esign,paid,paid_date,note,tip,updated_by)
      values (${tabId},${pos},${r.date || null},${r.status},${r.name},${nameKey(r.name)},${r.ssn},${r.amt},${r.method},${r.online},${r.esign},${r.paid},${r.paidDate || null},${r.note},${r.tip},${user.display_name})
      returning *`;
    return rowOut(row);
  } catch (e) {
    if (e.code === '23505') throw new HttpError(409, 'Dòng này vừa có người nhập. Đang tải lại.');
    throw e;
  }
}

async function updateRow(user, id, body) {
  const sql = db();
  return sql.begin(async (t) => {
    const [old] = await t`select r.*, st.name as tab_name from rows r join staff_tabs st on st.id=r.tab_id where r.id=${id} for update of r`;
    if (!old || old.deleted_at) throw new HttpError(404, 'Row not found');
    if (!canEditTab(user, old.tab_id)) throw new HttpError(403, 'You can only edit your own tab');
    const cur = rowOut(old);
    const fields = body.fields || (body.f ? { [body.f]: body.v } : {});
    const nw = applyFields(cur, fields);
    if (nw.paid !== cur.paid) nw.paidDate = nw.paid ? todayLA() : '';
    const changed = Object.keys(LABEL).filter((k) => nw[k] !== cur[k]);
    if (!changed.length) return cur;
    const [row] = await t`update rows set work_date=${nw.date || null}, status=${nw.status}, name=${nw.name}, name_key=${nameKey(nw.name)}, ssn=${nw.ssn},
        amount=${nw.amt}, method=${nw.method}, online=${nw.online}, esign=${nw.esign}, paid=${nw.paid}, paid_date=${nw.paidDate || null},
        note=${nw.note}, tip=${nw.tip}, updated_at=now(), updated_by=${user.display_name} where id=${id} returning *`;
    if (old.status === 'Accepted') {
      for (const k of changed) {
        await t`insert into activity_log (user_name, tab_name, kind, text, row_id) values (${user.display_name}, ${old.tab_name}, 'edit',
          ${`${cur.name || '(trống)'} (Accepted) · ${LABEL[k]}: ${fmtVal(k, cur[k])} → ${fmtVal(k, nw[k])}`}, ${id})`;
      }
    }
    return rowOut(row);
  });
}

async function deleteRow(user, id) {
  const sql = db();
  return sql.begin(async (t) => {
    const [old] = await t`select r.*, st.name as tab_name from rows r join staff_tabs st on st.id=r.tab_id where r.id=${id} for update of r`;
    if (!old || old.deleted_at) throw new HttpError(404, 'Row not found');
    if (!canEditTab(user, old.tab_id)) throw new HttpError(403, 'You can only edit your own tab');
    await t`update rows set deleted_at=now(), updated_at=now(), updated_by=${user.display_name} where id=${id}`;
    // only files already Accepted are logged (Admin can restore them); others are simply removed
    if (old.status === 'Accepted') {
      const snap = rowOut(old);
      await t`insert into activity_log (user_name, tab_name, kind, text, row_id, snapshot) values (${user.display_name}, ${old.tab_name}, 'delete',
        ${`${snap.name || '(trống)'} · ${snap.status || '—'} · ${money(snap.amt)} · ${snap.date ? mdy(snap.date) : ''}`}, ${id}, ${t.json(snap)})`;
    }
    return { ok: true };
  });
}

async function restoreRow(user, logId) {
  const sql = db();
  return sql.begin(async (t) => {
    const [l] = await t`select * from activity_log where id=${logId} and kind='delete' for update`;
    if (!l || !l.snapshot || l.snapshot.restored) throw new HttpError(404, 'Nothing to restore');
    const id = l.snapshot.id;
    const [r] = await t`select * from rows where id=${id} for update`;
    if (!r || !r.deleted_at) throw new HttpError(400, 'This row is already back');
    const [clash] = await t`select 1 as x from rows where tab_id=${r.tab_id} and pos=${r.pos} and deleted_at is null`;
    if (clash) {
      const [{ p }] = await t`select coalesce(max(pos),-1)+1 as p from rows where tab_id=${r.tab_id} and deleted_at is null`;
      await t`update rows set deleted_at=null, pos=${p}, updated_at=now() where id=${id}`;
    } else {
      await t`update rows set deleted_at=null, updated_at=now() where id=${id}`;
    }
    await t`update activity_log set snapshot = snapshot || '{"restored":true}'::jsonb where id=${logId}`;
    await t`insert into activity_log (user_name, tab_name, kind, text, row_id) values (${user.display_name}, ${l.tab_name}, 'restore', ${'Khôi phục hồ sơ: ' + (l.snapshot.name || '(trống)')}, ${id})`;
    return { ok: true };
  });
}

async function listRows(url) {
  const sql = db();
  const since = url.searchParams.get('since');
  let rows;
  if (since) {
    const d = new Date(since);
    if (Number.isNaN(d.getTime())) throw new HttpError(400, 'Bad since');
    rows = await sql`select r.* from rows r join staff_tabs t on t.id=r.tab_id and t.deleted_at is null where r.updated_at > ${d}`;
  } else {
    rows = await sql`select r.* from rows r join staff_tabs t on t.id=r.tab_id and t.deleted_at is null where r.deleted_at is null order by r.tab_id, r.pos`;
  }
  const [{ now }] = await sql`select now() as now`;
  return { now, rows: rows.map((r) => (r.deleted_at ? { id: Number(r.id), tab: r.tab_id, deleted: true } : rowOut(r))) };
}

// ---------- tabs ----------
const avOut = (t) => t.avatar_kind === 'emo' && t.avatar_emoji ? { t: 'emo', v: t.avatar_emoji }
  : t.avatar_kind === 'img' ? { t: 'img', u: '/api/avatar/' + t.id + '?v=' + (t.avatar_ver || 0) } : null;
const tabOut = (t) => ({ id: t.id, name: t.name, short_name: t.short_name || '', color: t.color, font: t.font, title: t.title, tagline: t.tagline, sort: t.sort, sheet_len: t.sheet_len, avatar: avOut(t) });

// v18: tab picture. body = {t:'letter'} | {t:'emo', v:'😎'} | {t:'img', mime, data(base64)}. Anyone can edit a banner (same as before).
const AV_MIME = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
async function setAvatar(user, id, body) {
  const sql = db();
  const [t] = await sql`select id from staff_tabs where id=${id} and deleted_at is null`;
  if (!t) throw new HttpError(404, 'Tab not found');
  const k = body.t;
  let u;
  if (k === 'emo') {
    const v = String(body.v || '').trim().slice(0, 16);
    if (!v) throw new HttpError(400, 'Chọn một mặt cười');
    [u] = await sql`update staff_tabs set avatar_kind='emo', avatar_emoji=${v} where id=${id} returning *`;
    await sql`delete from tab_avatars where tab_id=${id}`;
  } else if (k === 'img') {
    if (!AV_MIME.includes(body.mime)) throw new HttpError(400, 'Chỉ nhận JPG, PNG, WEBP hoặc GIF');
    const buf = Buffer.from(String(body.data || ''), 'base64');
    if (!buf.length) throw new HttpError(400, 'Không đọc được hình');
    if (buf.length > 2 * 1024 * 1024) throw new HttpError(400, 'Hình lớn hơn 2MB');
    await sql`insert into tab_avatars (tab_id, mime, data, updated_at) values (${id}, ${body.mime}, ${buf}, now())
      on conflict (tab_id) do update set mime=excluded.mime, data=excluded.data, updated_at=now()`;
    [u] = await sql`update staff_tabs set avatar_kind='img', avatar_ver=avatar_ver+1 where id=${id} returning *`;
  } else {
    [u] = await sql`update staff_tabs set avatar_kind='', avatar_emoji='' where id=${id} returning *`;
    await sql`delete from tab_avatars where tab_id=${id}`;
  }
  return tabOut(u);
}
async function getAvatar(id) {
  const [a] = await db()`select mime, data from tab_avatars where tab_id=${id}`;
  if (!a) throw new HttpError(404, 'No picture');
  return new Response(a.data, { status: 200, headers: { 'content-type': a.mime, 'cache-control': 'private, max-age=31536000, immutable', 'x-content-type-options': 'nosniff' } });
}

async function createTab(user, body) {
  requireAdmin(user);
  const name = s(body.name, 40);
  if (!name) throw new HttpError(400, 'Name is required');
  const sql = db();
  const [{ n }] = await sql`select coalesce(max(sort),0)+1 as n from staff_tabs`;
  const [t] = await sql`insert into staff_tabs (name,color,font,title,tagline,sort) values (${name},'Teal','Quicksand',${name},'',${n}) returning *`;
  return tabOut(t);
}
async function updateTab(user, id, body) {
  const sql = db();
  const [t] = await sql`select * from staff_tabs where id=${id} and deleted_at is null`;
  if (!t) throw new HttpError(404, 'Tab not found');
  if (body.name !== undefined || body.short_name !== undefined) requireAdmin(user);       // only Admin renames a tab; anyone edits the banner
  const name = body.name !== undefined ? (s(body.name, 40) || t.name) : t.name;
  const color = body.color !== undefined ? (COLORS.includes(body.color) ? body.color : (() => { throw new HttpError(400, 'Bad color'); })()) : t.color;
  const font = body.font !== undefined ? (FONTS.includes(body.font) ? body.font : (() => { throw new HttpError(400, 'Bad font'); })()) : t.font;
  const title = body.title !== undefined ? (s(body.title, 60) || name) : t.title;
  const tagline = body.tagline !== undefined ? (s(body.tagline, 120) || '') : t.tagline;
  const short = body.short_name !== undefined ? (s(body.short_name, 30) || '') : (t.short_name || '');
  const [u] = await sql`update staff_tabs set name=${name}, short_name=${short}, color=${color}, font=${font}, title=${title}, tagline=${tagline} where id=${id} returning *`;
  return tabOut(u);
}
async function orderTabs(user, body) {
  requireAdmin(user);
  const ids = Array.isArray(body.ids) ? body.ids.map(Number).filter(Number.isInteger) : [];
  const sql = db();
  await sql.begin(async (t) => { for (let i = 0; i < ids.length; i++) await t`update staff_tabs set sort=${i + 1} where id=${ids[i]}`; });
  return { ok: true };
}
async function deleteTab(user, id) {
  requireAdmin(user);
  await db()`update staff_tabs set deleted_at=now() where id=${id}`;
  return { ok: true };
}
async function extendTab(user, id) {
  const sql = db();
  await tabInfo(sql, id);
  if (!canEditTab(user, id)) throw new HttpError(403, 'You can only edit your own tab');
  const [t] = await sql`update staff_tabs set sheet_len = least(sheet_len + 50, 5000) where id=${id} returning sheet_len`;
  return { sheet_len: t.sheet_len };
}

// ---------- users (Admin) ----------
const userOut = (u) => ({ id: u.id, username: u.username, full_name: u.full_name, display_name: u.display_name, role: u.role, tab_id: u.tab_id, active: u.active, must_change: u.must_change, locked: u.role !== 'admin' && !!(u.lock_until && new Date(u.lock_until) > new Date()) });
async function listUsers() {
  return (await db()`select * from users order by id`).map(userOut);
}
async function createUser(user, body) {
  requireAdmin(user);
  const username = s(body.username, 40), full = s(body.full_name, 80), disp = s(body.display_name, 40);
  if (!username || !/^[A-Za-z0-9._-]+$/.test(username)) throw new HttpError(400, 'Username: letters, numbers, . _ - only');
  if (!full || !disp) throw new HttpError(400, 'Full name and display name are required');
  const role = body.role === 'admin' ? 'admin' : 'preparer';
  const tab = body.tab_id ? Number(body.tab_id) : null;
  const h = await bcrypt.hash(TEMP_PW, 10);
  try {
    const [u] = await db()`insert into users (username,full_name,display_name,role,tab_id,pw_hash,must_change) values (${username},${full},${disp},${role},${tab},${h},true) returning *`;
    return userOut(u);
  } catch (e) {
    if (e.code === '23505') throw new HttpError(400, 'That username already exists');
    throw e;
  }
}
async function updateUser(user, id, body) {
  requireAdmin(user);
  const sql = db();
  const [u] = await sql`select * from users where id=${id}`;
  if (!u) throw new HttpError(404, 'User not found');
  const role = body.role === undefined ? u.role : (body.role === 'admin' ? 'admin' : 'preparer');
  const active = body.active === undefined ? u.active : bool(body.active);
  if (id === user.id && (role !== 'admin' || !active)) throw new HttpError(400, 'Không tự bỏ quyền Admin hoặc tự khóa tài khoản của mình được.');
  if ((role !== 'admin' || !active) && u.role === 'admin') {
    const [{ n }] = await sql`select count(*)::int as n from users where role='admin' and active and id<>${id}`;
    if (n === 0) throw new HttpError(400, 'There must be at least one active Admin');
  }
  const disp = body.display_name === undefined ? u.display_name : (s(body.display_name, 40) || u.display_name);
  const tab = body.tab_id === undefined ? u.tab_id : (body.tab_id ? Number(body.tab_id) : null);
  const [r] = await sql`update users set role=${role}, active=${active}, display_name=${disp}, tab_id=${tab} where id=${id} returning *`;
  if (!active) await sql`delete from sessions where user_id=${id}`;
  return userOut(r);
}
async function resetUser(user, id) {
  requireAdmin(user);
  const sql = db();
  const h = await bcrypt.hash(TEMP_PW, 10);
  const [u] = await sql`update users set pw_hash=${h}, must_change=true, failed_count=0, lock_level=0, lock_until=null where id=${id} returning *`;
  if (!u) throw new HttpError(404, 'User not found');
  await sql`delete from sessions where user_id=${id}`;
  return userOut(u);
}
async function unlockUser(user, id) {
  requireAdmin(user);
  const [u] = await db()`update users set failed_count=0, lock_level=0, lock_until=null where id=${id} returning *`;
  if (!u) throw new HttpError(404, 'User not found');
  return userOut(u);
}

// ---------- blackouts ----------
async function addBlackout(user, body) {
  requireAdmin(user);
  const day = isoDate(body.day); if (!day) throw new HttpError(400, 'Date is required');
  const who = body.who === 'all' || CALS.includes(body.who) ? body.who : 'all';
  const [b] = await db()`insert into blackouts (day,who,note) values (${day},${who},${s(body.note, 80) || 'Nghỉ'}) returning *`;
  return { id: b.id, date: b.day, who: b.who, note: b.note };
}
async function delBlackout(user, id) {
  requireAdmin(user);
  await db()`delete from blackouts where id=${id}`;
  return { ok: true };
}

// ---------- bookings ----------
const bookOut = (b) => ({ id: Number(b.id), cal: b.cal, date: b.day, slot: b.slot, span: b.span, n: b.client, p: b.phone, f: b.files, s: b.preparer, note: b.note, sms: b.sms !== false, tk: b.token || '', biz: !!b.biz });

// v17: customer link + text message after a booking is saved / moved / cancelled
async function linkUpsert(sql, b, status) {
  if (!b.token) return;
  await sql`insert into booking_links (token, data, status, appt_at, updated_at)
    values (${b.token}, ${sql.json(linkData(b))}, ${status}, ((${b.day}::date + ${b.slot}::time) at time zone 'America/Los_Angeles'), now())
    on conflict (token) do update set data=excluded.data, status=excluded.status, appt_at=excluded.appt_at, updated_at=now()`;
}
async function bookingSms(sql, user, kind, b) {
  if (!b.token) return 'off';
  const st = await getSettings(sql);
  const cfg = smsCfg(st);
  if (!cfg.on || !cfg[kind]?.on || b.sms === false) return 'off';
  if (!inSeason(cfg, laNow().date)) return 'off';
  const [{ future }] = await sql`select ((${b.day}::date + ${b.slot}::time) at time zone 'America/Los_Angeles') > now() as future`;
  if (!future) return 'off';
  const body = fill(cfg[kind].text, { business: cfg.business, date: fmtDay(b.day), hour: fmtHour(b.slot), link: linkOf(b.token), name: shortName(b.client), preparer: b.cal !== 'Office' ? b.cal : b.preparer });
  const sendAt = await sendAtFor(sql, cfg);
  const q = await queueSms(sql, { token: b.token, kind, phone: b.phone, body, sendAt, by: user.display_name });
  if (!q) return 'off';
  if (q.skipped) return 'skipped';
  if (!q.due) return 'queued';
  return (await sendOne(sql, q.id)) || 'queued';
}
async function listBookings(url) {
  const from = isoDate(url.searchParams.get('from')), to = isoDate(url.searchParams.get('to'));
  if (!from || !to) throw new HttpError(400, 'from and to are required');
  return (await db()`select * from bookings where day between ${from} and ${to} order by day, slot`).map(bookOut);
}
const dayKeys = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];
async function saveBooking(user, body) {
  const sql = db();
  const cal = body.cal;
  if (!CALS.includes(cal)) throw new HttpError(400, 'Bad calendar');
  const day = isoDate(body.day);
  const slot = String(body.slot || '');
  const client = s(body.client, 100), phone = s(body.phone, 30), files = Number(body.files);
  if (!client || !phone || !Number.isInteger(files) || files < 1 || files > 99) throw new HttpError(400, 'Cần điền Client name, Phone và Files.');
  const span = Math.max(1, Number(body.span) || 1);
  const prep = cal === 'Office' ? (s(body.preparer, 40) || '') : '';
  const note = s(body.note, 200) || '';
  const biz = bool(body.biz);
  const old = body.old && body.old.cal ? { cal: body.old.cal, day: isoDate(body.old.day), slot: String(body.old.slot) } : null;
  let prev = null;
  const saved = await sql.begin(async (t) => {
    const st = await getSettings(t);
    const c = st.cal?.[cal];
    if (!c) throw new HttpError(400, 'Calendar is not set up');
    const slots = []; for (let m = toMin(c.start); m <= toMin(c.last); m += c.step) slots.push(hhmm(m));
    const si = slots.indexOf(slot);
    if (si < 0) throw new HttpError(400, 'Giờ đó không có trong lịch.');
    if (si + span > slots.length) throw new HttpError(400, 'Không đủ chỗ ở khung giờ đó.');
    const wd = new Date(day + 'T00:00:00Z').getUTCDay();
    if (!st.hours?.[String(wd)]) throw new HttpError(400, 'Ngày đó đóng cửa.');
    const [bo] = await t`select 1 as x from blackouts where day=${day} and (who='all' or who=${cal}) limit 1`;
    if (bo) throw new HttpError(400, 'Ngày đó đang nghỉ.');
    if (cal !== 'Office') {
      const [p] = await t`select id from sched_periods where ${day} between start_date and end_date limit 1`;
      if (p) {
        const [r] = await t`select days from sched_rows where period_id=${p.id} and name=${cal} limit 1`;
        if (r && !(dayKeys[wd] in r.days)) throw new HttpError(400, 'Ngày đó đang nghỉ.');
      }
    }
    // overlap with other bookings that day (ignore the booking being moved)
    const others = await t`select slot, span from bookings where cal=${cal} and day=${day}`;
    const mine = new Set(); for (let i = si; i < si + span; i++) mine.add(i);
    for (const o of others) {
      if (old && old.cal === cal && old.day === day && old.slot === o.slot) continue;
      const oi = slots.indexOf(o.slot);
      for (let i = oi; i < oi + o.span; i++) if (mine.has(i)) throw new HttpError(400, 'Không đủ chỗ ở khung giờ đó.');
    }
    if (old) { [prev] = await t`select * from bookings where cal=${old.cal} and day=${old.day} and slot=${old.slot}`; }
    if (old) await t`delete from bookings where cal=${old.cal} and day=${old.day} and slot=${old.slot}`;
    const moved = !prev || prev.cal !== cal || prev.day !== day || prev.slot !== slot;
    const token = prev?.token || newBookToken();
    const sms = body.sms === undefined ? (prev ? prev.sms : true) : bool(body.sms);
    const schedAt = moved ? new Date() : prev.sched_at;
    const [b] = await t`insert into bookings (cal,day,slot,span,client,phone,files,preparer,note,created_by,token,sms,sched_at,biz)
      values (${cal},${day},${slot},${span},${client},${phone},${files},${prep},${note},${user.display_name},${token},${sms},${schedAt},${biz})
      on conflict (cal,day,slot) do update set span=excluded.span, client=excluded.client, phone=excluded.phone, files=excluded.files,
        preparer=excluded.preparer, note=excluded.note, updated_at=now(), token=excluded.token, sms=excluded.sms, sched_at=excluded.sched_at, biz=excluded.biz
      returning *`;
    return { b, moved };
  });
  const { b, moved } = saved;
  let smsRes = 'off';
  try {
    await linkUpsert(sql, b, prev ? (moved ? 'updated' : (await sql`select status from booking_links where token=${b.token}`)[0]?.status || 'ok') : 'ok');
    if (moved) smsRes = await bookingSms(sql, user, prev ? 'updated' : 'created', b);
  } catch (e) { console.error('sms', e); smsRes = 'failed'; }
  return { ...bookOut(b), smsRes };
}
async function deleteBooking(user, url) {
  const cal = url.searchParams.get('cal'), day = isoDate(url.searchParams.get('day')), slot = url.searchParams.get('slot');
  if (!CALS.includes(cal) || !day || !slot) throw new HttpError(400, 'Bad request');
  const sql = db();
  const [b] = await sql`delete from bookings where cal=${cal} and day=${day} and slot=${slot} returning *`;
  let smsRes = 'off';
  if (b && b.token) {
    try {
      await linkUpsert(sql, b, 'cancelled');
      if (url.searchParams.get('sms') !== '0') smsRes = await bookingSms(sql, user, 'cancelled', b);
    } catch (e) { console.error('sms', e); smsRes = 'failed'; }
  }
  return { ok: true, smsRes };
}

// ---------- v17: customer page (no login) ----------
function hoursLines(p) {
  if (!p) return [];
  return [`Mon–Fri ${p.hours_week || '—'}`, `Sat ${p.hours_sat || 'closed'}`, `Sun ${p.hours_sun || 'closed'}`];
}
async function publicBooking(token, ics) {
  if (!/^[A-Za-z0-9]{6,20}$/.test(token)) throw new HttpError(404, 'Not found');
  const sql = db();
  const [l] = await sql`select *, appt_at < now() - interval '7 days' as expired from booking_links where token=${token}`;
  if (!l) throw new HttpError(404, 'Not found');
  const cfg = smsCfg(await getSettings(sql));
  if (l.expired) return { expired: true, business: cfg.business, phone: cfg.phone, email: cfg.email };
  const d = l.data;
  const [p] = await sql`select * from sched_periods where ${d.day} between start_date and end_date order by start_date limit 1`;
  if (ics) {
    const st = new Date(l.appt_at); const en = new Date(st.getTime() + 60 * 60000);
    const z = (x) => x.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
    const esc2 = (x) => String(x).replace(/[\\;,]/g, (c) => '\\' + c);
    const body = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//First Source//Tax//EN', 'BEGIN:VEVENT', `UID:${token}@tax.fsma.team`, `DTSTAMP:${z(new Date())}`,
      `DTSTART:${z(st)}`, `DTEND:${z(en)}`, `SUMMARY:${esc2(cfg.business + ' - tax appointment')}`, `LOCATION:${esc2(cfg.address)}`,
      `DESCRIPTION:${esc2('Questions: ' + cfg.phone + ' / ' + cfg.email)}`, 'END:VEVENT', 'END:VCALENDAR'].join('\r\n');
    return new Response(body, { status: 200, headers: { 'content-type': 'text/calendar; charset=utf-8', 'content-disposition': `attachment; filename="appointment.ics"`, 'cache-control': 'no-store', 'x-robots-tag': 'noindex' } });
  }
  return {
    status: l.status, business: cfg.business, phone: cfg.phone, email: cfg.email, address: cfg.address, bring: cfg.bring,
    name: d.name, day: d.day, date: fmtDayLong(d.day), hour: fmtHour(d.slot), with: d.with || '', files: d.files, hours: hoursLines(p),
  };
}

// ---------- v17: text message log / test (Admin) ----------
async function smsLog(user, url) {
  const sql = db();
  const token = url.searchParams.get('token');
  if (token) return (await sql`select kind, status, error, send_at, sent_at, created_at from sms_log where token=${token} order by id`).map((r) => ({ kind: r.kind, status: r.status, error: r.error, at: r.sent_at || r.send_at }));
  requireAdmin(user);
  const rows = await sql`select l.*, b.data->>'name' as cname from sms_log l left join booking_links b on b.token=l.token order by l.id desc limit 300`;
  const [cnt] = await sql`select count(*) filter (where status in ('sent','demo') and sent_at >= date_trunc('month', now()))::int as month,
      count(*) filter (where status in ('sent','demo'))::int as total from sms_log`;
  return { counts: cnt, demo: !env('TWILIO_SID'), rows: rows.map((r) => ({ id: Number(r.id), kind: r.kind, to: r.to_phone.replace(/^\+1(\d{3})(\d{3})(\d{4})$/, '$1-$2-$3'), name: r.cname || '', body: r.body, status: r.status, error: r.error, at: r.sent_at || r.send_at, by: r.created_by })) };
}
async function smsTest(user, body) {
  requireAdmin(user);
  const sql = db();
  const cfg = smsCfg(await getSettings(sql));
  const kind = ['created', 'updated', 'cancelled', 'reminder'].includes(body.kind) ? body.kind : 'created';
  const day = laNow().date;
  const text = fill(cfg[kind].text, { business: cfg.business, date: fmtDay(day), hour: fmtHour('10:00'), link: siteUrl() + '/b/TEST', name: 'Test', preparer: '' });
  const q = await queueSms(sql, { token: null, kind: 'test', phone: body.phone, body: text, by: user.display_name });
  if (!q || q.skipped) throw new HttpError(400, 'Số điện thoại không đúng (cần 10 số)');
  const r = await sendOne(sql, q.id);
  const [m] = await sql`select status, error from sms_log where id=${q.id}`;
  return { result: r, status: m.status, error: m.error };
}

// ---------- v17: Lock day (Accounting > Cash cuối ngày) ----------
async function lockDay(user, body) {
  const day = isoDate(body.day); if (!day) throw new HttpError(400, 'Bad day');
  const snap = body.snap && typeof body.snap === 'object' ? body.snap : {};
  if (JSON.stringify(snap).length > 200000) throw new HttpError(400, 'Too big');
  const [r] = await db()`insert into cash_locks (day, locked_at, locked_by, snap) values (${day}, now(), ${user.display_name}, ${db().json(snap)})
    on conflict (day) do update set locked_at=now(), locked_by=excluded.locked_by, snap=excluded.snap returning *`;
  return { day: r.day, at: r.locked_at, by: r.locked_by, snap: r.snap };
}

// ---------- schedule ----------
async function getSched(sql) {
  const ps = await sql`select * from sched_periods order by start_date`;
  const rs = await sql`select * from sched_rows order by period_id, sort, id`;
  return ps.map((p) => ({ id: p.id, start: p.start_date, end: p.end_date, week: p.hours_week, sat: p.hours_sat, sun: p.hours_sun,
    rows: rs.filter((r) => r.period_id === p.id).map((r) => ({ n: r.name, note: r.note, hrs: r.hrs, days: r.days })) }));
}
const DKEYS = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'];
async function putSched(user, body) {
  requireAdmin(user);
  const periods = Array.isArray(body.periods) ? body.periods : [];
  if (periods.length > 60) throw new HttpError(400, 'Too many periods');
  const clean = periods.map((p) => {
    const start = isoDate(p.start), end = isoDate(p.end);
    if (!start || !end || end < start) throw new HttpError(400, 'Bad period dates');
    return { start, end, week: String(p.week || '').slice(0, 30), sat: String(p.sat || '').slice(0, 30), sun: String(p.sun || '').slice(0, 30),
      rows: (Array.isArray(p.rows) ? p.rows : []).slice(0, 60).map((r) => {
        const days = {};
        for (const k of DKEYS) if (r.days && k in r.days) days[k] = String(r.days[k] || '').slice(0, 20);
        return { n: String(r.n || '').trim().slice(0, 40) || 'Name', note: String(r.note || '').slice(0, 60), hrs: String(r.hrs || '').slice(0, 30), days };
      }) };
  });
  await db().begin(async (t) => {
    await t`delete from sched_periods`;
    for (const p of clean) {
      const [{ id }] = await t`insert into sched_periods (start_date,end_date,hours_week,hours_sat,hours_sun) values (${p.start},${p.end},${p.week},${p.sat},${p.sun}) returning id`;
      for (let i = 0; i < p.rows.length; i++) {
        const r = p.rows[i];
        await t`insert into sched_rows (period_id,name,note,hrs,days,sort) values (${id},${r.n},${r.note},${r.hrs},${t.json(r.days)},${i})`;
      }
    }
  });
  return { ok: true };
}

// ---------- fees ----------
async function getFees(sql) {
  const items = await sql`select * from fee_items order by sec_sort, sort, id`;
  const tiers = await sql`select * from fee_tiers order by sort, id`;
  const secs = []; const idx = {};
  items.forEach((i) => { if (!(i.section in idx)) { idx[i.section] = secs.length; secs.push([i.section, []]); } secs[idx[i.section]][1].push([i.item, i.fee, i.note]); });
  return { fees: secs, tiers: tiers.map((t) => [t.title, t.heads, t.vals]) };
}
async function putFees(user, body) {
  requireAdmin(user);
  const secs = Array.isArray(body.fees) ? body.fees : [];
  const tiers = Array.isArray(body.tiers) ? body.tiers : [];
  const S = (v, n) => String(v ?? '').slice(0, n);
  await db().begin(async (t) => {
    await t`delete from fee_items`; await t`delete from fee_tiers`;
    for (let si = 0; si < secs.length; si++) {
      const [title, its] = secs[si];
      for (let ii = 0; ii < (its || []).length; ii++) {
        await t`insert into fee_items (section,sec_sort,item,fee,note,sort) values (${S(title, 80)},${si},${S(its[ii][0], 120)},${S(its[ii][1], 60)},${S(its[ii][2], 200)},${ii})`;
      }
    }
    for (let ti = 0; ti < tiers.length; ti++) {
      const [title, heads, vals] = tiers[ti];
      const rows = Array.isArray(vals) && vals.length && Array.isArray(vals[0])
        ? vals.slice(0, 10).map((r) => [S(r[0], 120), (r[1] || []).map((x) => S(x, 30))])
        : [['Fees', (vals || []).map((x) => S(x, 30))]];
      await t`insert into fee_tiers (title,sort,heads,vals) values (${S(title, 120)},${ti},${t.json((heads || []).map((x) => S(x, 30)))},${t.json(rows)})`;
    }
  });
  return { ok: true };
}

// ---------- records (old seasons) ----------
async function recordsDaily() {
  const rows = await db()`select year, preparer, day, clients, income, tips, ef, accepted, others from records_daily order by year, preparer, day`;
  return { rows: rows.map((r) => [r.year, r.preparer, r.day, r.clients, Number(r.income), Number(r.tips), r.ef, r.accepted, r.others]) };
}
// 'MM-DD' -> [m, d] (v19 Records date filter)
function md(v) { const m = /^(\d{2})-(\d{2})$/.exec(String(v || '')); if (!m) return null; const a = +m[1], b = +m[2]; return a >= 1 && a <= 12 && b >= 1 && b <= (a === 2 ? 28 : [4, 6, 9, 11].includes(a) ? 30 : 31) ? [a, b] : null; }
async function recordsClients(url) {
  const sql = db();
  const years = (url.searchParams.get('years') || '').split(',').map(Number).filter((y) => Number.isInteger(y));
  const prep = s(url.searchParams.get('prep'), 40);
  const q = nameKey((url.searchParams.get('q') || '').slice(0, 60));
  const limit = Math.min(Math.max(Number(url.searchParams.get('limit')) || 100, 1), 500);
  const offset = Math.max(Number(url.searchParams.get('offset')) || 0, 0);
  const like = '%' + q.replace(/[%_\\]/g, '\\$&') + '%';
  const where = sql`${years.length ? sql`year = any(${sql.array(years)}::int[])` : sql`true`}
      ${prep ? sql`and preparer = ${prep}` : sql``}
      ${q ? (/^\d{1,4}$/.test(q) ? (q.length === 4 ? sql`and ssn = ${q}` : sql`and ssn like ${q + '%'}`) : sql`and name_key like ${like}`) : sql``}
      ${md(url.searchParams.get('from')) ? sql`and day >= make_date(year + 1, ${md(url.searchParams.get('from'))[0]}, ${md(url.searchParams.get('from'))[1]})` : sql``}
      ${md(url.searchParams.get('to')) ? sql`and day <= make_date(year + 1, ${md(url.searchParams.get('to'))[0]}, ${md(url.searchParams.get('to'))[1]})` : sql``}`;
  const asc = url.searchParams.get('sort') === 'asc';
  const [{ n }] = await sql`select count(*)::int as n from records_clients where ${where}`;
  const rows = asc
    ? await sql`select year, day, preparer, name, ssn, amount, status, note from records_clients where ${where} order by year desc, day asc, id limit ${limit} offset ${offset}`
    : await sql`select year, day, preparer, name, ssn, amount, status, note from records_clients where ${where} order by year desc, day desc, id limit ${limit} offset ${offset}`;
  return { total: n, rows: rows.map((r) => ({ year: r.year, date: r.day, preparer: r.preparer, name: r.name, ssn: r.ssn, amt: Number(r.amount), status: r.status, note: r.note })) };
}

// ---------- search (everyone) ----------
async function search(url) {
  const sql = db();
  const q = nameKey((url.searchParams.get('q') || '').slice(0, 60));
  if (!q) return { total: 0, rows: [] };
  const digits = /^\d{1,4}$/.test(q);
  const like = '%' + q.replace(/[%_\\]/g, '\\$&') + '%';
  const cond = (a) => (digits ? (q.length === 4 ? sql`${sql(a + 'ssn')} = ${q}` : sql`${sql(a + 'ssn')} like ${q + '%'}`) : sql`${sql(a + 'name_key')} like ${like}`);
  const st = await getSettings(sql);
  const season = Number(st.season_year) || new Date().getFullYear();
  const live = await sql`select r.work_date, t.id as tab_id, t.name as tab, r.name, r.ssn, r.amount, r.status, r.note, r.online, r.paid
      from rows r join staff_tabs t on t.id=r.tab_id and t.deleted_at is null
      where r.deleted_at is null and r.name <> '' and ${cond('r.')} order by r.work_date desc nulls last limit 150`;
  const [{ n: nl }] = await sql`select count(*)::int as n from rows r join staff_tabs t on t.id=r.tab_id and t.deleted_at is null where r.deleted_at is null and r.name <> '' and ${cond('r.')}`;
  const rec = await sql`select year, day, preparer, name, ssn, amount, status, note from records_clients c where ${cond('c.')} order by year desc, day desc limit 150`;
  const [{ n: nr }] = await sql`select count(*)::int as n from records_clients c where ${cond('c.')}`;
  const all = [
    ...live.map((r) => ({ year: season, date: r.work_date || '', preparer: r.tab, tabId: r.tab_id, name: r.name, ssn: r.ssn,
      amt: r.status === 'Refund' ? -Math.abs(Number(r.amount)) : Number(r.amount), status: r.status,
      note: r.note + (r.online ? (r.note ? ' · ' : '') + 'Online' + (r.paid ? '' : ', chưa Paid') : '') })),
    ...rec.map((r) => ({ year: r.year, date: r.day, preparer: r.preparer, tabId: null, name: r.name, ssn: r.ssn, amt: Number(r.amount), status: r.status, note: r.note })),
  ].sort((a, b) => (a.year !== b.year ? b.year - a.year : (a.date < b.date ? 1 : -1)));
  return { total: nl + nr, rows: all.slice(0, 100) };
}

// ---------- activity log (Admin) ----------
async function listLog() {
  const rows = await db()`select id, at, user_name, tab_name, kind, text, (snapshot->>'restored') as restored from activity_log order by at desc limit 500`;
  return rows.map((r) => ({ id: Number(r.id), at: r.at, user: r.user_name, tab: r.tab_name, kind: r.kind, text: r.text, restored: r.restored === 'true' }));
}


// ---------- accounting (Admin) ----------
const nnum = (v, o) => (v === null || v === undefined || v === '' ? null : num(v, o));
const n2 = (v) => (v === null || v === undefined ? null : Number(v));
const payStaffOut = (r) => ({ id: r.id, name: r.name, rate: Number(r.rate), note: r.note, tab_id: r.tab_id, active: r.active, sort: r.sort });
const periodOut = (p) => ({ id: p.id, start: p.start_date, end: p.end_date });
async function getAcct() {
  const sql = db();
  const cash = await sql`select day, tab_id, received, done, note, updated_by, updated_at from cash_days order by day desc, tab_id`;
  const staff = await sql`select * from pay_staff order by sort, id`;
  const periods = await sql`select * from pay_periods order by start_date, id`;
  const rows = await sql`select * from pay_rows`;
  const locks = await sql`select * from cash_locks order by day`.catch(() => []);
  return {
    locks: locks.map((l) => ({ day: l.day, at: l.locked_at, by: l.locked_by, snap: l.snap })),
    cash: cash.map((c) => ({ day: c.day, tab_id: c.tab_id, received: n2(c.received), done: c.done, note: c.note, by: c.updated_by, at: c.updated_at })),
    staff: staff.map(payStaffOut),
    periods: periods.map(periodOut),
    rows: rows.map((r) => ({ period_id: r.period_id, staff_id: r.staff_id, hours: n2(r.hours), wages: n2(r.wages), bonus: n2(r.bonus), note: r.note })),
  };
}
async function putCash(user, body) {
  const day = isoDate(body.day); const tab = Number(body.tab_id);
  if (!day || !Number.isInteger(tab)) throw new HttpError(400, 'Bad request');
  const received = nnum(body.received, { min: -1e6, max: 1e6 });
  const done = bool(body.done); const note = String(body.note ?? '').slice(0, 300);
  const [r] = await db()`insert into cash_days (day, tab_id, received, done, note, updated_by, updated_at)
    values (${day}, ${tab}, ${received}, ${done}, ${note}, ${user.display_name}, now())
    on conflict (day, tab_id) do update set received=excluded.received, done=excluded.done, note=excluded.note, updated_by=excluded.updated_by, updated_at=now()
    returning *`;
  return { day: r.day, tab_id: r.tab_id, received: n2(r.received), done: r.done, note: r.note, by: r.updated_by, at: r.updated_at };
}
async function addPayStaff(body) {
  const name = s(body.name, 40); if (!name) throw new HttpError(400, 'Cần tên nhân viên');
  const [mx] = await db()`select coalesce(max(sort),0)::int as m from pay_staff`;
  try {
    const [r] = await db()`insert into pay_staff (name, rate, sort) values (${name}, ${num(body.rate, { min: 0, max: 1000 })}, ${mx.m + 1}) returning *`;
    return payStaffOut(r);
  } catch (e) { if (e.code === '23505') throw new HttpError(400, 'Tên này đã có'); throw e; }
}
async function updPayStaff(id, body) {
  const sql = db();
  const [cur] = await sql`select * from pay_staff where id=${id}`; if (!cur) throw new HttpError(404, 'Not found');
  const name = 'name' in body ? s(body.name, 40) : cur.name; if (!name) throw new HttpError(400, 'Cần tên nhân viên');
  const rate = 'rate' in body ? num(body.rate, { min: 0, max: 1000 }) : cur.rate;
  const note = 'note' in body ? String(body.note ?? '').slice(0, 200) : cur.note;
  const tab = 'tab_id' in body ? (body.tab_id ? Number(body.tab_id) : null) : cur.tab_id;
  const active = 'active' in body ? bool(body.active) : cur.active;
  try {
    const [r] = await sql`update pay_staff set name=${name}, rate=${rate}, note=${note}, tab_id=${tab}, active=${active} where id=${id} returning *`;
    return payStaffOut(r);
  } catch (e) { if (e.code === '23505') throw new HttpError(400, 'Tên này đã có'); throw e; }
}
async function addPeriod(body) {
  const a = isoDate(body.start), b = isoDate(body.end);
  if (!a || !b || b < a) throw new HttpError(400, 'Period: ngày cuối phải sau ngày đầu');
  const [p] = await db()`insert into pay_periods (start_date, end_date) values (${a}, ${b}) returning *`;
  return periodOut(p);
}
async function updPeriod(id, body) {
  const a = isoDate(body.start), b = isoDate(body.end);
  if (!a || !b || b < a) throw new HttpError(400, 'Period: ngày cuối phải sau ngày đầu');
  const [p] = await db()`update pay_periods set start_date=${a}, end_date=${b} where id=${id} returning *`;
  if (!p) throw new HttpError(404, 'Not found');
  return periodOut(p);
}
async function putPayRow(body) {
  const pid = Number(body.period_id), sid = Number(body.staff_id);
  if (!Number.isInteger(pid) || !Number.isInteger(sid)) throw new HttpError(400, 'Bad request');
  const hours = nnum(body.hours, { min: 0, max: 1000 }), wages = nnum(body.wages, { min: 0, max: 1e6 }), bonus = nnum(body.bonus, { min: 0, max: 1e6 });
  const note = String(body.note ?? '').slice(0, 200);
  const [r] = await db()`insert into pay_rows (period_id, staff_id, hours, wages, bonus, note) values (${pid}, ${sid}, ${hours}, ${wages}, ${bonus}, ${note})
    on conflict (period_id, staff_id) do update set hours=excluded.hours, wages=excluded.wages, bonus=excluded.bonus, note=excluded.note returning *`;
  return { period_id: r.period_id, staff_id: r.staff_id, hours: n2(r.hours), wages: n2(r.wages), bonus: n2(r.bonus), note: r.note };
}

// ---------- backup (Admin) ----------
async function backup() {
  const sql = db();
  // run one query at a time: Supabase transaction pooler (6543) can hang on parallel/pipelined queries
  const tabs = await sql`select * from staff_tabs order by id`;
  const users = await sql`select id, username, full_name, display_name, role, tab_id, active, must_change, appt_font, created_at, last_login_at from users order by id`;
  const rows = await sql`select * from rows order by tab_id, pos`;
  const log = await sql`select * from activity_log order by id`;
  const settings = await getSettings(sql);
  const blackouts = await sql`select * from blackouts order by day`;
  const bookings = await sql`select * from bookings order by day, slot`;
  const sched = await getSched(sql);
  const fees = await getFees(sql);
  const acct = await getAcct().catch(() => null);
  const body = JSON.stringify({ exported_at: new Date().toISOString(), staff_tabs: tabs, users, rows, activity_log: log, settings, blackouts, bookings, schedule: sched, fees: fees.fees, fee_tiers: fees.tiers, accounting: acct });
  return new Response(body, { status: 200, headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store', 'content-disposition': `attachment; filename="tax-backup-${todayLA()}.json"` } });
}

// ---------- prefs ----------
async function putPrefs(user, body) {
  const sql = db();
  if (body.appt_font !== undefined) {
    if (!APPT_FONTS.includes(body.appt_font)) throw new HttpError(400, 'Bad font');
    await sql`update users set appt_font=${body.appt_font} where id=${user.id}`;
  }
  if (body.theme !== undefined) {
    if (!THEMES.includes(body.theme)) throw new HttpError(400, 'Bad theme');
    await sql`update users set theme=${body.theme} where id=${user.id}`;
  }
  if (body.food !== undefined) {
    if (body.food !== '' && !FOODS.includes(body.food)) throw new HttpError(400, 'Bad food');
    await sql`update users set food=${body.food} where id=${user.id}`;
  }
  if (body.zodiac !== undefined) {
    if (body.zodiac !== '' && !ZODIACS.includes(body.zodiac)) throw new HttpError(400, 'Bad zodiac');
    await sql`update users set zodiac=${body.zodiac} where id=${user.id}`;
  }
  return { ok: true };
}

// ---------- v19: Homepage (bảng dán giấy, Trưa nay ăn gì, mood, kỷ lục) ----------
const NOTE_DAYS = 3;
async function homeData(user, withRecords) {
  const sql = db();
  const day = todayLA();
  const notes = await sql`select id, user_id, user_name, body, hearts, created_at from home_notes
    where created_at > now() - ${NOTE_DAYS + ' days'}::interval order by created_at desc limit 30`;
  const votes = await sql`select kind, choice, user_id from home_votes where day=${day}`;
  const [st] = await sql`select value from settings where key='lunch'`;
  const lunch = { options: Array.isArray(st?.value) ? st.value : [], votes: {}, mine: '' };
  let mood = '';
  for (const v of votes) {
    if (v.kind === 'lunch') { lunch.votes[v.choice] = (lunch.votes[v.choice] || 0) + 1; if (v.user_id === user.id) lunch.mine = v.choice; }
    if (v.kind === 'mood' && v.user_id === user.id) mood = v.choice;
  }
  const out = {
    notes: notes.map((n) => ({ id: Number(n.id), by: n.user_name, mine: n.user_id === user.id, body: n.body, hearts: n.hearts.length, hearted: n.hearts.includes(user.id), at: n.created_at })),
    lunch, mood,
  };
  if (withRecords) out.records = await homeRecords(sql, day);
  return out;
}
// Kỷ lục: các mùa cũ (records_daily) + mùa này (rows) + lịch hẹn (bookings)
async function homeRecords(sql, day) {
  const [r] = await sql`
    with d as (
      select day, sum(clients)::int as c, sum(income)::numeric as inc from records_daily group by day
      union all
      select work_date as day,
        count(*) filter (where name <> '' and status <> 'Refund')::int as c,
        sum(case when status = 'Refund' then -abs(amount) else amount end)::numeric as inc
      from rows where deleted_at is null and work_date is not null
        and work_date > coalesce((select max(day) from records_daily), '1900-01-01'::date) group by work_date
    ), dd as (select day, sum(c)::int as c, sum(inc)::numeric as inc from d group by day),
    w as (select date_trunc('week', day)::date as wk, sum(c)::int as c from dd group by 1),
    b as (select day, count(*)::int as n from bookings group by day)
    select
      (select json_build_object('v', c, 'day', day) from dd order by c desc, day limit 1) as day_c,
      (select json_build_object('v', inc, 'day', day) from dd order by inc desc, day limit 1) as day_inc,
      (select json_build_object('v', c, 'day', wk) from w order by c desc, wk limit 1) as week_c,
      (select json_build_object('v', n, 'day', day) from b order by n desc, day limit 1) as day_bk,
      (select coalesce(c, 0) from dd where day = ${day}) as now_c,
      (select coalesce(inc, 0) from dd where day = ${day}) as now_inc,
      (select coalesce(c, 0) from w where wk = date_trunc('week', ${day}::date)::date) as now_wc,
      (select coalesce(n, 0) from b where day = ${day}) as now_bk`;
  return {
    dayClients: { rec: r.day_c?.v || 0, day: r.day_c?.day || '', now: r.now_c || 0 },
    weekClients: { rec: r.week_c?.v || 0, day: r.week_c?.day || '', now: r.now_wc || 0 },
    dayBookings: { rec: r.day_bk?.v || 0, day: r.day_bk?.day || '', now: r.now_bk || 0 },
    dayIncome: { rec: Number(r.day_inc?.v || 0), day: r.day_inc?.day || '', now: Number(r.now_inc || 0) },
  };
}
async function addNote(user, body) {
  const t = String(body.body ?? '').trim().replace(/\s+/g, ' ').slice(0, 140);
  if (!t) throw new HttpError(400, 'Viết gì đó trước đã');
  const sql = db();
  const [{ n }] = await sql`select count(*)::int as n from home_notes where user_id=${user.id} and created_at > now() - interval '1 day'`;
  if (n >= 20) throw new HttpError(400, 'Hôm nay dán nhiều quá rồi');
  await sql`insert into home_notes (user_id, user_name, body) values (${user.id}, ${user.display_name}, ${t})`;
  // dọn dữ liệu cũ để database luôn nhỏ
  await sql`delete from home_notes where created_at < now() - interval '30 days'`;
  await sql`delete from home_votes where day < current_date - 60`;
  return homeData(user, false);
}
async function delNote(user, id) {
  const sql = db();
  const [n] = await sql`select user_id from home_notes where id=${id}`;
  if (!n) return homeData(user, false);
  if (n.user_id !== user.id && user.role !== 'admin') throw new HttpError(403, 'Chỉ người dán (hoặc Admin) được gỡ');
  await sql`delete from home_notes where id=${id}`;
  return homeData(user, false);
}
async function heartNote(user, id) {
  await db()`update home_notes set hearts = case when ${user.id} = any(hearts) then array_remove(hearts, ${user.id}) else array_append(hearts, ${user.id}) end where id=${id}`;
  return homeData(user, false);
}
async function vote(user, body) {
  const kind = body.kind === 'mood' ? 'mood' : 'lunch';
  const choice = String(body.choice ?? '').slice(0, 40);
  const sql = db();
  const day = todayLA();
  if (kind === 'lunch' && choice) {
    const [st] = await sql`select value from settings where key='lunch'`;
    if (!(Array.isArray(st?.value) && st.value.includes(choice))) throw new HttpError(400, 'Bad choice');
  }
  if (kind === 'mood' && choice && !MOODS.includes(choice)) throw new HttpError(400, 'Bad mood');
  if (!choice) await sql`delete from home_votes where day=${day} and user_id=${user.id} and kind=${kind}`;
  else await sql`insert into home_votes (day, user_id, kind, choice) values (${day}, ${user.id}, ${kind}, ${choice})
    on conflict (day, user_id, kind) do update set choice=excluded.choice`;
  return homeData(user, false);
}
// Số điện thoại đã có hẹn từ hôm nay trở đi (cả 3 lịch)
async function phoneBookings(url) {
  const digits = String(url.searchParams.get('p') || '').replace(/\D/g, '').slice(-10);
  if (digits.length < 10) return [];
  const not = String(url.searchParams.get('not') || '');
  const rows = await db()`select cal, day, slot, client, preparer from bookings
    where day >= ${todayLA()} and right(regexp_replace(phone, '[^0-9]', '', 'g'), 10) = ${digits} order by day, slot limit 10`;
  return rows.filter((b) => `${b.cal}|${b.day}|${b.slot}` !== not).map((b) => ({ cal: b.cal, date: b.day, slot: b.slot, n: b.client, s: b.preparer }));
}

// ---------- boot ----------
async function boot(user) {
  const sql = db();
  // one query at a time (see backup)
  const tabs = await sql`select * from staff_tabs where deleted_at is null order by sort, id`;
  const settings = await getSettings(sql);
  const blackouts = await sql`select * from blackouts order by day`;
  const sched = await getSched(sql);
  const fees = await getFees(sql);
  const rowsRes = await listRows(new URL('http://x/rows'));
  const users = user.role === 'admin' ? await listUsers() : [];
  const home = await homeData(user, true).catch((e) => { console.error('home', e); return null; });
  return {
    home,
    me: meOut(user),
    tabs: tabs.map(tabOut),
    settings,
    blackouts: blackouts.map((b) => ({ id: b.id, date: b.day, who: b.who, note: b.note })),
    sched, fees: fees.fees, tiers: fees.tiers,
    rows: rowsRes.rows, now: rowsRes.now,
    users,
  };
}

// ---------- routes ----------
// [method, pattern, handler(ctx)]
const routes = [
  ['GET', '/me', (x) => ({ user: meOut(x.user) })],
  ['POST', '/password', (x) => changePassword(x.user, x.body)],
  ['GET', '/boot', (x) => boot(x.user)],
  ['GET', '/rows', async (x) => { const out = await listRows(x.url); if (x.url.searchParams.get('home') === '1') out.home = await homeData(x.user, false).catch(() => null); return out; }],
  ['POST', '/rows', (x) => createRow(x.user, x.body)],
  ['PATCH', '/rows/:id', (x) => updateRow(x.user, x.id, x.body)],
  ['DELETE', '/rows/:id', (x) => deleteRow(x.user, x.id)],
  ['POST', '/tabs', (x) => createTab(x.user, x.body)],
  ['POST', '/tabs/order', (x) => orderTabs(x.user, x.body)],
  ['PATCH', '/tabs/:id', (x) => updateTab(x.user, x.id, x.body)],
  ['DELETE', '/tabs/:id', (x) => deleteTab(x.user, x.id)],
  ['POST', '/tabs/:id/extend', (x) => extendTab(x.user, x.id)],
  ['PUT', '/tabs/:id/avatar', (x) => setAvatar(x.user, x.id, x.body)],
  ['GET', '/avatar/:id', (x) => getAvatar(x.id)],
  ['GET', '/users', async (x) => { requireAdmin(x.user); return listUsers(); }],
  ['POST', '/users', (x) => createUser(x.user, x.body)],
  ['PATCH', '/users/:id', (x) => updateUser(x.user, x.id, x.body)],
  ['POST', '/users/:id/reset', (x) => resetUser(x.user, x.id)],
  ['POST', '/users/:id/unlock', (x) => unlockUser(x.user, x.id)],
  ['PUT', '/settings/:key', async (x) => {
    requireAdmin(x.user);
    const key = x.p.key;
    const v = checkSetting(key, x.body.value);
    await db()`insert into settings (key, value) values (${key}, ${db().json(v)}) on conflict (key) do update set value = excluded.value`;
    return { ok: true, value: v };
  }],
  ['POST', '/blackouts', (x) => addBlackout(x.user, x.body)],
  ['DELETE', '/blackouts/:id', (x) => delBlackout(x.user, x.id)],
  ['GET', '/bookings', (x) => listBookings(x.url)],
  ['POST', '/bookings/save', (x) => saveBooking(x.user, x.body)],
  ['DELETE', '/bookings', (x) => deleteBooking(x.user, x.url)],
  ['GET', '/sms/log', (x) => smsLog(x.user, x.url)],
  ['POST', '/sms/test', (x) => smsTest(x.user, x.body)],
  ['PUT', '/cash/lock', async (x) => { requireAdmin(x.user); return lockDay(x.user, x.body); }],
  ['DELETE', '/cash/lock', async (x) => { requireAdmin(x.user); const d = isoDate(x.url.searchParams.get('day')); if (!d) throw new HttpError(400, 'Bad day'); await db()`delete from cash_locks where day=${d}`; return { ok: true }; }],
  ['PUT', '/sched', (x) => putSched(x.user, x.body)],
  ['PUT', '/fees', (x) => putFees(x.user, x.body)],
  ['PUT', '/prefs', (x) => putPrefs(x.user, x.body)],
  ['GET', '/home', (x) => homeData(x.user, x.url.searchParams.get('rec') === '1')],
  ['POST', '/home/notes', (x) => addNote(x.user, x.body)],
  ['DELETE', '/home/notes/:id', (x) => delNote(x.user, x.id)],
  ['POST', '/home/notes/:id/heart', (x) => heartNote(x.user, x.id)],
  ['PUT', '/home/vote', (x) => vote(x.user, x.body)],
  ['GET', '/bookings/phone', (x) => phoneBookings(x.url)],
  ['GET', '/search', (x) => search(x.url)],
  ['GET', '/records/daily', async (x) => { requireAdmin(x.user); return recordsDaily(); }],
  ['GET', '/records/clients', async (x) => { requireAdmin(x.user); return recordsClients(x.url); }],
  ['GET', '/backup', async (x) => { requireAdmin(x.user); return backup(); }],
  ['GET', '/acct', async (x) => { requireAdmin(x.user); return getAcct(); }],
  ['PUT', '/cash', async (x) => { requireAdmin(x.user); return putCash(x.user, x.body); }],
  ['POST', '/pay/staff', async (x) => { requireAdmin(x.user); return addPayStaff(x.body); }],
  ['PATCH', '/pay/staff/:id', async (x) => { requireAdmin(x.user); return updPayStaff(Number(x.id), x.body); }],
  ['POST', '/pay/periods', async (x) => { requireAdmin(x.user); return addPeriod(x.body); }],
  ['PATCH', '/pay/periods/:id', async (x) => { requireAdmin(x.user); return updPeriod(Number(x.id), x.body); }],
  ['DELETE', '/pay/periods/:id', async (x) => { requireAdmin(x.user); await db()`delete from pay_periods where id=${Number(x.id)}`; return { ok: true }; }],
  ['PUT', '/pay/rows', async (x) => { requireAdmin(x.user); return putPayRow(x.body); }],
  ['GET', '/log', async (x) => { requireAdmin(x.user); return listLog(); }],
  ['POST', '/log/:id/restore', async (x) => { requireAdmin(x.user); return restoreRow(x.user, x.id); }],
].map(([method, pattern, fn]) => {
  const keys = [];
  const re = new RegExp('^' + pattern.replace(/:(\w+)/g, (_, k) => { keys.push(k); return '([^/]+)'; }) + '$');
  return { method, re, keys, fn };
});

export default async function handler(req) {
  const url = new URL(req.url);
  const path = url.pathname.replace(/^\/api/, '').replace(/\/+$/, '') || '/';
  try {
    if (req.method !== 'GET' && req.headers.get('x-tax') !== '1') throw new HttpError(403, 'Bad request');
    await ensureSchema();
    if (path === '/login' && req.method === 'POST') return await login(req);
    if (path === '/health' && req.method === 'GET') return await health();
    const pm = path.match(/^\/public\/b\/([^/]+)(\/ics)?$/);
    if (pm && req.method === 'GET') { const out = await publicBooking(pm[1], !!pm[2]); return out instanceof Response ? out : json(out, 200, { 'x-robots-tag': 'noindex' }); }
    if (path === '/logout' && req.method === 'POST') {
      try { const u = await requireUser(req); await db()`delete from sessions where token_hash=${u.token_hash}`; } catch { /* already out */ }
      return json({ ok: true }, 200, { 'set-cookie': cookieHeader('x', 0) });
    }
    for (const r of routes) {
      if (r.method !== req.method) continue;
      const m = path.match(r.re);
      if (!m) continue;
      const user = await requireUser(req);
      if (user.must_change && !['/me', '/password'].includes(path)) throw new HttpError(403, 'Please change your password first', { must_change: true });
      const p = {}; r.keys.forEach((k, i) => { p[k] = decodeURIComponent(m[i + 1]); });
      const body = ['POST', 'PUT', 'PATCH', 'DELETE'].includes(req.method) ? await req.json().catch(() => ({})) : {};
      const id = p.id !== undefined ? Number(p.id) : undefined;
      if (p.id !== undefined && !Number.isInteger(id)) throw new HttpError(400, 'Bad id');
      const out = await r.fn({ req, url, user, body, p, id });
      if (out instanceof Response) return out;
      return json(out ?? { ok: true });
    }
    throw new HttpError(404, 'Not found');
  } catch (e) {
    if (e instanceof HttpError) return json({ error: e.message, ...(e.extra || {}) }, e.status);
    console.error(e);
    return json({ error: 'Server error - please try again' }, 500);
  }
}

export const config = { path: '/api/*' };
