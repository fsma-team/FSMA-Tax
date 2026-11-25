// Payroll & Service: read "Payroll Infos.xlsx" (Google Sheet export) and merge into 1 record per company.
// Port of claude/business-merge.py. PW & INFOS columns are found by the header on row 21 (column T "start" was deleted).
import ExcelJS from 'exceljs';

// ---------- cell helpers ----------
const raw = (c) => {
  if (c && c.isMerged && c.master && c.master.address !== c.address) return null; // merged cell: only the first cell has the value
  let v = c?.value;
  if (v && typeof v === 'object' && !(v instanceof Date)) {
    if ('result' in v) v = v.result;
    else if (v.richText) v = v.richText.map((t) => t.text).join('');
    else if ('text' in v) v = v.text;
    else if ('formula' in v || 'sharedFormula' in v) v = null;
  }
  return v ?? null;
};
const s = (v) => (v === null || v === undefined ? '' : String(v).trim().replace(/[‪‬]/g, ''));
function num(v) {
  if (v === null || v === undefined || v === '') return null;
  if (typeof v === 'number') return v;
  let t = String(v).trim();
  if (t.startsWith('=')) { t = t.slice(1); if (/^[\d.+\-* ]+$/.test(t)) { try { return Function(`return (${t})`)(); } catch { return null; } } return null; }
  const n = Number(t.replace(/[$,]/g, ''));
  return Number.isFinite(n) && t !== '' ? n : null;
}
const d = (v) => (v instanceof Date && !Number.isNaN(v.getTime()) ? v.toISOString().slice(0, 10) : '');
const ein = (v) => { const x = s(v).replace(/\D/g, ''); return x.length === 9 ? `${x.slice(0, 2)}-${x.slice(2)}` : ''; };
function phone(v) {
  let x = (typeof v === 'number' ? String(Math.round(v)) : s(v)).replace(/\D/g, '');
  if (x.length === 11 && x[0] === '1') x = x.slice(1);
  return x.length === 10 ? `(${x.slice(0, 3)}) ${x.slice(3, 6)}-${x.slice(6)}` : s(v);
}
const sos = (v) => (typeof v === 'number' ? String(Math.round(v)) : ['-', 'None'].includes(s(v)) ? '' : s(v));
const digits = (v) => (typeof v === 'number' ? String(Math.round(v)) : s(v));
const titleWords = (t) => t.toLowerCase().replace(/(^|[^a-z'’])([a-z])/g, (m, a, c) => a + c.toUpperCase());

const STOP = new Set(['llc', 'inc', 'corp', 'corporation', 'co', 'the', 'and', 'company', 'limited', 'liability', 'dba', 'services', 'service']);
export const nkey = (n) => String(n || '').toLowerCase().replace(/&/g, ' and ').replace(/[^a-z0-9 ]/g, ' ').split(/\s+/).filter((w) => w && !STOP.has(w)).join(' ');
const KEEP = new Set(['LLC', 'LLP', 'LP', 'PC', 'USA', 'US', 'II', 'III', 'IV', 'CPA', 'DDS', 'MD', 'PA', 'LA', 'CA']);
export function nice(n) { // Title Case company names (ABC INC -> Abc Inc)
  return String(n || '').replace(/\s+/g, ' ').trim().split(' ').map((w) => {
    const core = w.replace(/[^A-Za-z]/g, ''); const U = core.toUpperCase();
    if (KEEP.has(U)) return w.toUpperCase(); if (U === 'DBA') return 'dba';
    if (core && core.length <= 3 && !/[AEIOUY]/i.test(core)) return w.toUpperCase();
    return w.toLowerCase().replace(/(^|[^a-z'’])([a-z])/g, (m, a, c) => a + c.toUpperCase());
  }).join(' ');
}
function guessType(n) {
  const l = n.toLowerCase();
  if (/\bllc\b|limited liability/.test(l)) return 'LLC';
  if (/\binc\b|\bcorp|incorporated|company/.test(l)) return 'Corp';
  if (l.includes(' dba ')) return 'Sole Prop';
  return '';
}
const COLORS = { D9EAD3: 'Quarterly', F4CCCC: 'Monthly', FFF2CC: 'Bi-weekly', C9DAF8: 'Semi-monthly', CFE2F3: 'Semi-monthly' };
const fillRgb = (c) => { const f = c?.fill; if (!f || f.type !== 'pattern' || !f.fgColor || !f.fgColor.argb) return ''; return String(f.fgColor.argb).slice(-6).toUpperCase(); };

export async function parseWorkbook(buf) {
  const wb = new ExcelJS.Workbook();
  await wb.xlsx.load(buf);
  const sheet = (n) => { const ws = wb.getWorksheet(n); if (!ws) throw new Error(`Không thấy tab "${n}" trong file`); return ws; };
  const biz = new Map(); const byEin = new Map(); const byKey = new Map(); let nextId = 1;
  function get(name, e) {
    const k = nkey(name);
    let b = (e && byEin.get(e)) || byKey.get(k);
    if (!b) { b = { id: nextId++, name, type: '', ein: e, sos: '', addr: '', phone: '', email: '', owner: '', ssn: '', si_due: '', formed: '', src: [], payroll: null, formation: null, fees: {}, cand: [] }; biz.set(b.id, b); }
    if (e) byEin.set(e, b);
    byKey.set(k, b);
    return b;
  }
  const fill = (b, src, dt, kw) => b.cand.push([src, dt, kw]);

  // ----- PW & INFOS (priority) -----
  const pw = sheet('PW & INFOS');
  const H = {}; pw.getRow(21).eachCell({ includeEmpty: false }, (c, col) => { const t = s(raw(c)).toUpperCase(); if (t) H[t] = col; });
  const need = ['NAME', 'EIN', 'PIN', 'PW', 'SSN', 'PHONE', 'ADDR', 'EDD#', 'SOS', 'IRS', 'EDD', 'FILED', 'SI DUE'];
  const miss = need.filter((k) => !H[k]); if (miss.length) throw new Error('PW & INFOS hàng 21 thiếu cột: ' + miss.join(', '));
  const C = { name: H.NAME, email: H.NAME - 1, fee: H.NAME + 1, ein: H.EIN, pin: H.PIN, pw: H.PW, ssn: H.SSN, routing: H.SSN + 1, account: H.SSN + 2, phone: H.PHONE, addr: H.ADDR, eddno: H['EDD#'], sos: H.SOS, irs: H.IRS, edd: H.EDD, owner: H.EDD + 1, formed: H.FILED, si: H['SI DUE'] };
  for (let r = 22; r <= pw.rowCount; r++) {
    if (r >= 77 && r <= 82) continue;
    const row = pw.getRow(r); const cell = (k) => raw(row.getCell(C[k]));
    const n = s(cell('name')); if (!n) continue;
    const rgb = fillRgb(row.getCell(C.name)); const active = rgb in COLORS;
    const e = ein(cell('ein')); const b = get(n, e);
    const pdt = active ? '9999' : [d(cell('formed')), d(cell('si'))].sort().pop();
    fill(b, active ? 'Payroll' : 'Payroll (old)', pdt, { name: n, sos: sos(cell('sos')), addr: s(cell('addr')), phone: phone(cell('phone')), email: s(cell('email')), owner: titleWords(s(cell('owner'))), formed: d(cell('formed')), ssn: s(cell('ssn')) });
    if (d(cell('si'))) b.si_due = d(cell('si'));
    b.gtype = guessType(n);
    const months = [], qs = [];
    for (let i = 1; i <= 16; i++) { const t = raw(row.getCell(i)); const v = t === true ? 1 : t === false ? 0 : null; if (i % 4 === 0) qs.push(v); else months.push(v); }
    if (b.payroll && b.payroll.active && !active) { b.src.push('payroll'); continue; } // old grey row never overwrites the active one
    const fee = cell('fee'); const pwv = s(cell('pw'));
    b.payroll = { period: COLORS[rgb] || '', active, fee: num(fee), fee_txt: num(fee) === null ? s(fee) : '', start: '', irs: s(cell('irs')).toUpperCase() === 'X', edd: s(cell('edd')).toUpperCase() === 'X',
      pin: digits(cell('pin')), pw: pwv.startsWith('applied') ? '' : pwv, pw_note: pwv.startsWith('applied') ? pwv : '', routing: digits(cell('routing')), account: digits(cell('account')), eddno: s(cell('eddno')), months, qs };
    b.src.push('payroll');
  }

  // ----- Business Services -----
  const bs = sheet('Business Services'); let cur = 'LLC';
  const TMAP = { LLC: 'LLC', Corp: 'Corp', 'S-Corp': 'S-Corp', 'Single Mem LLC': 'LLC' };
  for (let r = 2; r <= bs.rowCount; r++) {
    const row = bs.getRow(r); const c = (i) => raw(row.getCell(i));
    if (s(c(1))) cur = TMAP[s(c(1))] || s(c(1));
    const n = s(c(4)).replace(/\n/g, ' ').trim(); if (!n) continue;
    const b = get(n, ein(c(6)));
    let own = s(c(9)); if (/^[\d(-]/.test(own)) own = '';
    fill(b, 'Business Services', d(c(5)), { name: n, sos: sos(c(7)), addr: s(c(8)), phone: phone(c(10)), email: s(c(12)), owner: titleWords(own), ssn: s(c(11)) });
    if (d(c(5))) b.si_due = d(c(5));
    if (!b.ftype) b.btype = cur;
    if (!b.src.includes('si')) b.src.push('si');
  }

  // ----- Formations -----
  const fm = sheet('Formations');
  for (let r = 10; r <= fm.rowCount; r++) {
    const row = fm.getRow(r); const c = (i) => raw(row.getCell(i));
    const n = s(c(7)); if (!n) continue;
    const b = get(n, ein(c(9)));
    const t = s(c(2)).replace('S Corp', 'S-Corp').replace('C Corp', 'C-Corp');
    fill(b, 'Formation', [d(c(3)), d(c(8))].sort().pop(), { name: n, sos: sos(c(10)), addr: s(c(11)), phone: phone(c(13)), email: s(c(17)), owner: titleWords(s(c(12))), formed: d(c(3)), ssn: s(c(14)) });
    if (t) b.ftype = t;
    if (d(c(8)) && !b.si_due) b.si_due = d(c(8));
    b.formation = { no: Math.round(num(c(1)) || 0), date: d(c(3)), boi: c(4) === true, si: c(5) === true, f2553: s(c(15)), fee: num(c(16)), dl: s(c(18)), boir: s(c(19)), permit: !!s(c(20)) };
    if (!b.src.includes('formation')) b.src.push('formation');
  }

  // ----- Fees (year blocks; 1099 / Annual side lists) -----
  const fs = sheet('Fees'); const others = []; let year = null; let mode = null;
  const rows = []; fs.eachRow({ includeEmpty: true }, (row, r) => { const a = []; for (let i = 1; i <= 25; i++) a.push(raw(row.getCell(i))); rows[r - 1] = a; });
  for (let i = 0; i < rows.length; i++) {
    const row = rows[i] || Array(25).fill(null);
    const a = s(row[0]); const y = num(row[1]);
    if ((!a || (a === a.toUpperCase() && a.includes('BAO'))) && y && y > 2020 && y < 2030 && !s(row[2])) { year = Math.round(y); mode = (rows[i + 1] || []).map((x) => s(x).toUpperCase()); continue; }
    if (a && a !== 'Total' && year && !(num(row[1]) === 1 && num(row[2]) === 2)) {
      let svc = 'Payroll';
      if (a.toLowerCase().includes('(sale tax')) svc = 'Sales tax';
      let a2 = a.replace(/\(.*?\)/g, '').trim();
      if (/\bbookkeeping$|\bbo$/.test(a2.toLowerCase())) { a2 = a2.replace(/\s+(bookkeeping|bo)$/i, ''); svc = 'Bookkeeping'; }
      if (['Nailbay by Lany INC', 'Pack Your Food'].includes(a2) || a2.toLowerCase().startsWith('intchsolutions')) svc = 'Bookkeeping';
      const cands = [a2].concat(a2.toLowerCase().includes(' dba ') ? [a2.toLowerCase().split(' dba ')[1]] : []);
      let b = null;
      for (const cnd of cands) {
        const k = nkey(cnd);
        b = byKey.get(k) || [...biz.values()].find((x) => k.length > 5 && (nkey(x.name).startsWith(k.slice(0, 12)) || nkey(x.name).includes(k) || (x.name.toLowerCase().includes(' dba ') && nkey(x.name.toLowerCase().split(' dba ')[1]) === k))) || null;
        if (b) break;
      }
      if (!b && a2.toLowerCase().startsWith('nhut')) b = [...biz.values()].find((x) => x.name.startsWith('Nhut')) || null;
      const months = {}; const flags = [];
      for (let m = 0; m < 12; m++) { const v = row[1 + m]; const n_ = num(v); if (n_ !== null && n_ >= 0) months[m + 1] = n_; else if (s(v) && n_ === null) flags.push(`${m + 1}: ${titleWords(s(v))}`); }
      const extra = num(row[13]); const extraT = extra === null ? s(row[13]) : '';
      if (!b) { b = get(a2, ''); b.src.push('fees-only'); }
      const yl = (b.fees[String(year)] ||= []);
      if (svc === 'Payroll' && yl.some((l) => l.svc === 'Payroll')) svc = [...Array(12).keys()].some((m) => (m + 1) % 3 && num(row[1 + m])) ? 'Bookkeeping' : 'Other';
      const fy = { svc, m: {}, extra: 0, flags: [], xnote: '' }; yl.push(fy);
      for (const [m, v] of Object.entries(months)) fy.m[m] = (fy.m[m] || 0) + v;
      if (extra) fy.extra += extra;
      if (extraT) fy.xnote = extraT;
      fy.flags.push(...flags);
    }
    const side = (nc, ac, kind) => { const n = s(row[nc]); const v = num(row[ac]); if (n && !/^[\d.,\s]+$/.test(n) && !['1099 FEES', 'ANNUAL'].includes(n.toUpperCase()) && v) others.push({ year, name: n, amt: v, kind }); };
    if (year && mode) {
      if (year >= 2025) side(15, 16, '1099');
      else if (year === 2024) { side(15, 16, 'Annual'); side(17, 18, '1099'); }
      else if (year === 2023) side(17, 18, '1099');
    }
  }

  // ----- resolve fields: payroll active = newest, else newest date wins -----
  const out = [];
  for (const b of biz.values()) {
    const c = b.cand.slice().sort((x, y) => (y[1] || '0000').localeCompare(x[1] || '0000'));
    b.links = c.map(([src, date]) => ({ src, date }));
    for (const k of ['name', 'sos', 'addr', 'phone', 'email', 'owner', 'formed', 'ssn']) for (const [, , kw] of c) { if (kw[k]) { b[k] = kw[k]; break; } }
    b.type = b.ftype || b.btype || b.gtype || '';
    b.name = nice(b.name);
    delete b.cand; delete b.ftype; delete b.btype; delete b.gtype;
    const fl = Object.values(b.fees).flat().flatMap((l) => l.flags).join(' ').toLowerCase();
    b.status = b.payroll && !b.payroll.active ? 'Inactive' : 'Active';
    if (/closed|terminat/.test(fl)) b.status = 'Closed'; else if (/transfer/.test(fl) && !(b.payroll && b.payroll.active)) b.status = 'Transferred';
    out.push(b);
  }
  // 1099 / annual: exact key, or exactly one business whose key starts with it
  const BK = out.map((b) => [nkey(b.name), b]);
  for (const o of others) {
    o.name = nice(o.name); o.key = nkey(o.name);
    const bb = byKey.get(nkey(o.name)); let hit = bb && out.includes(bb) ? bb : null;
    if (!hit && o.key.length >= 4) { const ex = BK.find(([k]) => k === o.key); const pre = BK.filter(([k]) => k.startsWith(o.key + ' ')); hit = ex ? ex[1] : pre.length === 1 ? pre[0][1] : null; }
    o.bid = hit ? hit.id : null;
  }
  // review list: companies merged by NAME (not EIN) from different sources
  const merges = out.filter((b) => new Set(b.links.map((l) => l.src)).size > 1).map((b) => ({ id: b.id, name: b.name, ein: b.ein, links: b.links }));
  const pr = out.filter((b) => b.payroll && b.payroll.active);
  const stats = { businesses: out.length, active: pr.length, byPeriod: ['Bi-weekly', 'Semi-monthly', 'Monthly', 'Quarterly'].map((p) => pr.filter((b) => b.payroll.period === p).length),
    formations: out.filter((b) => b.formation).length, side: others.length, linked: others.filter((o) => o.bid).length, merged: merges.length };
  return { biz: out, side: others, merges, stats };
}
