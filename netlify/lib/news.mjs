// v20: news that updates itself (no AI). Reads official list pages, keeps title + 1 short sentence.
// tax feed: 2 IRS + 2 California (FTB) · payroll feed: 3 (IRS payroll/employer, CA EDD, SSA wage base)
// A source that fails keeps the old items.
import { db } from './core.mjs';

export const SOURCES = {
  tax: [
    { grp: 'IRS', name: 'IRS', url: 'https://www.irs.gov/newsroom/news-releases-for-current-month', href: /^\/newsroom\/[a-z0-9-]{12,}$/, take: 2 },
    { grp: 'CA', name: 'CA FTB · Tax News', url: 'https://www.ftb.ca.gov/about-ftb/newsroom/tax-news/index.html', mode: 'headings', take: 2 },
    { grp: 'CA', name: 'CA FTB', url: 'https://www.ftb.ca.gov/about-ftb/newsroom/index.html', href: /^\/about-ftb\/newsroom\/\d{4}\/[a-z0-9-]+\.html$/, take: 2 },
  ],
  payroll: [
    { grp: 'IRS', name: 'IRS · employers', url: 'https://www.irs.gov/newsroom/news-releases-for-current-month', href: /^\/newsroom\/[a-z0-9-]{12,}$/, kw: /payroll|employer|w-2|941|withholding|wage|social security|fica|1099/i, take: 1 },
    { grp: 'EDD', name: 'California EDD', url: 'https://edd.ca.gov/en/about_edd/news_releases_and_announcements/', href: /news_releases|newsroom|news/i, kw: /payroll|employer|sdi|wage|tax|ui /i, take: 1 },
    { grp: 'SSA', name: 'Social Security', url: 'https://www.ssa.gov/news/press/releases/', href: /press\/releases|newsroom/i, kw: /wage base|cola|cost-of-living|earnings|benefit/i, take: 1 },
    { grp: 'CA', name: 'CA Dept. of Industrial Relations', url: 'https://www.dir.ca.gov/mediaroom.html', href: /DIRNews/i, kw: /minimum wage|wage|employer/i, take: 1 },
  ],
};
const PICK = { tax: { IRS: 2, CA: 2 }, payroll: null };

const MON = 'Jan(?:uary)?|Feb(?:ruary)?|Mar(?:ch)?|Apr(?:il)?|May|Jun(?:e)?|Jul(?:y)?|Aug(?:ust)?|Sep(?:t(?:ember)?)?|Oct(?:ober)?|Nov(?:ember)?|Dec(?:ember)?';
const DATE_RE = new RegExp(`(${MON})\\.?\\s+\\d{1,2},\\s+\\d{4}`);
const strip = (h) => String(h || '').replace(/<script[\s\S]*?<\/script>|<style[\s\S]*?<\/style>/gi, ' ').replace(/<[^>]+>/g, ' ')
  .replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/&#039;|&rsquo;|&#8217;/g, '’').replace(/&quot;|&ldquo;|&rdquo;/g, '"').replace(/&mdash;|&#8212;/g, '—').replace(/&ndash;/g, '–').replace(/&[a-z]+;/g, ' ').replace(/\s+/g, ' ').trim();
const sentence = (t) => { const x = t.replace(/^(IR-\d{4}-\d+,?\s*)?((?:[A-Z][a-z]{2,8}\.?\s+\d{1,2},\s+\d{4})\s*[—-]?\s*)?/, '').trim(); const m = x.match(/^(.{20,240}?[.!?])(\s|$)/); return (m ? m[1] : x.slice(0, 220)).trim(); };

async function getHtml(url) {
  const ctl = new AbortController(); const tm = setTimeout(() => ctl.abort(), 12000);
  try {
    const r = await fetch(url, { signal: ctl.signal, headers: { 'user-agent': 'Mozilla/5.0 (FSMA Tax news reader)', accept: 'text/html,application/xhtml+xml' } });
    if (!r.ok) throw new Error('HTTP ' + r.status);
    return await r.text();
  } finally { clearTimeout(tm); }
}

function parseLinks(html, src) {
  const base = new URL(src.url); const out = []; const seen = new Set();
  const re = /<a\b[^>]*href="([^"#]+)"[^>]*>([\s\S]*?)<\/a>/gi; let m;
  while ((m = re.exec(html))) {
    let href = m[1].trim(); const title = strip(m[2]);
    if (title.length < 20 || title.length > 200) continue;
    let path; try { const u = new URL(href, base); if (u.host !== base.host) continue; path = u.pathname; href = u.href; } catch { continue; }
    if (src.href && !src.href.test(path)) continue;
    if (seen.has(href)) continue;
    const after = strip(html.slice(m.index + m[0].length, m.index + m[0].length + 900));
    if (src.kw && !src.kw.test(title + ' ' + after.slice(0, 300))) continue;
    seen.add(href);
    out.push({ title, url: href, published: (after.match(DATE_RE) || [''])[0], summary: sentence(after) });
  }
  return out;
}
function parseHeadings(html, src) {
  const out = []; const re = /<h([23])\b[^>]*?(?:id="([^"]+)")?[^>]*>([\s\S]*?)<\/h\1>/gi; let m; let i = 0;
  const pageDate = (strip(html).match(new RegExp(`(${MON})\\s+\\d{4}`)) || [''])[0];
  while ((m = re.exec(html))) {
    const title = strip(m[3]); if (title.length < 15 || title.length > 160 || /^(tax news|contents|in this edition|subscribe)/i.test(title)) continue;
    i++;
    const after = strip(html.slice(m.index + m[0].length, m.index + m[0].length + 1200));
    out.push({ title, url: src.url + '#' + (m[2] || 'article' + i), published: pageDate, summary: sentence(after) });
  }
  return out;
}

export async function pullFeed(feed) {
  const sql = db(); const errs = []; let added = 0;
  for (const src of SOURCES[feed] || []) {
    try {
      const html = await getHtml(src.url);
      const items = (src.mode === 'headings' ? parseHeadings(html, src) : parseLinks(html, src)).slice(0, src.take + 2);
      if (!items.length) throw new Error('không thấy tin');
      let k = 0;
      for (const it of items) {
        await sql`insert into news_items (feed, grp, source, title, summary, url, published, fetched_at) values (${feed}, ${src.grp}, ${src.name}, ${it.title.slice(0, 200)}, ${it.summary.slice(0, 300)}, ${it.url.slice(0, 500)}, ${it.published.slice(0, 40)}, now() - ${k + ' seconds'}::interval)
          on conflict (feed, url) do update set title=excluded.title, summary=excluded.summary, published=excluded.published`;
        k++; added++;
      }
    } catch (e) { errs.push(`${src.name}: ${e.message}`); }
  }
  await sql`update news_feeds set last_run=now(), last_error=${errs.join(' · ') || null} where feed=${feed}`;
  return { feed, added, errors: errs };
}

const pdate = (p) => { const t = Date.parse(String(p || '').replace(/\./g, '')); return Number.isNaN(t) ? 0 : t; };
export async function getNews(feed, all = false) {
  const sql = db();
  const rows = await sql`select * from news_items where feed=${feed} ${all ? sql`` : sql`and hidden = false`} order by fetched_at desc, id desc limit 60`;
  const L = rows.map((r) => ({ id: Number(r.id), grp: r.grp, src: r.source, title: r.title, txt: r.summary, url: r.url, date: r.published, hidden: r.hidden, at: r.fetched_at }))
    .sort((a, b) => pdate(b.date) - pdate(a.date) || new Date(b.at) - new Date(a.at));
  const [f] = await sql`select * from news_feeds where feed=${feed}`;
  if (all) return { items: L, feed: f || null };
  let items;
  if (PICK[feed]) { items = []; Object.entries(PICK[feed]).forEach(([g, n]) => items.push(...L.filter((x) => x.grp === g).slice(0, n))); }
  else { const seen = new Set(); items = []; L.forEach((x) => { if (items.length < 3 && !seen.has(x.grp)) { seen.add(x.grp); items.push(x); } }); L.forEach((x) => { if (items.length < 3 && !items.includes(x)) items.push(x); }); }
  return { items, last: f?.last_run || null };
}

// run feeds whose every_days has passed (called daily by news-cron)
export async function runDue(force = false) {
  const sql = db(); const out = [];
  const feeds = await sql`select * from news_feeds`;
  for (const f of feeds) {
    const age = f.last_run ? Date.now() - new Date(f.last_run).getTime() : Infinity;
    const monday = new Date().toLocaleDateString('en-US', { timeZone: 'America/Los_Angeles', weekday: 'short' }) === 'Mon';
    const due = force || (f.feed === 'payroll' ? (monday && age > 5 * 24 * 3600e3) || age > 8 * 24 * 3600e3 : age > (f.every_days * 24 - 2) * 3600e3);
    if (due) out.push(await pullFeed(f.feed));
  }
  return out;
}
