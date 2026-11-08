// v17: text messages to customers (Twilio) + the customer booking page data.
// Without TWILIO_SID / TWILIO_TOKEN / TWILIO_FROM the messages are only logged as "demo" (nothing is sent).
import crypto from 'node:crypto';
import { env, HttpError } from './core.mjs';

export const SMS_DEFAULT = {
  on: false, from: '02-01', to: '04-15', quiet: ['08:00', '21:00'],
  business: 'First Source', phone: '714-640-6654', email: 'contact@fsma.team',
  address: '9741 Bolsa Avenue Suite 217, Westminster CA 92683',
  bring: "Photo ID, Social Security cards, W-2 / 1099 forms, last year's tax return.",
  created: { on: true, text: 'Your booking at {{ business }} is scheduled for {{ date }} at {{ hour }}. Manage it at {{ link }}' },
  updated: { on: true, text: 'Your booking at {{ business }} was updated: {{ link }}' },
  cancelled: { on: true, text: 'Your {{ business }} booking was cancelled. Hope to see you another day.' },
  reminder: { on: true, text: 'Just a reminder that your {{ business }} booking is on {{ date }} at {{ hour }}. Manage it at {{ link }}', before: [1440, 60] },
};
export const EVENTS = ['created', 'updated', 'cancelled', 'reminder'];

export function smsCfg(settings) {
  const v = settings?.sms || {};
  const o = { ...SMS_DEFAULT, ...v };
  for (const k of EVENTS) o[k] = { ...SMS_DEFAULT[k], ...(v[k] || {}) };
  return o;
}

const HHMM = /^\d{2}:\d{2}$/;
const MMDD = /^\d{2}-\d{2}$/;
export function checkSms(v) {
  if (!v || typeof v !== 'object') throw new HttpError(400, 'Bad settings');
  const S = (x, n) => String(x ?? '').slice(0, n);
  const o = {
    on: !!v.on,
    from: MMDD.test(v.from) ? v.from : '02-01', to: MMDD.test(v.to) ? v.to : '04-15',
    quiet: Array.isArray(v.quiet) && HHMM.test(v.quiet[0]) && HHMM.test(v.quiet[1]) ? [v.quiet[0], v.quiet[1]] : ['08:00', '21:00'],
    business: S(v.business, 60) || 'First Source', phone: S(v.phone, 30), email: S(v.email, 80), address: S(v.address, 160), bring: S(v.bring, 400),
  };
  for (const k of EVENTS) {
    const e = v[k] || {};
    o[k] = { on: !!e.on, text: S(e.text, 480) || SMS_DEFAULT[k].text };
    if (k === 'reminder') {
      const b = (Array.isArray(e.before) ? e.before : []).map(Number).filter((n) => Number.isInteger(n) && n >= 10 && n <= 10080);
      o[k].before = [...new Set(b)].slice(0, 4);
    }
  }
  return o;
}

// ---------- formatting ----------
const MON = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const DOW = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
export const fmtDay = (d) => { const x = new Date(d + 'T12:00:00Z'); return `${DOW[x.getUTCDay()]}, ${MON[x.getUTCMonth()]} ${x.getUTCDate()}`; };
export const fmtDayLong = (d) => fmtDay(d) + ', ' + d.slice(0, 4);
export const fmtHour = (slot) => { const [h, m] = String(slot).split(':').map(Number); return `${((h + 11) % 12) + 1}:${String(m).padStart(2, '0')} ${h < 12 ? 'AM' : 'PM'}`; };
export const fill = (t, vars) => String(t || '').replace(/\{\{\s*(\w+)\s*\}\}/g, (m, k) => (k in vars ? String(vars[k]) : m));
export const shortName = (n) => { const w = String(n || '').trim().split(/\s+/).filter(Boolean); if (!w.length) return ''; return w.length === 1 ? w[0] : `${w[0]} ${w[w.length - 1][0]}.`; };
export const siteUrl = () => (env('SITE_URL') || 'https://tax.fsma.team').replace(/\/+$/, '');
export const linkOf = (token) => `${siteUrl()}/b/${token}`;
export const newBookToken = () => crypto.randomBytes(8).toString('base64url').replace(/[-_]/g, '').slice(0, 10).padEnd(10, 'x');

export function toE164(p) {
  const d = String(p || '').replace(/\D/g, '');
  if (d.length === 10) return '+1' + d;
  if (d.length === 11 && d[0] === '1') return '+' + d;
  return null;
}
export const laNow = () => {
  const f = new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Los_Angeles', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' });
  const p = Object.fromEntries(f.formatToParts(new Date()).map((x) => [x.type, x.value]));
  return { date: `${p.year}-${p.month}-${p.day}`, time: `${p.hour}:${p.minute}` };
};
export function inSeason(cfg, date) { const md = date.slice(5); return cfg.from <= cfg.to ? md >= cfg.from && md <= cfg.to : md >= cfg.from || md <= cfg.to; }

// the data the customer page shows (kept even after the booking is cancelled)
export function linkData(b) {
  const withName = b.cal !== 'Office' ? b.cal : (b.preparer || '');
  return { name: shortName(b.client), day: b.day, slot: b.slot, cal: b.cal, with: withName, files: b.files };
}

// ---------- sending ----------
// when may a message created now be sent: now, or at the start of the next allowed window (LA time)
export async function sendAtFor(sql, cfg) {
  const n = laNow();
  const [a, b] = cfg.quiet;
  if (n.time >= a && n.time < b) return null;
  const day = n.time < a ? n.date : new Date(Date.parse(n.date + 'T12:00:00Z') + 864e5).toISOString().slice(0, 10);
  const [{ t }] = await sql`select ((${day}::date + ${a}::time) at time zone 'America/Los_Angeles') as t`;
  return t;
}

export async function queueSms(sql, { token, kind, ref = '', phone, body, sendAt = null, by = null }) {
  const to = toE164(phone);
  if (!to) {
    const [r] = await sql`insert into sms_log (token, kind, ref, to_phone, body, status, error, created_by) values (${token}, ${kind}, ${ref}, ${String(phone || '').slice(0, 30)}, ${body}, 'skipped', 'Số điện thoại không đúng (cần 10 số)', ${by}) returning id`;
    return { id: r.id, skipped: true };
  }
  const rows = await sql`insert into sms_log (token, kind, ref, to_phone, body, send_at, created_by)
    values (${token}, ${kind}, ${ref}, ${to}, ${body}, ${sendAt || sql`now()`}, ${by})
    on conflict do nothing returning id, send_at <= now() as due`;
  return rows[0] ? { id: rows[0].id, due: rows[0].due } : null;
}

async function twilio(to, body) {
  const sid = env('TWILIO_SID'), tok = env('TWILIO_TOKEN'), from = env('TWILIO_FROM');
  if (!sid || !tok || !from) return { demo: true };
  const form = new URLSearchParams({ To: to, Body: body });
  if (/^MG/.test(from)) form.set('MessagingServiceSid', from); else form.set('From', from);
  const ctl = new AbortController(); const tm = setTimeout(() => ctl.abort(), 8000);
  try {
    const r = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${sid}/Messages.json`, {
      method: 'POST', signal: ctl.signal,
      headers: { authorization: 'Basic ' + Buffer.from(sid + ':' + tok).toString('base64'), 'content-type': 'application/x-www-form-urlencoded' },
      body: form,
    });
    const d = await r.json().catch(() => ({}));
    if (!r.ok) return { error: (d.code ? d.code + ': ' : '') + (d.message || 'HTTP ' + r.status), hard: r.status < 500 };
    return { id: d.sid };
  } catch (e) {
    return { error: e.name === 'AbortError' ? 'Twilio không trả lời (timeout)' : String(e.message || e) };
  } finally { clearTimeout(tm); }
}

// send one queued message (claims it first so two runs never send it twice)
export async function sendOne(sql, id) {
  const [m] = await sql`update sms_log set status='sending', tries=tries+1 where id=${id} and status in ('queued','failed') and send_at <= now() returning *`;
  if (!m) return null;
  const r = await twilio(m.to_phone, m.body);
  if (r.demo) { await sql`update sms_log set status='demo', sent_at=now() where id=${id}`; return 'demo'; }
  if (r.id) { await sql`update sms_log set status='sent', sent_at=now(), provider_id=${r.id}, error=null where id=${id}`; return 'sent'; }
  const final = r.hard || m.tries >= 3;
  await sql`update sms_log set status=${final ? 'failed' : 'queued'}, error=${String(r.error).slice(0, 300)},
    send_at = case when ${final} then send_at else now() + interval '10 minutes' end where id=${id}`;
  return 'failed';
}

// run by the scheduled function: reminders that are due + anything still waiting in the queue
export async function runQueue(sql, settings) {
  const cfg = smsCfg(settings);
  const out = { reminders: 0, sent: 0 };
  const n = laNow();
  if (cfg.on && cfg.reminder.on && inSeason(cfg, n.date)) {
    for (const before of cfg.reminder.before || []) {
      const due = await sql`select b.*, ((b.day + b.slot::time) at time zone 'America/Los_Angeles') as at
        from bookings b
        where b.sms and b.token is not null and b.day between current_date - 1 and current_date + 8
          and ((b.day + b.slot::time) at time zone 'America/Los_Angeles') > now()
          and ((b.day + b.slot::time) at time zone 'America/Los_Angeles') - ${before + ' minutes'}::interval <= now()
          and ((b.day + b.slot::time) at time zone 'America/Los_Angeles') - ${before + ' minutes'}::interval > now() - interval '45 minutes'
          and b.sched_at < ((b.day + b.slot::time) at time zone 'America/Los_Angeles') - ${before + ' minutes'}::interval`;
      for (const b of due) {
        const body = fill(cfg.reminder.text, { business: cfg.business, date: fmtDay(b.day), hour: fmtHour(b.slot), link: linkOf(b.token), name: shortName(b.client), preparer: b.cal !== 'Office' ? b.cal : b.preparer });
        const q = await queueSms(sql, { token: b.token, kind: 'reminder', ref: `${before}@${b.day} ${b.slot}`, phone: b.phone, body, by: 'auto' });
        if (q && !q.skipped) out.reminders++;
      }
    }
  }
  const ids = await sql`select id from sms_log where status in ('queued') and send_at <= now() and created_at > now() - interval '2 days' order by id limit 25`;
  for (const { id } of ids) { if (await sendOne(sql, id)) out.sent++; }
  return out;
}
