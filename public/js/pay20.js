// tax.fsma.team v20 - tab "Payroll & Service" (Admin only). Port of the Business v1 / mockup v20 client.
// Everything lives inside PAY20 so names (render, modal, toast, P, B, $ ...) do not clash with the Tax scripts.
window.PAY20 = (function () {
let TODAY = todayISO();
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const esc = (s) => String(s ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const md = (iso) => iso ? `${iso.slice(5, 7)}/${iso.slice(8, 10)}/${iso.slice(0, 4)}` : '';
const usd = (n) => n == null || n === '' ? '' : (n < 0 ? '-$' : '$') + Math.round(Math.abs(Number(n))).toLocaleString('en-US');
const days = (iso) => Math.round((new Date(iso + 'T12:00') - new Date(TODAY + 'T12:00')) / 864e5);
const MON = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const MONL = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const MONV = MON.map((_, i) => 'tháng ' + (i + 1));
const PERIODS = ['Bi-weekly', 'Semi-monthly', 'Monthly', 'Quarterly'];
const PLABEL = { 'Bi-weekly': 'Bi-weekly (2 wks)', 'Semi-monthly': 'Semi-monthly (15 / 30)', Monthly: 'Monthly', Quarterly: 'Quarterly' };
const toast = (t, bad) => window.toast(t, bad);
const failT = (e) => { if (e && e.status === 401) return; toast((e && e.message) || 'Có lỗi xảy ra', true); };
let PHONE = isPhone();
const ti = (c) => V20.ti(c);
let CY = +TODAY.slice(0, 4), CYS = String(CY), PY = String(CY - 1);
const ME = () => (S.me && S.me.display_name) || '';
// ---------- data (GET /api/pr/data) ----------
const KEEP = new Set(['LLC', 'LLP', 'LP', 'PC', 'USA', 'US', 'II', 'III', 'IV', 'CPA', 'DDS', 'MD', 'PA', 'LA', 'CA']);
function nice(n) {
  return String(n || '').replace(/\s+/g, ' ').trim().split(' ').map((w) => {
    const core = w.replace(/[^A-Za-z]/g, ''); const U = core.toUpperCase();
    if (KEEP.has(U)) return w.toUpperCase(); if (U === 'DBA') return 'dba';
    if (core && core.length <= 3 && !/[AEIOUY]/i.test(core)) return w.toUpperCase();
    return w.toLowerCase().replace(/(^|[^a-z'’])([a-z])/g, (m, a, c) => a + c.toUpperCase());
  }).join(' ');
}
let DATA = { biz: [], side: [], waived: [], templates: [], price: [], encOk: true };
let B = []; let byId = {}; let BKEY = [];
const STOPW = new Set(['llc', 'inc', 'corp', 'corporation', 'co', 'the', 'and', 'company', 'limited', 'liability', 'dba', 'services', 'service']);
const nkey = (n) => String(n || '').toLowerCase().replace(/&/g, ' and ').replace(/[^a-z0-9 ]/g, ' ').split(/\s+/).filter((w) => w && !STOPW.has(w)).join(' ');
function match1099(name) { const k = nkey(name); if (k.length < 4) return null; const ex = BKEY.find(([bk]) => bk === k); if (ex) return ex[1]; const pre = BKEY.filter(([bk]) => bk.startsWith(k + ' ')); return pre.length === 1 ? pre[0][1] : null; }
const relink1099 = () => { B.forEach((b) => { b.f1099 = {}; }); DATA.side.forEach((o) => { if (o.bid && byId[o.bid]) { const b = byId[o.bid]; (b.f1099[o.year] ||= []).push(o); } }); };
let ST = { loaded: false, loading: false, err: '', autoWaive: false };
function init(D) {
  DATA = D; TODAY = D.today || todayISO(); CY = +TODAY.slice(0, 4); CYS = String(CY); PY = String(CY - 1);
  B = D.biz; byId = Object.fromEntries(B.map((b) => [b.id, b]));
  B.forEach((b) => {
    b.city = (b.addr.match(/,\s*([^,]+?),?\s+(CA|SC|MO|TX|NV|AZ|WA|OR)\b/i) || b.addr.match(/\s([A-Za-z ]+?)\s+CA\s+\d/) || [])[1] || '';
    const p = b.payroll;
    if (p) { p.has_pin = !!p.pin; p.has_pw = !!p.pw; p.has_bank = !!(p.routing || p.account); }
    b.fk = { ssn: b.ssn || '', pin: p ? p.pin : '', pw: p ? p.pw : '', bank: p ? [p.routing, p.account].filter(Boolean).join(' / ') : '' };
    b.rep ||= {};
  });
  BKEY = B.map((b) => [nkey(b.name), b]);
  DATA.side.forEach((o) => { o.key ||= nkey(o.name); });
  relink1099();
  WAIVED.clear(); (D.waived || []).forEach((k) => WAIVED.add(k));
  TPL = (D.templates || []).map((t) => ({ id: t.id, name: t.name, en: { ...t.en }, vn: { ...t.vn } }));
  const ys = new Set([CYS]); B.forEach((b) => Object.keys(b.fees).forEach((y) => ys.add(y))); DATA.side.forEach((o) => ys.add(String(o.year)));
  YEARS = [...ys].sort().reverse().slice(0, 8);
  PQ.y = CY; PQ.q = Math.ceil(+TODAY.slice(5, 7) / 3); CUR_M = +TODAY.slice(5, 7);
  ST.loaded = true;
}
function load(then) {
  if (ST.loading) return; ST.loading = true; ST.err = '';
  api('GET', '/pr/data').then((d) => { init(d); ST.loading = false; if (ST.autoWaive) { ST.autoWaive = false; autoWaive(); } if (then) then(); else if (S.page === 'pay') { render.keep = true; render(); } })
    .catch((e) => { ST.loading = false; ST.err = (e && e.message) || 'Lỗi'; if (S.page === 'pay') render(); });
}
// after an import: waive old balances (companies whose unpaid items are all before this year)
function autoWaive() {
  const keys = []; owed().filter((o) => o.items.length && o.items.every((i) => +i.y < CY)).forEach((o) => o.items.forEach((i) => { if (!i.waived) keys.push(i.k); }));
  if (!keys.length) return; keys.forEach((k) => WAIVED.add(k));
  api('PUT', '/pr/waive', { keys, on: true }).then(() => toast(`Đã waive ${keys.length} khoản cũ`)).catch(failT);
}
// news (GET /api/news?feed=payroll)
let NEWS = null; let NEWSL = false;
function loadNews() { if (NEWS || NEWSL) return; NEWSL = true; api('GET', '/news?feed=payroll').then((d) => { NEWS = d; NEWSL = false; if (S.page === 'pay' && CUR.r === 'home') { render.keep = true; render(); } }).catch(() => { NEWSL = false; NEWS = { items: [] }; }); }
function quarterCells(b, y, q) {
  const R = (b.rep[y] ||= { m: Array(12).fill(null), q: Array(4).fill(null) });
  const m = R.m.slice((q - 1) * 3, q * 3); let Q = R.q[q - 1];
  if (m.every((v) => v === null) && Q === null) { // no box in the sheet yet -> same rule as the latest known quarter
    const last = lastRule(b); if (last === 'M') { for (let i = 0; i < 3; i++) R.m[(q - 1) * 3 + i] = 0; } else R.q[q - 1] = 0;
    return quarterCells(b, y, q);
  }
  return { m: R.m.slice((q - 1) * 3, q * 3), q: R.q[q - 1], R };
}
function lastRule(b) {
  const R = b.rep[CY] || { m: Array(12).fill(null), q: Array(4).fill(null) }; for (let q = 4; q >= 1; q--) { const m = R.m.slice((q - 1) * 3, q * 3); if (m.some((v) => v !== null)) return 'M'; if (R.q[q - 1] !== null) return 'Q'; }
  return b.payroll && b.payroll.period === 'Quarterly' ? 'Q' : 'M';
}
const noteFees = (b, y) => b.notes.filter((n) => n.amt && n.d.startsWith(y));
const yrTotal = (b, y) => (b.fees[y] || []).reduce((s, l) => s + Object.values(l.m).reduce((a, v) => a + v, 0) + (l.extra || 0), 0) + (b.f1099[y] || []).reduce((s, o) => s + o.amt, 0) + noteFees(b, y).reduce((s, n) => s + n.amt, 0);
const qSum = (l, q) => [1, 2, 3].reduce((s, k) => s + (l.m[(q - 1) * 3 + k] || 0), 0);
const svcHtml = (b) => {
  const s = [];
  if (b.payroll && b.payroll.active) s.push('<span class="sv sv-pr">PAYROLL</span>'); else if (b.payroll) s.push('<span class="sv sv-off">payroll (old)</span>');
  if ((b.fees[CYS] || []).some((l) => l.svc === 'Bookkeeping')) s.push('<span class="sv sv-bk">BOOKKEEPING</span>'); // v4: SI service removed
  if (b.formation) s.push('<span class="sv sv-fm">FORMATION</span>');
  if (Object.keys(b.f1099).length) s.push('<span class="sv sv-99">1099</span>');
  return s.join('');
};
const pp = (p) => `<span class="pp ${p || 'off'}"><i></i>${esc(p || '—')}</span>`;
const missing = (b) => [!b.ein && 'EIN', !b.phone && 'phone', !b.owner && 'owner', !b.type && 'type'].filter(Boolean);
const feeTxt = (b) => b.payroll ? (b.payroll.fee != null ? usd(b.payroll.fee) : esc(b.payroll.fee_txt) || '—') : '—';
const cp = (v, cls = '') => v ? `<span class="copy ${cls}" data-copy="${esc(v)}">${esc(v)}</span>` : '<span class="faint">—</span>';

// email templates (Settings)
let OFFICE = 'First Source Multi Agency\n(714) 000-0000';
let TPL = [];

// ---------- shell ----------
function shell(route = CUR.r === 'b' ? 'biz' : CUR.r) { // mockup: sub-tabs live in the Tax 2nd row (where the staff tabs are)
  const items = [['home', 'Home'], ['payroll', 'Payroll', B.filter((b) => b.payroll && b.payroll.active).length], ['formations', 'Formations', B.filter((b) => b.formation).length], ['biz', 'Businesses', B.length], ['search', 'Search'], ['fees', 'Fees'], ['settings', 'Settings']];
  const sh = $('#sheets'); if (!sh) return; sh.innerHTML = '<span class="sublbl19">Payroll &amp; Service ›</span>' + items.map(([k, t, n]) => `<a href="#/p/${k}" class="sub19 ${route === k ? 'on' : ''}">${t}${n != null ? ` <span class="count">${n}</span>` : ''}</a>`).join('');
}
const P = {};

// ---------- money owed (v4) ----------
// filled cell = received, blank = not paid. Due = every month of 2026 up to this month + older years (unless waived)
let CUR_M = +TODAY.slice(5, 7);
const isDue = (y, m) => +y < CY || m <= CUR_M;
const WAIVED = new Set(); // bid|year|label
function owed() {
  const out = [];
  B.forEach((b) => {
    const items = [];
    Object.entries(b.fees).forEach(([y, L]) => L.forEach((l) => {
      const ms = Object.keys(l.m).map(Number).filter((m) => l.m[m] != null); if (!ms.length) return;
      let stop = l.flags.length ? Math.min(...l.flags.map((f) => +f.split(':')[0])) : 13;
      const lastPaid = Math.max(...ms);
      const left = +y < CY ? !(b.fees[+y + 1] || []).some((x) => x.svc === l.svc) : (l.svc === 'Payroll' && !(b.payroll && b.payroll.active));
      if (left) stop = Math.min(stop, lastPaid + 1);
      const nq = ms.filter((m) => m % 3 !== 0).length; const monthly = nq >= 2 && nq >= ms.length - nq; const first = Math.min(...ms);
      const push = (m, label, amt) => { const k = `${b.id}|${y}|${l.svc}|${label}`; items.push({ y, m, label, amt, svc: l.svc, k, waived: WAIVED.has(k) }); };
      if (monthly) { let last = 0; for (let m = first; m < stop; m++) { if (l.m[m] != null) { last = l.m[m] || last; continue; } if (!isDue(y, m)) continue; push(m, MON[m - 1] + ' ' + y, last); } }
      else { let last = 0; for (let q = Math.ceil(first / 3); q <= 4 && q * 3 < stop + 2; q++) { if ([1, 2, 3].some((k) => l.m[(q - 1) * 3 + k] != null)) { last = qSum(l, q) || last; continue; } if (!isDue(y, q * 3)) continue; push(q * 3, 'Q' + q + ' ' + y, last); } }
    }));
    if (items.length) out.push({ b, items, total: items.filter((i) => !i.waived).reduce((s, i) => s + i.amt, 0), waived: items.every((i) => i.waived) });
  });
  return out.sort((a, c) => c.total - a.total);
}
const statStrip = (list) => `<div class="sstrip">${list.map(([l, v, sub, cls = '']) => `<div class="ss ${cls}"><div class="ssl">${/class="dot"/.test(l) ? '' : ti()}${l}</div><div class="ssv">${v}</div>${sub ? `<div class="sss">${sub}</div>` : ''}</div>`).join('')}</div>`;


// ---------- Home ----------
let showWaived = false;
P.home = () => HOME();
function monthTotals(y) {
  const pay = Array(12).fill(0), oth = Array(12).fill(0);
  B.forEach((b) => (b.fees[y] || []).forEach((l) => Object.entries(l.m).forEach(([k, v]) => { (l.svc === 'Payroll' ? pay : oth)[k - 1] += v; })));
  return { pay, oth };
}

// ---------- Businesses (like OBM) ----------
const LS = { q: '', f: 'all', type: '', sort: 'name' };
let OPEN_MODE = 'popup';
P.biz = () => `<div class="page-head"><div><h1>Businesses</h1></div>
    <div class="btnrow"><button class="btn primary" data-pa="newbiz">+ New business</button></div></div>
  <div class="searchbar"><input type="search" id="bq" placeholder="Search name, owner, EIN, phone, city…" style="width:330px" value="${esc(LS.q)}">
    <div class="tabs plain" id="bf">${[['all', 'All'], ['pr', 'Payroll'], ['bk', 'Bookkeeping'], ['99', '1099'], ['fm', 'Formation'], ['miss', 'Missing info'], ['off', 'Closed / old']].map(([k, t]) => `<button data-f="${k}" class="${LS.f === k ? 'on' : ''}">${t} <span class="n">${bizFilter(k).length}</span></button>`).join('')}</div>
    <select id="bt" style="width:auto"><option value="">All types</option>${['LLC', 'S-Corp', 'Corp', 'C-Corp', 'Sole Prop'].map((t) => `<option ${LS.type === t ? 'selected' : ''}>${t}</option>`).join('')}</select>
    <select class="mfilter" id="bfm">${[['all', 'All'], ['pr', 'Payroll'], ['bk', 'Bookkeeping'], ['99', '1099'], ['fm', 'Formation'], ['miss', 'Missing'], ['off', 'Closed']].map(([k, t]) => `<option value="${k}" ${LS.f === k ? 'selected' : ''}>${t}</option>`).join('')}</select></div>
  <div id="blist"></div>`;
function bizFilter(f) { return B.filter((b) => f === 'all' ? true : f === 'pr' ? b.payroll && b.payroll.active : f === 'bk' ? hasBK(b) : f === '99' ? Object.keys(b.f1099).length : f === 'fm' ? b.formation : f === 'miss' ? missing(b).length : b.status !== 'Active'); }
function drawBiz() {
  const q = LS.q.toLowerCase(); const qd = q.replace(/\D/g, '');
  let L = bizFilter(LS.f).filter((b) => (!LS.type || b.type === LS.type) && (!q || [b.name, b.owner, b.city, b.addr, b.email].join(' ').toLowerCase().includes(q) || (qd.length >= 3 && (b.ein + b.phone).replace(/\D/g, '').includes(qd))));
  const s = LS.sort; L = [...L].sort((a, b) => s === 'type' ? a.type.localeCompare(b.type) : s === 'owner' ? a.owner.localeCompare(b.owner) : a.name.localeCompare(b.name, 'en', { sensitivity: 'base' }));
  const hl = (t) => q ? esc(t).replace(new RegExp(q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'ig'), (m) => `<mark>${m}</mark>`) : esc(t);
  $('#blist').innerHTML = `<div class="pager"><span>${L.length} found</span></div>
  <table class="t blist"><thead><tr><th class="mx">#</th><th class="sort" data-s="name">Business name</th><th class="sort" data-s="type">Type</th><th>EIN</th><th>Phone</th><th>City</th><th class="sort" data-s="owner">Owner</th><th>Services</th></tr></thead><tbody>
  ${L.map((b, i) => `<tr class="click ${b.status !== 'Active' ? 'faint' : ''}" data-biz="${b.id}">
    <td class="bno muted">${i + 1}</td><td class="bnm"><span class="name-cell" style="${b.status !== 'Active' ? 'color:#8a96a3' : ''}">${hl(b.name)}</span>${b.status !== 'Active' ? ` <span class="small faint">${b.status}</span>` : ''}${missing(b).length ? ` <span class="small" style="color:#c0392b" title="Missing: ${missing(b).join(', ')}">●</span>` : ''}</td>
    <td class="bty nowrap">${esc(b.type) || '<span class="faint">?</span>'}</td><td class="bein num nowrap">${hl(b.ein)}</td><td class="bph nowrap">${hl(b.phone)}</td><td class="bad small">${hl(b.city)}</td>
    <td class="bow">${hl(b.owner)}</td><td class="bsv">${svcHtml(b)}</td><td class="bsub" style="display:none">${esc([b.owner, b.phone, b.city].filter(Boolean).join(' · '))}</td></tr>`).join('')}
  </tbody></table>`;
  if (PHONE) $$('#blist .bsub').forEach((x) => { x.style.display = ''; });
}

// ---------- Business pop-up (v5: Linked records + Fees paid like before, notes with a fee column) ----------
const hasBK = (b, y = CYS) => (b.fees[y] || []).some((l) => l.svc === 'Bookkeeping');
const everBK = (b) => Object.values(b.fees).flat().some((l) => l.svc === 'Bookkeeping');
function yearRows(b, y) { // per service: Q1..Q4, extra
  const out = {}; const add = (k, q, v) => { const o = (out[k] ||= { q: [0, 0, 0, 0], x: 0 }); if (q === 'x') o.x += v; else o.q[q] += v; };
  (b.fees[y] || []).forEach((l) => { const k = l.svc === 'Payroll' || l.svc === 'Bookkeeping' ? l.svc : 'Other'; [1, 2, 3, 4].forEach((q) => add(k, q - 1, qSum(l, q))); if (l.extra) add(k, 'x', l.extra); });
  (b.f1099[y] || []).forEach((o) => add('1099', 'x', o.amt));
  noteFees(b, y).forEach((n) => add('Other', Math.ceil(+n.d.slice(5, 7) / 3) - 1, n.amt));
  return out;
}
function bizBody(b, inPop) {
  const p = b.payroll;
  const kv = (l, v) => `<div class="kv"><span>${l}</span><div>${v}</div></div>`;
  const years = [...new Set(Object.keys(b.fees).concat(Object.keys(b.f1099), b.notes.filter((n) => n.amt).map((n) => n.d.slice(0, 4))))].sort().reverse();
  const same = b.owner ? B.filter((x) => x.id !== b.id && x.owner && x.owner.toLowerCase().replace(/\W/g, '') === b.owner.toLowerCase().replace(/\W/g, '')) : [];
  const f99 = Object.entries(b.f1099).sort().reverse();
  const links = [
    ['Payroll', !p ? '<span class="faint">N/a</span>' : `<a href="#/p/payroll/${b.id}">${p.active ? 'Active' : 'Inactive'}</a>${p.active ? ` <span class="muted">· ${esc(p.period)} · ${feeTxt(b)}/month</span>` : ''}`],
    ['Bookkeeping', hasBK(b) ? `<a href="#/p/fees/${b.id}">Active</a>` : everBK(b) ? '<span class="muted">Inactive</span>' : '<span class="faint">N/a</span>'],
    ['Formation', b.formation ? `<a href="#/p/formations/${b.id}">#${b.formation.no} · ${md(b.formation.date)}</a> <span class="muted">· fee paid</span> <b>${usd(b.formation.fee) || '—'}</b>` : '<span class="faint">N/a</span>'],
    ['1099', f99.length ? f99.map(([y, L]) => `${y} <b>${usd(L.reduce((s, o) => s + o.amt, 0))}</b>`).join(' · ') : '<span class="faint">N/a</span>'],
  ];
  if (same.length) links.push(['Same owner', same.map((x) => `<a href="#/p/b/${x.id}" data-biz="${x.id}">${esc(x.name)}</a>`).join(', ')]);
  return `<div class="bd-head"><div><h1>${esc(b.name)}</h1>
      <div class="client-meta"><b style="color:#333">${esc(b.type) || 'Type ?'}</b>${svcHtml(b)}${missing(b).length ? `<span class="late small">missing ${missing(b).join(', ')}</span>` : ''}</div></div>
    <div class="btnrow">${p && p.active ? `<button class="btn" data-email="${b.id}">Prep email</button>` : ''}<button class="btn bkbtn" data-bk="${b.id}">Bookkeeping</button><button class="btn" data-edit="${b.id}">Edit</button>${inPop ? '<button class="btn" data-x>Close</button>' : ''}</div></div>
  <div class="bd-grid">
    <div class="kvbox">${kv('Business name', cp(b.name))}${kv('Entity type', esc(b.type) || '<span class="faint">?</span>')}${kv('EIN', cp(b.ein, 'num'))}${kv('SOS #', cp(b.sos))}${kv('EDD #', p ? cp(p.eddno) : '<span class="faint">—</span>')}${kv('EFTPS PIN', p && p.has_pin ? cp(b.fk.pin, 'num') : '<span class="faint">—</span>')}${kv('Password', p && p.has_pw ? cp(b.fk.pw) : p && p.pw_note ? `<span class="soon">${esc(p.pw_note)}</span>` : '<span class="faint">—</span>')}</div>
    <div class="kvbox">${kv('Pay period & fee', p ? `${pp(p.active ? p.period : '')} <b class="num">${feeTxt(b)}</b><span class="muted small"> / month</span>` : '<span class="faint">N/a</span>')}${kv('Address', cp(b.addr))}${kv('Phone', cp(b.phone))}${kv('Email', cp(b.email))}${kv('Owner', cp(b.owner))}${kv('Owner SSN', cp(b.fk.ssn, 'num'))}${kv('Business bank', p && p.has_bank ? cp(b.fk.bank, 'num') : '<span class="faint">—</span>')}</div>
  </div>
  <div class="bd-grid">
    <div><h2 class="bd-h">Linked records</h2><table class="t lk"><tbody>${links.map(([s, t]) => `<tr><td><b>${s}</b></td><td>${t}</td></tr>`).join('')}</tbody></table></div>
    <div><h2 class="bd-h">Fees paid</h2>${years.length ? `<table class="t qf"><thead><tr><th>Year</th><th>Q1</th><th>Q2</th><th>Q3</th><th>Q4</th><th>Extra</th><th>Total</th></tr></thead><tbody>
      ${years.map((y) => { const S = yearRows(b, y); const q = [0, 1, 2, 3].map((i) => Object.values(S).reduce((s, o) => s + o.q[i], 0)); const x = Object.values(S).reduce((s, o) => s + o.x, 0);
        const sub = ['Payroll', 'Bookkeeping', '1099', 'Other'].filter((k) => S[k]).map((k) => `<tr class="sv-row hidden" data-m="${y}"><td class="svn svn-${k}">${k === 'Other' ? 'Other' : k}</td>${S[k].q.map((v) => `<td class="${v ? '' : 'z'}">${v ? usd(v) : '–'}</td>`).join('')}<td class="${S[k].x ? '' : 'z'}">${S[k].x ? usd(S[k].x) : '–'}</td><td>${usd(S[k].q.reduce((a, v) => a + v, 0) + S[k].x)}</td></tr>`).join('');
        return `<tr class="click yr-row" data-yr="${y}"><td class="yr"><b>${y}</b> <span class="caret">▸</span></td>${q.map((v) => `<td class="${v ? '' : 'z'}">${v ? usd(v) : '–'}</td>`).join('')}<td class="${x ? '' : 'z'}">${x ? usd(x) : '–'}</td><td><b>${usd(yrTotal(b, y))}</b></td></tr>${sub}`; }).join('')}
      </tbody></table>` : '<div class="muted small" style="padding-top:8px">No fees yet.</div>'}</div>
  </div>
  <div class="bd-notes"><h2 class="bd-h">Notes</h2>
    <div class="addnote an3"><textarea data-nt="${b.id}" placeholder="Add a note…"></textarea><label class="amt"><span>Fee paid</span><input type="text" data-na="${b.id}" placeholder="$" inputmode="decimal"></label><button class="btn green" data-addnote="${b.id}">Add note</button></div>
    <div data-nl="${b.id}">${notesTable(b)}</div></div>`;
}
const notesTable = (b) => b.notes.length ? `<table class="notes-t"><thead><tr><th style="width:56px">Year</th><th>Comment</th><th class="right" style="width:90px">Fee paid</th><th style="width:105px">Created On</th><th style="width:120px">Added By</th></tr></thead><tbody>${[...b.notes].sort((a, c) => c.d.localeCompare(a.d)).map((n) => `<tr><td>${n.d.slice(0, 4)}</td><td>${esc(n.txt)}</td><td class="right num ${n.amt ? 'nfee' : 'faint'}">${n.amt ? usd(n.amt) : ''}</td><td>${md(n.d)}</td><td>${esc(n.by)} <button class="link faint" data-delnote="${b.id}|${n.id}" title="Xóa note">×</button></td></tr>`).join('')}</tbody></table>` : '';
P.b = (id) => byId[id] ? `<div class="bd-page">${bizBody(byId[id], false)}</div>` : 'Not found';
function openBiz(id) { $$('.ovw.bd').forEach((o) => o.remove()); const ov = modal(bizBody(byId[id], true), 'bd-modal'); ov.classList.add('bd'); }
function startBK(id) { START_BK(id); }
function editForm(b, opt = {}) { EDIT_FORM(b, opt); }

// ---------- Payroll ----------
let PQ = { y: CY, q: 4 }, prQ = '', showOld = false;
P.payroll = (focus) => {
  const match = (b) => !prQ || (b.name + b.owner + b.ein + b.phone + b.email).toLowerCase().includes(prQ.toLowerCase());
  const pr = B.filter((b) => b.payroll && b.payroll.active && match(b));
  const old = B.filter((b) => b.payroll && !b.payroll.active && match(b)).sort((a, b) => a.name.localeCompare(b.name));
  if (focus && byId[focus] && byId[focus].payroll && !byId[focus].payroll.active) showOld = true;
  const ms = [0, 1, 2].map((i) => (PQ.q - 1) * 3 + i);
  const row = (b, p, inactive) => { const c = inactive ? { m: [null, null, null], q: null } : quarterCells(b, PQ.y, PQ.q);
    const box = (v, key) => v === null ? '<td class="tk"></td>' : `<td class="tk" data-l="${key[0] === 'm' ? MON[+key.slice(1)] : 'Q' + (+key.slice(1) + 1)}"><button class="tbox ${v ? 'on' : ''}" data-tick="${b.id}|${key}">${v ? '✓' : ''}</button></td>`;
    const pw = b.payroll.has_pw ? cp(b.fk.pw) : `<span class="soon small">${esc(b.payroll.pw_note) || '—'}</span>`;
    return `<tr class="prow ${inactive ? 'inact' : ''} ${String(focus) === String(b.id) ? 'focus' : ''}" id="pr-${b.id}"><td class="pname pc-${p}"><a href="#/p/b/${b.id}" data-biz="${b.id}">${esc(b.name)}</a></td><td class="right num pfee">${feeTxt(b)}</td><td class="num">${cp(b.ein)}</td><td class="num">${b.payroll.has_pin ? cp(b.fk.pin) : '<span class="faint">—</span>'}</td>
      <td>${pw}</td><td class="nowrap">${cp(b.phone)}</td><td class="pem">${cp(b.email)}</td>
      ${c.m.map((v, i) => box(v, 'm' + ms[i])).join('')}${box(c.q, 'q' + (PQ.q - 1))}<td class="pnote" data-pnote="${b.id}">${b.pnote ? esc(b.pnote) : '<span class="ph">double-click</span>'}</td><td class="right">${inactive ? '' : `<button class="link pe" data-email="${b.id}">Prep email</button>`}</td></tr>`; };
  const sec = (p) => { const L = pr.filter((b) => b.payroll.period === p).sort((a, b) => a.name.localeCompare(b.name)); if (!L.length) return '';
    return `<tr class="psec psec-${p}"><td colspan="13">${esc(PLABEL[p])} <span class="n">${L.length}</span></td></tr>${L.map((b) => row(b, p)).join('')}`; };
  return `<div class="page-head"><div><h1>Payroll</h1></div><div class="btnrow"><button class="btn primary" data-pa="newpr">+ Add payroll client</button></div></div>
  <div class="pr-bar"><span class="pr-month"><button data-py="-1">‹</button><b>${PQ.y}</b><button data-py="1">›</button></span>
    <div class="tabs plain">${[1, 2, 3, 4].map((q) => `<button data-pq="${q}" class="${PQ.q === q ? 'on' : ''}">Q${q}</button>`).join('')}</div>
    <input type="search" id="prq" placeholder="Search name, EIN, phone, email…" value="${esc(prQ)}" style="width:260px">
    <div class="pr-leg">${PERIODS.map((p) => `<span><i class="sw pc-${p}"></i>${PLABEL[p]}</span>`).join('')}</div></div>
  <div class="ptable-wrap"><table class="t ptab"><thead><tr><th>Business name</th><th class="right">Fee</th><th>EIN</th><th>PIN</th><th>PW</th><th>Phone</th><th>Email</th>${ms.map((m) => `<th class="tk">${MON[m]}</th>`).join('')}<th class="tk">Q${PQ.q}</th><th>Note</th><th></th></tr></thead><tbody>
  ${PERIODS.map(sec).join('')}
  <tr class="psec psec-Inactive click" data-pa="toggleold"><td colspan="13">${showOld ? '▾' : '▸'} Inactive <span class="n">${old.length}</span></td></tr>
  ${showOld ? old.map((b) => row(b, 'Other', true)).join('') : ''}
  </tbody></table></div>`;
};

// prep email
function emailModal(id) {
  const b = byId[id]; let lang = 'en'; if (!TPL.length) { toast('Chưa có email template · thêm ở Settings', true); return; }
  const QT = (TPL.find((t) => /quarter|quý/i.test(t.name)) || TPL[0]).id, MT = (TPL.find((t) => /month|tháng/i.test(t.name)) || TPL[0]).id; let tid = QT;
  const c = quarterCells(b, PQ.y, PQ.q);
  const lastM = c.m.map((v, i) => v ? (PQ.q - 1) * 3 + i : -1).filter((i) => i >= 0).pop();
  const perFor = (t, l) => t === QT || c.q !== null ? (l === 'en' ? `Q${PQ.q} ${PQ.y}` : `quý ${PQ.q}/${PQ.y}`) : (l === 'en' ? `${MONL[lastM ?? (PQ.q - 1) * 3]} ${PQ.y}` : `${MONV[lastM ?? (PQ.q - 1) * 3]}/${PQ.y}`);
  if (c.q === null) tid = MT;
  const fill = (s, l) => s.replace(/\{owner\}/g, b.owner || (l === 'en' ? 'there' : '')).replace(/\{business\}/g, b.name).replace(/\{period\}/g, perFor(tid, l)).replace(/\{fee\}/g, feeTxt(b));
  const ov = modal(`<h2><span>Prep email · ${esc(b.name)}</span><button class="x" data-x>×</button></h2>
    <div class="em-row"><span>Template</span><div class="btnrow"><select id="emt" style="width:auto">${TPL.map((t) => `<option value="${t.id}" ${t.id === tid ? 'selected' : ''}>${esc(t.name)}</option>`).join('')}</select>
      <div class="tabs plain" id="eml"><button data-l="en" class="on">English</button><button data-l="vn">Tiếng Việt</button></div><a href="#/p/settings" data-x class="small">Edit templates</a></div></div>
    <div class="em-row"><span>Subject</span><input type="text" id="ems" style="width:100%"></div>
    <div class="em-row"><span>Message</span><textarea id="emb" style="width:100%;min-height:230px"></textarea></div>
    <div class="btnrow" style="justify-content:flex-end;margin-top:12px"><button class="btn" data-x>Cancel</button><button class="btn" id="emc2">Copy message</button><button class="btn primary" id="emc">Copy all</button></div>`, 'em-modal');
  const draw = () => { const t = TPL.find((x) => x.id === tid)[lang]; $('#ems', ov).value = fill(t.s, lang); $('#emb', ov).value = fill(t.b, lang); $$('#eml button', ov).forEach((x) => x.classList.toggle('on', x.dataset.l === lang)); };
  draw();
  $('#emt', ov).onchange = (e) => { tid = isNaN(e.target.value) ? e.target.value : +e.target.value; draw(); };
  $('#eml', ov).onclick = (e) => { const x = e.target.closest('[data-l]'); if (x) { lang = x.dataset.l; draw(); } };
  $('#emc', ov).onclick = () => { navigator.clipboard?.writeText($('#ems', ov).value + '\n\n' + $('#emb', ov).value).catch(() => {}); toast('Copied ✓'); };
  $('#emc2', ov).onclick = () => { navigator.clipboard?.writeText($('#emb', ov).value).catch(() => {}); toast('Copied ✓'); };
}

// ---------- Formations (oldest first) ----------
P.formations = (focus) => {
  const L = B.filter((b) => b.formation).sort((a, b) => a.formation.date.localeCompare(b.formation.date) || a.formation.no - b.formation.no);
  return `<div class="page-head"><div><h1>Formations</h1><div class="sub"><span class="fm-key"></span> Payroll</div></div><button class="btn primary" data-pa="newfm">+ New formation</button></div>
  <table class="t"><thead><tr><th>#</th><th>Date</th><th>Business</th><th>Type</th><th class="mx">EIN</th><th class="mx">Owner</th><th>Steps</th><th>Also</th><th class="right">Fee</th></tr></thead><tbody>
  ${L.map((b) => `<tr class="click ${b.payroll && b.payroll.active ? 'fm-pr' : ''} ${String(focus) === String(b.id) ? 'focus' : ''}" id="fm-${b.id}" data-biz="${b.id}"><td class="muted">${b.formation.no}</td><td class="nowrap">${md(b.formation.date)}</td><td class="name-cell">${esc(b.name)}</td><td>${esc(b.type)}</td><td class="mx num nowrap">${esc(b.ein)}</td><td class="mx">${esc(b.owner)}</td>
    <td><span class="flow">${[['AOO', 1], ['EIN', !!b.ein], ['BOIR', b.formation.boi], ['2553', b.type !== 'S-Corp' ? null : !!b.formation.f2553]].filter(([, y]) => y !== null).map(([t, y]) => `<span class="${y ? 'y' : ''}">${t}</span>`).join('')}</span></td>
    <td>${b.payroll && b.payroll.active ? '<span class="sv sv-pr">PAYROLL</span>' : ''}${hasBK(b) ? '<span class="sv sv-bk">BOOKKEEPING</span>' : ''}</td><td class="right num">${usd(b.formation.fee)}</td></tr>`).join('')}</tbody></table>`;
};

// ---------- Fees (v4): Payroll | 1099 | Summary ----------
let feeTab = 'payroll', feeView = 'month', selCells = [];
var added1099 = [];
const HL = [['#fff59d', 'Yellow'], ['#c8e6c9', 'Green'], ['#ffcdd2', 'Red'], ['#bbdefb', 'Blue'], ['#e1bee7', 'Purple']];
let YEARS = [CYS];
const GLABEL = { ...PLABEL, Bookkeeping: 'Bookkeeping', Other: 'Other income (sales tax, notes…)', Inactive: 'Not on payroll now' };
const sideAll = () => DATA.side.concat(added1099);
function yearParts(y) {
  let pay = 0, bk = 0, oth = 0; const nPay = new Set(), nBk = new Set();
  B.forEach((b) => (b.fees[y] || []).forEach((l) => { const s = Object.values(l.m).reduce((a, v) => a + v, 0);
    if (l.svc === 'Payroll') { pay += s; if (s) nPay.add(b.id); } else if (l.svc === 'Bookkeeping') { bk += s; if (s) nBk.add(b.id); } else oth += s; oth += l.extra || 0; }));
  const S = sideAll().filter((o) => String(o.year) === y); const side = S.reduce((s, o) => s + o.amt, 0);
  const F = B.filter((b) => b.formation && b.formation.date.startsWith(y)); const form = F.reduce((s, b) => s + (b.formation.fee || 0), 0);
  oth += B.reduce((s, b) => s + noteFees(b, y).reduce((a, n) => a + n.amt, 0), 0); // v5: fee written in a note = other income
  return { pay, bk, oth: oth + side, form, tot: pay + bk + oth + side, nPay: nPay.size, nBk: nBk.size, n99: S.filter((o) => o.kind === '1099').length, nForm: F.length };
}
P.fees = (focus) => { if (focus) feeTab = 'payroll'; return `<div class="page-head"><div><h1>Fees</h1></div><div class="btnrow"><button class="btn" data-pa="price">Price list</button></div></div>
  <div class="tabs">${[['payroll', 'Payroll & Bookkeeping'], ['1099', '1099'], ['summary', 'Summary']].map(([k, t]) => `<button data-ft="${k}" class="${feeTab === k ? 'on' : ''}">${t}</button>`).join('')}</div>
  ${feeTab === 'payroll' ? feesPayroll(focus) : feeTab === '1099' ? fees1099() : feesSummary()}`; };
function feesPayroll(focus) {
  const q = feeView === 'quarter';
  const bar = `<div class="fbar"><div class="tabs plain"><button data-fv="month" class="${!q ? 'on' : ''}">Months</button><button data-fv="quarter" class="${q ? 'on' : ''}">Quarters</button></div>
    ${!q ? `<span class="fpal"><span class="muted small">Highlight:</span>${HL.map(([c, n]) => `<button class="sw2" data-hl="${c}" title="${n}" style="background:${c}"></button>`).join('')}<button class="sw2 x" data-hl="" title="No color">×</button></span>` : ''}
    <span class="pr-leg">${PERIODS.map((p) => `<span><i class="sw pc-${p}"></i>${p}</span>`).join('')}<span><i class="sw pc-Bookkeeping"></i>Bookkeeping</span></span></div>`;
  return bar + YEARS.map((y) => feeYear(y, q, focus)).join('');
}
function feeYear(y, q, focus) {
  const rows = B.filter((b) => b.fees[y]).flatMap((b) => b.fees[y].map((l, li) => ({ b, l, li })));
  B.forEach((b) => { const N = noteFees(b, y); if (N.length) { const m = {}; N.forEach((n) => { const k = +n.d.slice(5, 7); m[k] = (m[k] || 0) + n.amt; }); rows.push({ b, l: { svc: 'Note fee', m, extra: 0, flags: [], hl: {}, virt: N.map((n) => n.txt).join(' · ') }, li: -1 }); } }); // v5: fee written in a note
  sideAll().filter((o) => o.kind === 'Annual' && String(o.year) === y).forEach((o) => rows.push({ b: byId[o.bid] || { id: 'na', name: o.name, payroll: null }, l: { svc: 'Annual', m: {}, extra: o.amt, flags: [], hl: {}, virt: 'Annual fee (cột ANNUAL sheet 2024)' }, li: -1 })); // v20.1: Annual fee = its own row, not a 1099 footnote
  if (!rows.length) return '';
  const grp = (r) => r.l.svc === 'Bookkeeping' ? 'Bookkeeping' : r.l.svc !== 'Payroll' ? 'Other' : r.b.payroll && r.b.payroll.active ? r.b.payroll.period : 'Inactive';
  const sumM = (k) => rows.reduce((s, r) => s + (r.l.m[k] || 0), 0); const ext = rows.reduce((s, r) => s + (r.l.extra || 0), 0);
  const tot = rows.reduce((s, r) => s + Object.values(r.l.m).reduce((a, v) => a + v, 0) + (r.l.extra || 0), 0);
  const ncol = q ? 7 : 15;
  const line = ({ b, l, li }) => { const t = Object.values(l.m).reduce((a, v) => a + v, 0) + (l.extra || 0); const fl = Object.fromEntries(l.flags.map((f) => [f.split(':')[0], f.split(':')[1]])); l.hl ||= {};
    const cell = (m) => l.virt ? `<td class="${l.m[m] ? 'nfee' : 'z'}" title="${esc(l.virt)}">${l.m[m] ? Math.round(l.m[m]) : ''}</td>` : fl[m] ? `<td class="fl" title="${esc(fl[m])}">${esc(fl[m].trim().split(' ')[0].slice(0, 6))}</td>` : `<td class="fc ${l.m[m] != null ? '' : 'z'} ${selCells.includes(`${b.id}|${y}|${li}|${m}`) ? 'sel' : ''}" data-cell="${b.id}|${y}|${li}|${m}" style="${l.hl[m] ? 'background:' + l.hl[m] : ''}">${l.m[m] != null ? Math.round(l.m[m]) : ''}</td>`;
    const isF = y === CYS && String(focus) === String(b.id) && l.svc === 'Bookkeeping';
    return `<tr class="${isF ? 'focus' : ''}" ${isF ? 'id="ffocus"' : ''}><td class="fname pc-${grp({ b, l })}"><a href="#/p/b/${b.id}" data-biz="${b.id}">${esc(b.name)}</a>${l.svc !== 'Payroll' && l.svc !== 'Bookkeeping' ? ` <span class="small" style="color:var(--orange-ink)">${l.svc}</span>` : ''}</td>${q ? [1, 2, 3, 4].map((k) => { const v = qSum(l, k); return `<td class="${v ? '' : 'z'}">${v ? usd(v) : ''}</td>`; }).join('') : MON.map((_, i) => cell(i + 1)).join('')}<td class="fc ${l.extra ? '' : 'z'}" ${l.virt ? '' : `data-cell="${b.id}|${y}|${li}|x"`}>${l.extra ? Math.round(l.extra) : ''}</td><td><b>${usd(t)}</b></td></tr>`; };
  const groups = [...PERIODS, 'Bookkeeping', 'Other', 'Inactive'].map((g) => { const R = rows.filter((r) => grp(r) === g).sort((a, c) => a.b.name.localeCompare(c.b.name)); if (!R.length) return '';
    const gt = R.reduce((s, r) => s + Object.values(r.l.m).reduce((a, v) => a + v, 0) + (r.l.extra || 0), 0);
    return `<tr class="psec psec-${g}"><td colspan="${ncol - 1}">${esc(GLABEL[g])} <span class="n">${R.length}</span></td><td class="right">${usd(gt)}</td></tr>${R.map(line).join('')}`; }).join('');
  return `<div class="fyear"><div class="fyh"><h2>${y}</h2><b>${usd(tot)}</b></div>
    <div style="overflow-x:auto"><table class="t ft"><thead><tr><th>Business</th>${q ? '<th>Q1</th><th>Q2</th><th>Q3</th><th>Q4</th>' : MON.map((m) => `<th>${m}</th>`).join('')}<th>Extra</th><th>Total</th></tr></thead><tbody>
    ${groups}<tr class="tot"><td>Total</td>${q ? [1, 2, 3, 4].map((k) => `<td>${usd([1, 2, 3].reduce((s, j) => s + sumM((k - 1) * 3 + j), 0))}</td>`).join('') : MON.map((_, i) => `<td>${usd(sumM(i + 1))}</td>`).join('')}<td>${usd(ext)}</td><td>${usd(tot)}</td></tr></tbody></table></div></div>`;
}
function fees1099() {
  const all = sideAll().filter((o) => o.kind === '1099');
  const yrsOf = (k) => [...new Set(all.filter((o) => o.key === k).map((o) => o.year))].length;
  const unl = [...new Set(all.filter((o) => !o.bid).map((o) => o.key))];
  return `<div class="add99 big"><select id="y99" style="width:auto">${YEARS.map((y) => `<option>${y}</option>`).join('')}</select><div class="ac"><input type="text" id="n99" placeholder="Business / client name" autocomplete="off"><div class="acl hidden" id="acl"></div></div><input type="text" id="a99" placeholder="$" style="width:90px"><button class="btn green" id="b99">Add</button>
    <span class="muted small" style="margin-left:auto">${all.filter((o) => o.bid).length} linked · <b>${unl.length}</b> tên chưa có record</span></div>
    <div class="y99">${YEARS.map((y) => { const L = all.filter((o) => String(o.year) === y).sort((a, c) => a.name.localeCompare(c.name));
      return `<div class="fyear"><div class="fyh"><h2>${y}</h2><span class="muted">${L.length}</span><b>${usd(L.reduce((s, o) => s + o.amt, 0))}</b></div>
      ${L.length ? `<table class="t t99"><tbody>${L.map((o) => { const n = yrsOf(o.key); const b = o.bid && byId[o.bid];
        return `<tr><td>${b ? `<a href="#/p/b/${b.id}" data-biz="${b.id}">${esc(b.name)}</a>` : `<span>${esc(o.name)}</span> <button class="link ad" data-add99="${esc(o.key)}" data-n="${esc(o.name)}">Add details</button>`}${n > 1 ? ` <span class="yrs" title="Có ở ${n} năm">×${n}</span>` : ''}</td><td class="right num">${usd(o.amt)}</td></tr>`; }).join('')}</tbody></table>` : '<div class="muted small" style="padding:6px 0">—</div>'}
      </div>`; }).join('')}</div>`;
}
function priceModal() {
  const T = DATA.price && DATA.price.length ? DATA.price : PRICE0;
  modal(`<h2><span>Payroll price list</span><button class="x" data-x>×</button></h2>
    <div class="fee-sec"><div class="fee-head"><h2>Payroll Fees</h2><span class="fee-meta">sửa ở Settings › Price list</span></div>
    <table class="fee-t"><thead><tr><th># Employees</th><th>Monthly</th><th class="hl">Bi-weekly</th><th>Weekly</th></tr></thead><tbody>${T.map((r) => `<tr><td class="c0">${r[0]}</td><td>${r[1]}</td><td class="hl">${r[2]}</td><td>${r[3]}</td></tr>`).join('')}</tbody></table></div>`);
}

// ---------- Search (like Pub Club) ----------
let sq = '';
P.search = () => `<div class="page-head"><div><h1>Search</h1></div></div>
  <form class="sbox" id="sform"><input type="search" id="sq" placeholder="vd: nail, 714-894, Phan, EFTPS, 92683…" value="${esc(sq)}"><button class="btn primary">Search</button></form><div id="sres">${searchRes()}</div>`;
function searchRes() {
  const q = sq.trim().toLowerCase(); if (q.length < 2) return '<div class="muted small">Gõ ít nhất 2 chữ. Thử: <a href="#" data-try="eftps">eftps</a> · <a href="#" data-try="nail">nail</a> · <a href="#" data-try="714-894">714-894</a></div>';
  const qd = q.replace(/\D/g, ''); const re = new RegExp(q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'ig'); const hl = (t) => esc(t).replace(re, (m) => `<mark>${m}</mark>`);
  const biz = B.filter((b) => [b.name, b.owner, b.addr, b.email, b.sos].join(' ').toLowerCase().includes(q) || (qd.length >= 3 && (b.ein + b.phone).replace(/\D/g, '').includes(qd)));
  const notes = B.flatMap((b) => b.notes.filter((n) => n.txt.toLowerCase().includes(q)).map((n) => ({ b, n })));
  return `<div class="sres-head">Businesses <span class="muted">${biz.length}</span></div>
    <table class="t"><thead><tr><th>Business</th><th>Type</th><th>EIN</th><th>Phone</th><th class="mx">Address</th><th class="mx">Owner</th><th>Services</th></tr></thead><tbody>${biz.slice(0, 40).map((b) => `<tr class="click" data-biz="${b.id}"><td class="name-cell">${hl(b.name)}</td><td>${esc(b.type)}</td><td class="num nowrap">${hl(b.ein)}</td><td class="nowrap">${hl(b.phone)}</td><td class="mx small">${hl(b.addr)}</td><td class="mx">${hl(b.owner)}</td><td>${svcHtml(b)}</td></tr>`).join('') || '<tr><td colspan="7" class="muted">No business.</td></tr>'}</tbody></table>
    <div class="sres-head">Notes <span class="muted">${notes.length}</span></div>
    <table class="t"><tbody>${notes.map(({ b, n }) => `<tr class="click" data-biz="${b.id}"><td class="nowrap muted" style="width:100px">${md(n.d)}</td><td class="name-cell" style="width:260px">${esc(b.name)}</td><td>${hl(n.txt)}</td><td class="muted small nowrap">${esc(n.by)}</td></tr>`).join('') || '<tr><td class="muted">No notes.</td></tr>'}</tbody></table>`;
}

// (Settings → see SETTINGS below)

// ---------- modal ----------
function modal(html, cls = '') { const w = document.createElement('div'); w.className = 'pay19 ovw'; w.innerHTML = `<div class="overlay"><div class="bmodal ${cls}">${html}</div></div>`; document.body.appendChild(w); const ov = w.firstElementChild;
  const close = () => w.remove(); ov.addEventListener('mousedown', (e) => { if (e.target === ov) close(); }); ov.addEventListener('click', (e) => { if (e.target.closest('[data-x]')) close(); }); return w; }
document.addEventListener('keydown', (e) => { if (e.key === 'Escape') { const o = $$('.pay19.ovw').pop(); if (o) o.remove(); } });

// ---------- router + events ----------
const CUR = { r: 'home', id: '' };
function go(r, reset) { const [a, b] = String(r || 'home').split('/'); CUR.r = P[a] ? a : 'home'; CUR.id = b || ''; if (reset) { render.keep = false; } if (S.page === 'pay') { shell(); render(); } }
function render() {
  const pg = $('#paypage'); if (!pg) return;
  if (!ST.loaded) { pg.innerHTML = ST.err ? `<div class="card" style="margin-top:20px"><b>Không tải được dữ liệu payroll.</b> <span class="muted">${esc(ST.err)}</span> <button class="btn small" data-pa="reload">Thử lại</button></div>` : '<div class="muted" style="padding:30px 4px">Đang tải…</div>'; load(); return; }
  const r = CUR.r, id = CUR.id;
  shell(r === 'b' ? 'biz' : r);
  const y = scrollY; pg.innerHTML = (P[r] || P.home)(id); if (r === 'biz') drawBiz();
  if (r === 'home') loadNews();
  if (render.keep) scrollTo(0, y); else if (id && r !== 'b') setTimeout(() => { const f = $('.pay19 .focus'); if (f) f.scrollIntoView({ block: 'center' }); }, 30);
  render.keep = false;
}
const inPay = (t) => !!(t && t.closest && (t.closest('.pay19') || (S.page === 'pay' && t.closest('#sheets'))));

document.addEventListener('click', (e) => {
  const t = e.target; if (!inPay(t)) return;
  const lk = t.closest('a[href^="#/p/"]'); if (lk && !t.closest('[data-biz]')) { e.preventDefault(); $$('.pay19.ovw').forEach((o) => { if (lk.closest('.ovw') === o) o.remove(); }); if (lk.dataset.ftGo) feeTab = lk.dataset.ftGo; go(lk.getAttribute('href').slice(4)); window.scrollTo(0, 0); return; }
  const cpx = t.closest('[data-copy]'); if (cpx) { e.preventDefault(); navigator.clipboard?.writeText(cpx.dataset.copy).catch(() => {}); $$('.copied-t').forEach((x) => x.remove()); cpx.classList.add('copied'); const m = document.createElement('span'); m.className = 'copied-t'; m.textContent = 'Copied ✓'; cpx.after(m); setTimeout(() => { cpx.classList.remove('copied'); m.remove(); }, 2000); return; }
  const em = t.closest('[data-email]'); if (em) { e.preventDefault(); emailModal(em.dataset.email); return; }
  const tk = t.closest('[data-tick]'); if (tk) { const [id, k] = tk.dataset.tick.split('|'); const R = byId[id].rep[PQ.y]; const arr = k[0] === 'm' ? R.m : R.q; const i = +k.slice(1); const was = arr[i]; arr[i] = was ? 0 : 1; render.keep = true; render();
    api('PUT', '/pr/tick', { bid: +id, year: PQ.y, slot: k[0] + (i + 1), done: !!arr[i] }).catch((er) => { arr[i] = was; render.keep = true; render(); failT(er); }); return; }
  const bz = t.closest('[data-biz]'); if (bz && bz.dataset.biz === 'na') { e.preventDefault(); return; } if (bz && !t.closest('[data-copy],[data-email],button:not([data-biz])')) { e.preventDefault(); if (OPEN_MODE === 'page') go('b/' + bz.dataset.biz); else openBiz(bz.dataset.biz); return; }
  const f = t.closest('#bf [data-f]'); if (f) { LS.f = f.dataset.f; render.keep = true; render(); return; }
  const s = t.closest('th[data-s]'); if (s) { LS.sort = s.dataset.s; drawBiz(); return; }
  const pq = t.closest('[data-pq]'); if (pq) { PQ.q = +pq.dataset.pq; render.keep = true; render(); return; }
  const py = t.closest('[data-py]'); if (py) { PQ.y += +py.dataset.py; render.keep = true; render(); return; }
  const ft = t.closest('[data-ft]'); if (ft) { feeTab = ft.dataset.ft; selCells = []; render.keep = true; render(); return; }
  const fc = t.closest('td[data-cell]'); if (fc && !fc.querySelector('input')) { const k = fc.dataset.cell; if (e.ctrlKey || e.metaKey) { selCells = selCells.includes(k) ? selCells.filter((x) => x !== k) : [...selCells, k]; } else selCells = [k]; $$('td.fc.sel').forEach((x) => x.classList.remove('sel')); selCells.forEach((s) => { const c = $(`td[data-cell="${s}"]`); if (c) c.classList.add('sel'); }); return; }
  const hl = t.closest('[data-hl]'); if (hl) { if (!selCells.length) { toast('Bấm chọn 1 ô trước'); return; } const cells = []; selCells.forEach((s) => { const [id, y, li, m] = s.split('|'); const l = byId[id].fees[y][li]; if (!l || !l.id) return; l.hl ||= {}; if (hl.dataset.hl) l.hl[m] = hl.dataset.hl; else delete l.hl[m]; cells.push([l.id, m]); const c = $(`td[data-cell="${s}"]`); if (c) c.style.background = hl.dataset.hl; });
    api('PUT', '/pr/fee/hl', { cells, color: hl.dataset.hl }).then(() => toast(hl.dataset.hl ? 'Highlighted' : 'Color removed')).catch(failT); return; }
  const fv = t.closest('[data-fv]'); if (fv) { feeView = fv.dataset.fv; render.keep = true; render(); return; }
  const yr = t.closest('tr[data-yr]'); if (yr) { const box = yr.closest('.bmodal, #paypage'); const L = $$(`tr[data-m="${yr.dataset.yr}"]`, box); const open = L.length && L[0].classList.contains('hidden'); L.forEach((x) => x.classList.toggle('hidden', !open)); yr.classList.toggle('open', open); return; }
  const tr = t.closest('[data-try]'); if (tr) { e.preventDefault(); sq = tr.dataset.try; render(); return; }
  const st = t.closest('[data-st]'); if (st) { setTab = st.dataset.st; render(); return; }
  const an = t.closest('[data-addnote]'); if (an) { const b = byId[an.dataset.addnote]; const box = an.closest('.bmodal, #paypage'); const ta = $(`[data-nt="${b.id}"]`, box); if (!ta.value.trim()) return; const amt = Number(($(`[data-na="${b.id}"]`, box).value || '').replace(/[$,]/g, '')) || 0; const txt = ta.value.trim(); an.disabled = true;
    api('POST', '/pr/notes', { bid: b.id, body: txt, fee: amt || null }).then((r) => { b.notes.push({ id: r.id, d: todayISO(), txt, by: ME(), amt }); toast(amt ? `Note saved · ${usd(amt)} = other income` : 'Note saved'); if (an.closest('.bmodal')) openBiz(b.id); else { render.keep = true; render(); } }).catch((er) => { an.disabled = false; failT(er); }); return; }
  const dn = t.closest('[data-delnote]'); if (dn) { const [bid, nid] = dn.dataset.delnote.split('|'); const b = byId[bid]; if (!confirm('Xóa note này? (vào Trash, khôi phục được)')) return; api('DELETE', '/pr/notes/' + nid).then(() => { b.notes = b.notes.filter((n) => String(n.id) !== nid); toast('Đã xóa note'); if (dn.closest('.bmodal')) openBiz(b.id); else { render.keep = true; render(); } }).catch(failT); return; }
  const ed = t.closest('[data-edit]'); if (ed) { editForm(byId[ed.dataset.edit]); return; }
  const a99 = t.closest('[data-add99]'); if (a99) { editForm(null, { key: a99.dataset.add99, name: a99.dataset.n }); return; }
  const pick = t.closest('[data-pick]'); if (pick) { $('#n99').value = byId[pick.dataset.pick].name; $('#n99').dataset.bid = pick.dataset.pick; $('#acl').classList.add('hidden'); toast('✓ linked to ' + byId[pick.dataset.pick].name); $('#a99').focus(); return; }
  if (t.id === 'b99') { const n = $('#n99').value.trim(), a = Number($('#a99').value.replace(/[$,]/g, '')); if (!n || !a) { toast('Nhập tên + số tiền'); return; } const year = +$('#y99').value; const pb = $('#n99').dataset.bid ? +$('#n99').dataset.bid : null; t.disabled = true;
    api('POST', '/pr/1099', { year, name: n, amt: a, bid: pb }).then((r) => { DATA.side.push({ id: r.id, year, name: nice(n), key: nkey(n), amt: a, kind: '1099', bid: r.bid || null }); relink1099(); toast(r.bid ? 'Added · linked' : 'Added · not in records'); render.keep = true; render(); }).catch((er) => { t.disabled = false; failT(er); }); return; }
  const bk = t.closest('[data-bk]'); if (bk) { startBK(bk.dataset.bk); return; }
  const wa = t.closest('[data-waive]'); if (wa) { e.stopPropagation(); const ks = owed().find((o) => String(o.b.id) === wa.dataset.waive).items.filter((i) => !i.waived).map((i) => i.k); ks.forEach((k) => WAIVED.add(k)); render.keep = true; render(); api('PUT', '/pr/waive', { keys: ks, on: true }).then(() => toast('Waived')).catch((er) => { ks.forEach((k) => WAIVED.delete(k)); render.keep = true; render(); failT(er); }); return; }
  const uw = t.closest('[data-unwaive]'); if (uw) { const ks = owed().find((o) => String(o.b.id) === uw.dataset.unwaive).items.filter((i) => i.waived).map((i) => i.k); ks.forEach((k) => WAIVED.delete(k)); render.keep = true; render(); api('PUT', '/pr/waive', { keys: ks, on: false }).then(() => toast('Undone')).catch(failT); return; }
  const a = t.closest('[data-pa]'); if (!a) return; const act = a.dataset.pa;
  if (act === 'price') priceModal();
  else if (act === 'toggleold') { showOld = !showOld; render.keep = true; render(); }
  else if (act === 'waived') { showWaived = !showWaived; render.keep = true; render(); }
  else if (act === 'theme') V20.openTheme();
  else if (act === 'reload') { ST.err = ''; render(); }
  else if (act === 'newbiz') editForm(null, {});
  else if (act === 'newpr') editForm(null, { payroll: true });
  else if (act === 'newfm') editForm(null, { formation: true });
  else SET_ACT(act, a);
});
// v3: double-click edit (fee cells + payroll note). Enter = save, Esc = cancel
document.addEventListener('dblclick', (e) => {
  if (!inPay(e.target)) return;
  const fc = e.target.closest('td.fc[data-cell]'); const pn = e.target.closest('td[data-pnote]');
  if (fc && !fc.querySelector('input')) { const [id, y, li, m] = fc.dataset.cell.split('|'); const l = byId[id].fees[y][li]; const cur = m === 'x' ? l.extra : l.m[m];
    fc.innerHTML = `<input class="cell-in" value="${cur || ''}" inputmode="decimal">`; const i = $('input', fc); i.focus(); i.select();
    let fin = false; const done = (save) => { if (fin) return; fin = true; const raw = i.value.trim(); const v = raw === '' ? null : Number(raw.replace(/[$,]/g, ''));
      if (save && raw !== String(cur ?? '') && (v === null || Number.isFinite(v))) { const old = m === 'x' ? l.extra : l.m[m]; if (m === 'x') l.extra = v || 0; else if (v !== null) l.m[m] = v; else delete l.m[m];
        api('PUT', '/pr/fee', { line_id: l.id, month: m, value: v }).then(() => toast(v ? 'Saved · received ' + usd(v) : 'Cleared · chưa trả')).catch((er) => { if (m === 'x') l.extra = old; else if (old == null) delete l.m[m]; else l.m[m] = old; render.keep = true; render(); failT(er); }); }
      render.keep = true; render(); };
    i.onkeydown = (k) => { if (k.key === 'Enter') done(true); if (k.key === 'Escape') { k.stopPropagation(); done(false); } }; i.onblur = () => done(true); return; }
  if (pn && !pn.querySelector('input')) { const b = byId[pn.dataset.pnote]; pn.innerHTML = `<input class="cell-in wide" value="${esc(b.pnote || '')}" placeholder="Note…">`; const i = $('input', pn); i.focus();
    let fin = false; const done = (save) => { if (fin) return; fin = true; const v = i.value.trim(); if (save && v !== (b.pnote || '')) { const old = b.pnote; b.pnote = v; api('PUT', '/pr/pnote', { bid: b.id, note: v }).then(() => toast('Saved')).catch((er) => { b.pnote = old; render.keep = true; render(); failT(er); }); } render.keep = true; render(); };
    i.onkeydown = (k) => { if (k.key === 'Enter') done(true); if (k.key === 'Escape') { k.stopPropagation(); done(false); } }; i.onblur = () => done(true); }
});
document.addEventListener('change', (e) => {
  if (!inPay(e.target)) return; SET_CHANGE(e);
  if (e.target.id === 'bt') { LS.type = e.target.value; drawBiz(); } if (e.target.id === 'bfm') { LS.f = e.target.value; render(); }
  if (e.target.name === 'om') { OPEN_MODE = e.target.value; toast(OPEN_MODE === 'popup' ? 'Bấm 1 cty → pop-up' : 'Bấm 1 cty → full page'); }
});
document.addEventListener('input', (e) => {
  if (!inPay(e.target)) return;
  const id = e.target.id;
  if (id === 'bq') { LS.q = e.target.value; drawBiz(); }
  if (id === 'sq') { sq = e.target.value; $('#sres').innerHTML = searchRes(); }
  if (id === 'prq') { prQ = e.target.value; const pos = e.target.selectionStart; render.keep = true; render(); const n = $('#prq'); n.focus(); n.setSelectionRange(pos, pos); }
  if (id === 'off') OFFICE = e.target.value;
  if (e.target.dataset.tf) { const [i, l, k] = e.target.dataset.tf.split('|'); TPL[i][l][k] = e.target.value; saveTpl(); }
  if (e.target.dataset.tn) { TPL[e.target.dataset.tn].name = e.target.value; saveTpl(); }
  if (id === 'n99') { delete e.target.dataset.bid; const q = e.target.value.trim().toLowerCase(); const L = q.length < 1 ? [] : B.filter((b) => b.name.toLowerCase().includes(q) || b.owner.toLowerCase().includes(q)).slice(0, 8);
    $('#acl').innerHTML = L.map((b) => `<div data-pick="${b.id}"><b>${esc(b.name)}</b> <span class="muted small">${esc(b.owner)} · ${esc(b.ein)}</span></div>`).join('') + (q ? `<div class="none">“${esc(e.target.value)}” - not in records (saves without link)</div>` : '');
    $('#acl').classList.toggle('hidden', !q); }
});
document.addEventListener('submit', (e) => { if (inPay(e.target)) e.preventDefault(); });


// ================= v20 additions (real data) =================
const CQ = () => Math.ceil(CUR_M / 3);
const WD = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
function HOME() {
  const pr = B.filter((b) => b.payroll && b.payroll.active);
  const O = owed(); const due = O.filter((o) => o.total > 0), wv = O.filter((o) => o.items.some((i) => i.waived));
  const dueT = due.reduce((s, o) => s + o.total, 0);
  const ytd = yearParts(CYS).tot; const q = CQ();
  const prog = PERIODS.map((p) => { const L = pr.filter((b) => b.payroll.period === p); let t = 0, d = 0; L.forEach((b) => { const c = quarterCells(b, CY, q); [...c.m, c.q].forEach((v) => { if (v !== null) { t++; d += v ? 1 : 0; } }); }); return { p, n: L.length, t, d }; });
  const first = (ME().split(/\s+/)[0]) || 'there';
  const wd = WD[new Date(TODAY + 'T12:00').getDay()];
  const NI = NEWS ? NEWS.items || [] : [];
  return `<div class="hero19"><div><div class="hellorow">${V20.hello('Hello ' + first + '!')}</div>
      <div class="today19">${ti()}${wd}, <b>${md(TODAY)}</b> <button class="chip19" data-pa="theme">Theme</button></div></div>
    <div class="herostats">${statStrip([
    ['Due · not received', `<span class="${dueT ? 'late' : 'ok'}">${usd(dueT)}</span>`, `${due.length} businesses`],
    [`Fees ${CYS} YTD`, usd(ytd), `<a href="#/p/fees" data-ft-go="summary">Summary →</a>`],
    ['Active payroll clients', pr.length, PERIODS.map((p) => `<span class="dotp pc-${p}"></span>${pr.filter((b) => b.payroll.period === p).length}`).join(' &nbsp; ') + ` &nbsp;· ${B.filter((b) => hasBK(b)).length} bookkeeping`],
  ])}</div></div>
  <div class="news"><div class="news-h">This week in payroll <span class="nw-auto">${NEWS && NEWS.last ? md(String(NEWS.last).slice(0, 10)) : ''}</span></div>
    ${NI.length ? `<div class="news-g">${NI.map((n) => `<a class="nw" href="${esc(n.url)}" target="_blank" rel="noopener"><span class="nw-s">${ti()}${esc(n.src)}${n.date ? ' · ' + esc(n.date) : ''}</span><b>${esc(n.title)}</b><span class="nw-t">${esc(n.txt)}</span><span class="nw-go">Read ↗</span></a>`).join('')}</div>`
    : `<div class="muted small" style="padding:6px 0">${NEWS ? 'Chưa có tin · tự lấy mỗi thứ Hai (Settings › News › Pull now)' : 'Đang tải…'}</div>`}</div>
  <div class="grid2">
    <div class="card"><div class="card-head"><h2>Not received yet</h2>${wv.length ? `<button class="link small" data-pa="waived">${showWaived ? 'Ẩn' : 'Xem'} đã waive (${wv.length})</button>` : ''}</div>
      ${due.length ? `<table class="t"><tbody>${due.map((o) => `<tr class="click" data-biz="${o.b.id}"><td class="pc ${o.b.payroll && o.b.payroll.active ? 'pc-' + o.b.payroll.period : 'pc-Other'}" style="width:6px;padding:0"></td><td class="name-cell">${esc(o.b.name)}</td><td class="small muted">${o.items.filter((i) => !i.waived).map((i) => i.label + (i.svc !== 'Payroll' ? ' (' + i.svc + ')' : '')).join(', ')}</td><td class="right num late">${usd(o.total)}</td><td class="right"><button class="link" data-waive="${o.b.id}">Waive</button></td></tr>`).join('')}</tbody></table>` : '<div class="muted" style="padding:6px 0">All received ✓</div>'}
      ${showWaived ? `<table class="t waived"><tbody>${wv.map((o) => `<tr><td class="faint">${esc(o.b.name)}</td><td class="small faint">${o.items.filter((i) => i.waived).map((i) => i.label).join(', ')}</td><td class="right num faint"><s>${usd(o.items.filter((i) => i.waived).reduce((s, i) => s + i.amt, 0))}</s></td><td class="right"><button class="link" data-unwaive="${o.b.id}">Undo</button></td></tr>`).join('')}</tbody></table>` : ''}</div>
    <div class="card"><div class="card-head"><h2>Q${q} progress</h2></div>
      ${prog.map((x) => `<div class="pgl"><span class="l">${pp(x.p)} <span class="muted small">${x.n}</span></span><span class="trk2"><span class="trk"><i class="pi-${x.p}" style="width:${x.t ? x.d / x.t * 100 : 0}%"></i></span>${ti('tip" style="left:' + (x.t ? x.d / x.t * 100 : 0) + '%')}</span><b>${x.d}/${x.t}</b></div>`).join('')}</div>
  </div>`;
}

// Fees › Summary: Formation kept as a record, NOT in totals; total row; month bars
function feesSummary() {
  const Y = YEARS.map((y) => ({ y, ...yearParts(y) })); const c = Y[0], p = Y[1] || { y: PY, ...yearParts(PY) };
  const pct = (a, b) => b ? Math.round((a / b - 1) * 100) : null;
  const chg = (a, b) => { const v = pct(a, b); return v == null ? '' : `<span class="${v >= 0 ? 'up' : 'dn'}">${v >= 0 ? '▲' : '▼'} ${Math.abs(v)}%</span>`; };
  const dif = (a, b) => { const v = a - b; return v ? `<span class="${v > 0 ? 'up' : 'dn'}">${v > 0 ? '+' : ''}${v}</span>` : '<span class="muted">±0</span>'; };
  const mx = Math.max(...Y.map((x) => x.tot), 1); const C = ['#7fb2e0', '#8fc9a8', '#f0c27b', '#b39ddb'];
  const A = Y.reduce((a, x) => ({ pay: a.pay + x.pay, bk: a.bk + x.bk, oth: a.oth + x.oth, form: a.form + x.form, tot: a.tot + x.tot, nForm: a.nForm + x.nForm }), { pay: 0, bk: 0, oth: 0, form: 0, tot: 0, nForm: 0 });
  const cell = (v, n, u) => `<td class="right num">${v ? usd(v) : '<span class="faint">—</span>'}${n ? `<span class="cnt2">${ti('sm')}${n} ${u}</span>` : ''}</td>`;
  return `<div class="sum-hero"><div class="ssl">${ti()}Year-to-date ${CYS}</div><div class="hv">${usd(c.tot)}</div><div class="sss">${chg(c.tot, p.tot)} vs ${p.y} (${usd(p.tot)})</div>
      <div class="mix">${[c.pay, c.bk, c.oth].map((v, i) => `<i style="width:${c.tot ? v / c.tot * 100 : 0}%;background:${C[i]}"></i>`).join('')}</div></div>
    ${statStrip([[`${ti()}Payroll <i class="dot" style="background:${C[0]}"></i>`, usd(c.pay), `<b>${c.nPay}</b> tiệm (${dif(c.nPay, p.nPay)} vs ${p.y}) · ${chg(c.pay, p.pay)}`],
      [`${ti()}Bookkeeping <i class="dot" style="background:${C[1]}"></i>`, usd(c.bk), `<b>${c.nBk}</b> tiệm (${dif(c.nBk, p.nBk)}) · ${chg(c.bk, p.bk)}`],
      [`${ti()}Other (extra + 1099) <i class="dot" style="background:${C[2]}"></i>`, usd(c.oth), `<b>${c.n99}</b> khách 1099 · ${chg(c.oth, p.oth)}`],
      [`${ti()}Formation <span class="xt20">ngoài total</span>`, `<span class="fm20">${usd(c.form)}</span>`, `<b>${c.nForm}</b> cty (${dif(c.nForm, p.nForm)})`, 'ssoff20']])}
    <table class="t ycmp fsum20"><thead><tr><th>Year</th><th class="right">Payroll</th><th class="right">Bookkeeping</th><th class="right">Other</th><th class="right">Total</th><th class="right">vs year before</th><th style="width:20%"></th><th class="right fcol20">Formation</th></tr></thead><tbody>
    ${Y.map((x, i) => `<tr><td><b>${x.y}</b>${i === 0 ? ' <span class="small muted">YTD</span>' : ''}</td>${cell(x.pay, x.nPay, 'tiệm')}${cell(x.bk, x.nBk, 'tiệm')}${cell(x.oth, x.n99, 'khách 1099')}<td class="right num"><b>${usd(x.tot)}</b></td><td class="right">${Y[i + 1] ? chg(x.tot, Y[i + 1].tot) : ''}</td>
      <td><span class="ybar">${[x.pay, x.bk, x.oth].map((v, k) => `<i style="width:${v / mx * 100}%;background:${C[k]}"></i>`).join('')}</span></td><td class="right num fcol20">${x.form ? usd(x.form) : '—'}${x.nForm ? `<span class="cnt2">${x.nForm} cty</span>` : ''}</td></tr>`).join('')}
    <tr class="tot"><td>All years</td><td class="right num">${usd(A.pay)}</td><td class="right num">${usd(A.bk)}</td><td class="right num">${usd(A.oth)}</td><td class="right num">${usd(A.tot)}</td><td></td><td></td><td class="right num fcol20">${usd(A.form)}<span class="cnt2">${A.nForm} cty</span></td></tr></tbody></table>
    <h2 class="bd-h" style="margin-top:34px">${CYS} by month</h2>${barsHtml(monthTotals(CYS))}`;
}
function barsHtml({ pay, oth }) {
  const mx = Math.max(...pay.map((v, i) => v + oth[i]), 1); const cm = CUR_M - 1;
  return `<div class="mb20">${pay.map((v, i) => { const t = v + oth[i]; return `<div class="c ${i === cm ? 'cur' : ''} ${i > cm ? 'fut' : ''}" title="${MON[i]}: payroll ${usd(v)} · bookkeeping & other ${usd(oth[i])}"><span class="v">${t ? '$' + (t / 1000).toFixed(1) + 'k' : ''}</span><div class="bk20"><i class="o" style="height:${oth[i] / mx * 100}%"></i><i class="p" style="height:${v / mx * 100}%"></i></div><span class="m">${MON[i]}</span></div>`; }).join('')}</div>
    <div class="legend"><span><i style="background:#8fb8e3"></i>Payroll fees</span><span><i style="background:#f3c98b"></i>Bookkeeping & other</span></div>`;
}
const PRICE0 = [['1-5', 80, 90, 120], ['<10', 95, 120, 175], ['<15', 130, 165, 245], ['<20', 170, 220, 320], ['<30', 230, 280, 380]];

// ---------- start bookkeeping for this year ----------
function START_BK(id) {
  const b = byId[id]; const L = (b.fees[CYS] ||= []);
  const open = () => { $$('.pay19.ovw').forEach((o) => o.remove()); feeTab = 'payroll'; feeView = 'month'; go('fees/' + id); };
  if (L.some((l) => l.svc === 'Bookkeeping')) { open(); return; }
  api('POST', '/pr/fee/line', { bid: b.id, year: CY, svc: 'Bookkeeping' }).then((r) => { L.push({ id: r.id, svc: 'Bookkeeping', m: {}, extra: 0, flags: [], xnote: '', hl: {} }); toast('Bookkeeping added · ghi tiền mỗi tháng khi nhận'); open(); }).catch(failT);
}

// ---------- Edit / Add business (incl. payroll + private + formation) ----------
function EDIT_FORM(b, opt) {
  const p = b && b.payroll, fm = b && b.formation;
  const f = (k, l, v, w = '') => `<label class="ef"><span>${l}</span><input type="text" data-ef="${k}" value="${esc(v ?? '')}" ${w}></label>`;
  const sel = (k, l, v, L) => `<label class="ef"><span>${l}</span><select data-ef="${k}">${L.map((t) => `<option ${v === t ? 'selected' : ''}>${t}</option>`).join('')}</select></label>`;
  const chk = (k, l, v) => `<label class="ef efc"><input type="checkbox" data-ef="${k}" ${v ? 'checked' : ''}> <span>${l}</span></label>`;
  const rows = opt.key ? sideAll().filter((o) => o.key === opt.key && !o.bid) : [];
  const hasP = !!(p || opt.payroll), hasF = !!(fm || opt.formation);
  const ov = modal(`<h2><span>${b ? 'Edit · ' + esc(b.name) : opt.key ? 'Add details · ' + esc(opt.name) : opt.payroll ? 'New payroll client' : opt.formation ? 'New formation' : 'New business'}</span><button class="x" data-x>×</button></h2>
    ${!DATA.encOk ? '<div class="ef-link late">Chưa đặt PR_ENC_KEY trên Netlify → không lưu được SSN / PIN / PW / bank / DL.</div>' : ''}
    ${rows.length ? `<div class="ef-link">Sẽ link <b>${rows.length}</b> dòng 1099: ${rows.sort((a, c) => a.year - c.year).map((o) => `${o.year} ${usd(o.amt)}`).join(' · ')}</div>` : ''}
    ${!b && opt.key ? `<label class="ef efx"><span>Đã có business? Link vào cty cũ</span><input type="text" id="eflink" list="efdl" placeholder="Gõ tên cty có sẵn… (bỏ trống = tạo mới)"><datalist id="efdl">${B.filter((x) => nkey(x.name).split(' ')[0] === (opt.key || '').split(' ')[0]).concat(B).slice(0, 400).map((x) => `<option value="${esc(x.name)}">`).join('')}</datalist></label><div class="ef-or">hoặc tạo business mới</div>` : ''}
    <div class="efg">${f('name', 'Business name', b ? b.name : opt.name)}${sel('type', 'Entity type', b ? b.type : '', ['', 'LLC', 'S-Corp', 'Corp', 'C-Corp', 'Sole Prop', 'Individual'])}
      ${f('ein', 'EIN', b && b.ein)}${f('sos', 'SOS #', b && b.sos)}${f('owner', 'Owner', b && b.owner)}${f('phone', 'Phone', b && b.phone)}${f('email', 'Email', b && b.email)}${f('addr', 'Address', b && b.addr)}
      ${f('ssn', 'Owner SSN 🔒', b && b.ssn)}${sel('status', 'Status', b ? b.status : 'Active', ['Active', 'Inactive', 'Closed'])}</div>
    <div class="efsec"><label class="efc"><input type="checkbox" id="efP" ${hasP ? 'checked' : ''}> <b>Payroll</b></label>
      <div class="efg" id="efPg" ${hasP ? '' : 'hidden'}>${chk('p.active', 'Active (đang làm)', p ? p.active : true)}${sel('p.period', 'Pay period', p ? p.period : 'Monthly', ['', ...PERIODS])}
        ${f('p.fee', 'Fee / month ($)', p && p.fee != null ? p.fee : '', 'inputmode="decimal"')}${f('p.fee_txt', 'Fee ghi chú (nếu không phải số)', p && p.fee_txt)}${f('p.eddno', 'EDD #', p && p.eddno)}
        ${f('p.pin', 'EFTPS PIN 🔒', p && p.pin)}${f('p.pw', 'Password 🔒', p && p.pw)}${f('p.pw_note', 'PW note (vd: chờ PIN)', p && p.pw_note)}${f('p.routing', 'Bank routing 🔒', p && p.routing)}${f('p.account', 'Bank account 🔒', p && p.account)}</div></div>
    <div class="efsec"><label class="efc"><input type="checkbox" id="efF" ${hasF ? 'checked' : ''}> <b>Formation</b></label>
      <div class="efg" id="efFg" ${hasF ? '' : 'hidden'}>${f('f.no', 'Formation #', fm && fm.no, 'inputmode="numeric"')}<label class="ef"><span>Date</span><input type="date" data-ef="f.date" value="${esc((fm && fm.date) || (opt.formation ? todayISO() : ''))}"></label>
        ${f('f.fee', 'Fee paid ($)', fm && fm.fee != null ? fm.fee : '', 'inputmode="decimal"')}${f('f.f2553', 'Form 2553', fm && fm.f2553)}${f('f.boir', 'BOIR', fm && fm.boir)}${f('f.dl', 'Driver license 🔒', fm && fm.dl)}
        ${chk('f.boi', 'BOI filed', fm && fm.boi)}${chk('f.permit', 'Seller permit', fm && fm.permit)}</div></div>
    <div class="btnrow" style="justify-content:flex-end;margin-top:14px">${b ? '<button class="btn" id="efd" style="margin-right:auto;color:#c0392b">Delete</button>' : ''}<button class="btn" data-x>Cancel</button><button class="btn primary" id="efs">Save</button></div>`, 'ef-modal');
  $('#efP', ov).onchange = (e) => { $('#efPg', ov).hidden = !e.target.checked; };
  $('#efF', ov).onchange = (e) => { $('#efFg', ov).hidden = !e.target.checked; };
  const done = (id, msg) => { ov.remove(); toast(msg); load(() => { render.keep = true; if (S.page === 'pay') render(); if (id && byId[id]) openBiz(id); }); };
  if ($('#efd', ov)) $('#efd', ov).onclick = () => { if (!confirm(`Xóa ${b.name}? (vào Trash, khôi phục được trong Settings)`)) return; api('DELETE', '/pr/biz/' + b.id).then(() => { $$('.pay19.ovw').forEach((o) => o.remove()); done(null, 'Đã xóa · vào Trash'); }).catch(failT); };
  $('#efs', ov).onclick = () => {
    const ln = $('#eflink', ov) && $('#eflink', ov).value.trim(); const ex = ln && B.find((x) => x.name.toLowerCase() === ln.toLowerCase());
    if (ex) { api('POST', '/pr/1099/link', { key: opt.key, bid: ex.id }).then(() => done(ex.id, `Linked ${rows.length} rows 1099 → ${ex.name}`)).catch(failT); return; }
    const v = {}; $$('[data-ef]', ov).forEach((i) => { v[i.dataset.ef] = i.type === 'checkbox' ? i.checked : i.value.trim(); });
    if (!v.name) { toast('Enter the business name', true); return; }
    const sec = (pre, cur, secret) => { const o = {}; Object.keys(v).filter((k) => k.startsWith(pre)).forEach((k) => { const kk = k.slice(2); if (secret.includes(kk) && cur && String(cur[kk] || '') === v[k]) return; if (secret.includes(kk) && !cur && !v[k]) return; o[kk] = v[k]; }); return o; };
    const body = { name: v.name, type: v.type, ein: v.ein, sos: v.sos, owner: v.owner, phone: v.phone, email: v.email, addr: v.addr, status: v.status };
    if (!b ? v.ssn : v.ssn !== (b.ssn || '')) body.ssn = v.ssn;
    if ($('#efP', ov).checked) body.payroll = sec('p.', p, ['pin', 'pw', 'routing', 'account']); else if (p && p.active) body.payroll = { active: false };
    if ($('#efF', ov).checked) body.formation = sec('f.', fm, ['dl']);
    if (!b && opt.key) body.link1099 = opt.key;
    const bt = $('#efs', ov); bt.disabled = true;
    (b ? api('PATCH', '/pr/biz/' + b.id, body).then(() => b.id) : api('POST', '/pr/biz', body).then((r) => r.id))
      .then((id) => done(id, rows.length ? `Saved · linked ${rows.length} rows 1099` : 'Saved')).catch((er) => { bt.disabled = false; failT(er); });
  };
}

// ---------- Settings ----------
let setTab = 'email', SN = null, SI = null, TRASH = null;
let tplTimer = null;
function saveTpl() { clearTimeout(tplTimer); tplTimer = setTimeout(() => { api('PUT', '/pr/templates', { list: TPL }).then(() => toast('Templates saved')).catch(failT); }, 900); }
P.settings = () => `<div class="page-head"><div><h1>Settings</h1></div></div>
  <div class="set-layout"><nav class="set-nav"><div class="g">Payroll</div>${[['email', 'Email templates'], ['price', 'Price list'], ['news', 'News (tự cập nhật)']].map(([k, t]) => `<a class="${setTab === k ? 'on' : ''}" data-st="${k}">${t}</a>`).join('')}
    <div class="g">Data</div>${[['import', 'Import lại (không bắt buộc)'], ['trash', 'Trash (payroll)']].map(([k, t]) => `<a class="${setTab === k ? 'on' : ''}" data-st="${k}">${t}</a>`).join('')}
    <div class="g mk-g">Dùng chung với Tax</div><span class="mk-off">Login · Users · Theme · Security → Settings của Tax</span></nav>
  <div class="set-main">${setTab === 'news' ? newsHtml() : setTab === 'import' ? importHtml() : setTab === 'price' ? priceHtml() : setTab === 'trash' ? trashHtml() : tplHtml()}</div></div>`;
const tplHtml = () => `<div class="rules-top"><h2>Email templates</h2><button class="btn small" data-pa="addtpl">+ Add template</button></div>
    <div class="hint" style="margin-bottom:14px">Chữ trong {ngoặc} tự thay khi bấm <b>Prep email</b>: <code>{owner}</code> tên chủ · <code>{business}</code> tên cty · <code>{period}</code> Q4 ${CYS} / October ${CYS} (VN: quý 4/${CYS}, tháng 10/${CYS}) · <code>{fee}</code>. Tự lưu khi gõ.</div>
    ${TPL.map((t, i) => `<div class="tpl"><div class="btnrow"><input type="text" class="tname" data-tn="${i}" value="${esc(t.name)}"><button class="link faint" data-pa="deltpl" data-i="${i}">Xóa</button></div>
      <div class="tcols"><div><div class="tl">English</div><input type="text" data-tf="${i}|en|s" value="${esc(t.en.s)}"><textarea data-tf="${i}|en|b">${esc(t.en.b)}</textarea></div>
      <div><div class="tl">Tiếng Việt</div><input type="text" data-tf="${i}|vn|s" value="${esc(t.vn.s)}"><textarea data-tf="${i}|vn|b">${esc(t.vn.b)}</textarea></div></div></div>`).join('')}`;
let PR_EDIT = null;
const priceHtml = () => { PR_EDIT ||= (DATA.price && DATA.price.length ? DATA.price : PRICE0).map((r) => r.slice());
  return `<div class="rules-top"><h2>Payroll price list</h2><div class="btnrow"><button class="btn small" data-pa="addprice">+ Row</button><button class="btn small primary" data-pa="saveprice">Save</button></div></div>
  <table class="fee-t" style="max-width:560px"><thead><tr><th># Employees</th><th>Monthly</th><th>Bi-weekly</th><th>Weekly</th><th></th></tr></thead><tbody>${PR_EDIT.map((r, i) => `<tr>${r.map((v, k) => `<td><input type="text" data-pr="${i}|${k}" value="${esc(v)}" style="width:${k ? 70 : 90}px" ${k ? 'inputmode="decimal"' : ''}></td>`).join('')}<td><button class="link faint" data-pa="delprice" data-i="${i}">×</button></td></tr>`).join('')}</tbody></table>`; };
const FEEDN = { tax: ['Homepage Tax', 'IRS Newsroom (2 tin) · CA FTB Tax News / Newsroom (2 tin)', 'mỗi 3 ngày'], payroll: ['Payroll › Home', 'IRS · CA EDD · SSA · CA DIR (3 tin)', 'mỗi tuần (thứ Hai)'] };
function newsHtml() {
  if (!SN) { SN = {}; ['payroll', 'tax'].forEach((f) => api('GET', '/news?feed=' + f + '&all=1').then((d) => { SN[f] = d; if (setTab === 'news' && CUR.r === 'settings') { render.keep = true; render(); } }).catch(failT)); }
  const dt = (x) => x ? new Date(x).toLocaleString('en-US', { timeZone: 'America/Los_Angeles', month: '2-digit', day: '2-digit', year: 'numeric', hour: 'numeric', minute: '2-digit' }) : '—';
  return `<div class="rules-top"><h2>News · tự cập nhật</h2></div>
  <div class="hint" style="margin-bottom:12px">Lấy tiêu đề từ trang chính thức (không dùng AI). Lỗi khi lấy → giữ tin cũ. Bỏ tick “Hiện” để ẩn 1 tin.</div>
  ${['payroll', 'tax'].map((f) => { const d = SN[f]; const fd = d && d.feed; const [where, src, every] = FEEDN[f];
    return `<div class="fyear"><div class="fyh"><h2>${where}</h2><span class="muted small">${src} · ${every}</span><button class="btn small primary" data-pa="pull" data-f2="${f}" style="margin-left:auto">Pull now</button></div>
      <div class="muted small">Lần cuối: ${dt(fd && fd.last_run)}${fd && fd.last_error ? ` · <span class="late">${esc(fd.last_error)}</span>` : ''}</div>
      ${!d ? '<div class="muted small">Đang tải…</div>' : d.items.length ? `<table class="t" style="margin-top:6px"><thead><tr><th style="width:52px">Hiện</th><th>Nguồn</th><th>Tiêu đề</th><th>Ngày</th></tr></thead><tbody>${d.items.slice(0, 25).map((n) => `<tr class="${n.hidden ? 'faint' : ''}"><td><input type="checkbox" data-nh="${n.id}" ${n.hidden ? '' : 'checked'}></td><td class="small nowrap">${esc(n.src)}</td><td><a href="${esc(n.url)}" target="_blank" rel="noopener">${esc(n.title)}</a></td><td class="small nowrap">${esc(n.date)}</td></tr>`).join('')}</tbody></table>` : '<div class="muted small" style="padding:6px 0">Chưa có tin · bấm Pull now.</div>'}</div>`; }).join('')}`;
}
function importHtml() {
  const st = SI && SI.stats;
  return `<h2 style="border-bottom:1px solid var(--line);padding-bottom:6px;margin-bottom:12px">Import from Google Sheet</h2>
  <div class="hint" style="margin-bottom:12px"><b>Không cần dùng</b>: dữ liệu đã có sẵn từ <code>sql/11-v20-payroll-data.sql</code>. Chỉ dùng khi muốn nạp lại toàn bộ từ Google Sheet (File › Download › .xlsx) – sẽ <b>thay toàn bộ</b> dữ liệu payroll đang có.</div>
  <div class="btnrow"><input type="file" id="prfile" accept=".xlsx"><button class="btn" data-pa="impprev">Xem trước</button></div>
  ${SI && SI.busy ? '<div class="muted" style="margin-top:12px">Đang đọc file…</div>' : ''}
  ${st ? `<table class="t" style="max-width:760px;margin-top:14px"><tbody>
    <tr><td>Business sau khi gộp</td><td class="right"><b>${st.businesses}</b></td><td class="muted small">${st.merged} cty có ở nhiều tab → 1 record</td></tr>
    <tr><td>Payroll active</td><td class="right">${st.active}</td><td class="muted small">${PERIODS.map((p, i) => `${p} ${st.byPeriod[i]}`).join(' · ')}</td></tr>
    <tr><td>Formations</td><td class="right">${st.formations}</td><td></td></tr>
    <tr><td>1099 / Annual</td><td class="right">${st.side}</td><td class="muted small">${st.linked} dòng link được vào business</td></tr></tbody></table>
    ${SI.merges && SI.merges.length ? `<details style="margin-top:10px;max-width:760px"><summary><b>${SI.merges.length}</b> cty gộp từ nhiều tab · bỏ tick nếu gộp sai</summary><div style="max-height:260px;overflow:auto">${SI.merges.map((m) => `<label class="efc" style="display:block;padding:2px 0"><input type="checkbox" data-mg="${m.id}" ${SI.skip.has(m.id) ? '' : 'checked'}> ${esc(m.name)} <span class="muted small">${esc(m.ein || '')} · ${m.links.map((l) => esc(l.src)).join(' + ')}</span></label>`).join('')}</div></details>` : ''}
    ${SI.saved ? '<div class="ok" style="margin-top:12px">✓ Đã lưu · đã tự waive các khoản cũ (trước năm nay)</div>' : `<div class="btnrow" style="margin-top:14px">${B.length ? `<label class="efc"><input type="checkbox" id="prrep"> Thay toàn bộ ${B.length} business hiện có</label>` : ''}<button class="btn primary" data-pa="impsave">Lưu vào database</button></div>`}` : ''}`;
}
function trashHtml() {
  if (!TRASH) { TRASH = { busy: true, list: [] }; api('GET', '/pr/trash').then((L) => { TRASH = { list: L }; if (setTab === 'trash') { render.keep = true; render(); } }).catch(failT); }
  return `<div class="rules-top"><h2>Trash (payroll)</h2><span class="muted small">giữ 100 ngày</span></div>
  ${TRASH.busy ? '<div class="muted">Đang tải…</div>' : TRASH.list.length ? `<table class="t" style="max-width:760px"><tbody>${TRASH.list.map((x) => `<tr><td class="small muted">${x.kind === 'biz' ? 'Business' : 'Note'}</td><td>${esc(x.name)}</td><td class="small muted">${esc(x.by)} · ${md(String(x.at).slice(0, 10))}</td><td class="right"><button class="link" data-pa="restore" data-i="${x.id}">Khôi phục</button></td></tr>`).join('')}</tbody></table>` : '<div class="muted small">Trống.</div>'}`;
}
const readB64 = (file) => new Promise((ok, no) => { const r = new FileReader(); r.onload = () => ok(r.result); r.onerror = () => no(new Error('Không đọc được file')); r.readAsDataURL(file); });
function SET_ACT(act, a) {
  const rr = () => { render.keep = true; render(); };
  if (act === 'addtpl') { TPL.push({ id: 'n' + Date.now(), name: 'New template', en: { s: '{business} - ', b: 'Hi {owner},\n\n\n\nThank you' }, vn: { s: '{business} - ', b: 'Chào anh/chị {owner},\n\n\n\nCảm ơn anh/chị' } }); saveTpl(); rr(); }
  else if (act === 'deltpl') { const i = +a.dataset.i; if (!confirm('Xóa template “' + TPL[i].name + '”?')) return; TPL.splice(i, 1); saveTpl(); rr(); }
  else if (act === 'addprice') { PR_EDIT.push(['', 0, 0, 0]); rr(); }
  else if (act === 'delprice') { PR_EDIT.splice(+a.dataset.i, 1); rr(); }
  else if (act === 'saveprice') { const v = PR_EDIT.filter((r) => String(r[0]).trim()).map((r) => [String(r[0]).trim(), Number(r[1]) || 0, Number(r[2]) || 0, Number(r[3]) || 0]); api('PUT', '/settings/pr_price', { value: v }).then(() => { DATA.price = v; PR_EDIT = null; toast('Price list saved'); rr(); }).catch(failT); }
  else if (act === 'pull') { const f = a.dataset.f2; a.disabled = true; a.textContent = 'Đang lấy…'; api('POST', '/news/pull', { feed: f }).then((r) => { toast(`Lấy ${r.added} tin` + (r.errors.length ? ` · lỗi ${r.errors.length} nguồn` : ''), !!r.errors.length && !r.added); SN = null; if (f === 'payroll') NEWS = null; rr(); }).catch((er) => { a.disabled = false; a.textContent = 'Pull now'; failT(er); }); }
  else if (act === 'impprev') { const fl = $('#prfile') && $('#prfile').files[0]; if (!fl) { toast('Chọn file .xlsx', true); return; } if (fl.size > 4.2 * 1024 * 1024) { toast('File quá lớn (tối đa ~4 MB)', true); return; }
    SI = { busy: true, skip: new Set() }; rr(); readB64(fl).then((b64) => { SI.file = b64; return api('POST', '/pr/import', { file: b64, save: false }); }).then((r) => { SI = { ...SI, busy: false, stats: r.stats, merges: r.merges || [] }; rr(); }).catch((er) => { SI = null; rr(); failT(er); }); }
  else if (act === 'impsave') { if (!SI || !SI.file) return; const rep = $('#prrep') ? $('#prrep').checked : false; if (B.length && !rep) { toast('Tick “Thay toàn bộ” để import lại', true); return; }
    if (B.length && !confirm(`Thay toàn bộ ${B.length} business + fees + 1099 + notes payroll bằng dữ liệu trong file?`)) return; a.disabled = true; a.textContent = 'Đang lưu…';
    api('POST', '/pr/import', { file: SI.file, save: true, replace: rep, skip: [...SI.skip] }).then((r) => { SI.saved = true; delete SI.file; ST.autoWaive = !!r.autoWaive; load(() => { toast(`Đã import ${r.stats.businesses} business`); rr(); }); }).catch((er) => { a.disabled = false; a.textContent = 'Lưu vào database'; failT(er); }); }
  else if (act === 'restore') { api('POST', `/pr/trash/${a.dataset.i}/restore`).then(() => { TRASH = null; toast('Đã khôi phục'); load(); }).catch(failT); }
}
function SET_CHANGE(e) {
  const t = e.target;
  if (t.dataset.nh) { const id = +t.dataset.nh; api('PATCH', '/news/' + id, { hidden: !t.checked }).then(() => { Object.values(SN || {}).forEach((d) => d && d.items.forEach((n) => { if (n.id === id) n.hidden = !t.checked; })); NEWS = null; t.closest('tr').classList.toggle('faint', !t.checked); }).catch(failT); }
  if (t.dataset.pr) { const [i, k] = t.dataset.pr.split('|'); PR_EDIT[i][k] = +k ? Number(t.value.replace(/[$,]/g, '')) || 0 : t.value; }
  if (t.dataset.mg && SI) { const id = +t.dataset.mg; if (t.checked) SI.skip.delete(id); else SI.skip.add(id); }
}
// clicks on the settings nav: refresh data when switching
const _st0 = (st) => { if (st === 'news') SN = null; if (st === 'trash') TRASH = null; };
document.addEventListener('click', (e) => { const s = e.target.closest && e.target.closest('.pay19 [data-st]'); if (s) _st0(s.dataset.st); }, true);

return { render: () => render(), shell: () => shell(), go, sub: () => CUR.r, reload: () => load() };
})();
