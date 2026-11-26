// v21.5/6: Quick reading — real daily horoscope in English (Free Horoscope API: free, no key).
// Cached in table `horoscopes` (1 row per sign per LA day). If a source fails we keep / show what we have.
import { db } from './core.mjs';

export const SIGNS = ['aries', 'taurus', 'gemini', 'cancer', 'leo', 'virgo', 'libra', 'scorpio', 'sagittarius', 'capricorn', 'aquarius', 'pisces'];
const HORO_URL = (s) => `https://freehoroscopeapi.com/api/v1/get-horoscope/daily?sign=${s}&day=today`;
export const HORO_SRC = { name: 'Free Horoscope API', url: 'https://freehoroscopeapi.com' };
const laDay = () => new Date().toLocaleDateString('en-CA', { timeZone: 'America/Los_Angeles' });

async function get(url, json) {
  const ctl = new AbortController(); const tm = setTimeout(() => ctl.abort(), 8000);
  try {
    const r = await fetch(url, { signal: ctl.signal, headers: { 'user-agent': 'Mozilla/5.0 (FSMA Tax quick reading)', accept: json ? 'application/json' : 'text/html' } });
    if (!r.ok) throw new Error('HTTP ' + r.status);
    return json ? await r.json() : await r.text();
  } finally { clearTimeout(tm); }
}
const clean = (t) => String(t || '').replace(/\s+/g, ' ').trim().slice(0, 1200);

async function fetchSign(sign) {
  const d = await get(HORO_URL(sign), true);
  const txt = clean(d && d.data && (d.data.horoscope || d.data.horoscope_data));
  if (!txt) throw new Error('empty');
  return txt;
}
export async function pullAll() { // daily from news-cron
  const sql = db(); const day = laDay(); const out = { ok: 0, fail: 0 };
  for (const s of SIGNS) {
    try { const txt = await fetchSign(s); await sql`insert into horoscopes (sign, day, text) values (${s}, ${day}, ${txt}) on conflict (sign, day) do update set text = excluded.text, fetched_at = now()`; out.ok++; }
    catch (e) { out.fail++; }
  }
  return out;
}

// GET /api/horoscope?sign=leo → { day, text, src }
export async function getReading(sign) {
  const sql = db(); const day = laDay();
  if (!SIGNS.includes(sign)) return { text: '' };
  let [r] = await sql`select text, day from horoscopes where sign = ${sign} and day = ${day}`;
  if (!r) { try { const txt = await fetchSign(sign); await sql`insert into horoscopes (sign, day, text) values (${sign}, ${day}, ${txt}) on conflict (sign, day) do nothing`; r = { text: txt, day }; } catch (e) { [r] = await sql`select text, day from horoscopes where sign = ${sign} order by day desc limit 1`; } }
  return { day: r ? String(r.day).slice(0, 10) : '', text: r ? r.text : '', src: HORO_SRC };
}
