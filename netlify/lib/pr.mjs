// Payroll & Service (Admin only). Data shape = the client model of the v20 mockup (public/js/pay20.js).
import { db, HttpError, s, num, todayLA } from './core.mjs';
import { enc, dec, hasKey } from './crypt.mjs';
import { parseWorkbook, nkey, nice } from './primport.mjs';

const PERIODS = ['Bi-weekly', 'Semi-monthly', 'Monthly', 'Quarterly'];
const TYPES = ['', 'LLC', 'S-Corp', 'Corp', 'C-Corp', 'Sole Prop', 'Individual'];
const STATUSES = ['Active', 'Inactive', 'Closed', 'Transferred'];
const SVCS = ['Payroll', 'Bookkeeping', 'Sales tax', 'Other'];
const t = (v, max = 300) => (v === null || v === undefined ? '' : String(v).trim().slice(0, max));
const dt = (v) => { const x = t(v, 10); return /^\d{4}-\d{2}-\d{2}$/.test(x) ? x : null; };
const n2 = (v) => (v === null || v === undefined ? null : Number(v));

async function audit(sql, user, action, kind, rowId, before, after) {
  await sql`insert into pr_audit (user_name, action, kind, row_id, before, after) values (${user.display_name}, ${action}, ${kind}, ${rowId == null ? null : String(rowId)}, ${before ? sql.json(before) : null}, ${after ? sql.json(after) : null})`;
}

// ---------- read everything (secrets decrypted for admin) ----------
export async function prData() {
  const sql = db();
  const B = await sql`select * from pr_businesses where deleted_at is null order by id`;
  const P = await sql`select * from pr_payroll`;
  const T = await sql`select business_id, year, slot, done from pr_ticks`;
  const F = await sql`select * from pr_formations`;
  const L = await sql`select * from pr_fee_lines order by business_id, year, sort, id`;
  const N = await sql`select * from pr_notes order by created_at`;
  const S1 = await sql`select * from pr_1099 order by year desc, name`;
  const W = await sql`select k from pr_waivers`;
  const TP = await sql`select * from pr_email_templates order by sort, id`;
  const [price] = await sql`select value from settings where key = 'pr_price'`;
  const by = new Map();
  const biz = B.map((b) => {
    const o = { id: b.id, name: b.name, type: b.type, ein: b.ein, sos: b.sos, addr: b.addr, phone: b.phone, email: b.email, owner: b.owner, ssn: dec(b.ssn_enc),
      formed: b.formed || '', si_due: b.si_due || '', status: b.status, links: b.links || [], payroll: null, rep: {}, formation: null, fees: {}, notes: [], pnote: '' };
    by.set(b.id, o); return o;
  });
  for (const p of P) { const o = by.get(p.business_id); if (!o) continue;
    o.payroll = { active: p.active, period: p.period, fee: n2(p.fee), fee_txt: p.fee_txt, start: p.start_txt, irs: p.irs, edd: p.edd, eddno: p.eddno,
      pin: dec(p.pin_enc), pw: dec(p.pw_enc), pw_note: p.pw_note, routing: dec(p.routing_enc), account: dec(p.account_enc) };
    o.pnote = p.note || '';
  }
  for (const k of T) { const o = by.get(k.business_id); if (!o) continue;
    const R = (o.rep[k.year] ||= { m: Array(12).fill(null), q: Array(4).fill(null) });
    const i = +k.slot.slice(1) - 1; (k.slot[0] === 'm' ? R.m : R.q)[i] = k.done ? 1 : 0;
  }
  for (const f of F) { const o = by.get(f.business_id); if (!o) continue;
    o.formation = { no: f.no, date: f.date || '', boi: f.boi, si: f.si, fee: n2(f.fee), f2553: f.f2553, permit: f.permit, dl: dec(f.dl_enc), boir: f.boir };
  }
  for (const l of L) { const o = by.get(l.business_id); if (!o) continue;
    (o.fees[l.year] ||= []).push({ id: l.id, svc: l.svc, m: Object.fromEntries(Object.entries(l.m || {}).map(([k, v]) => [k, Number(v)])), extra: Number(l.extra) || 0, xnote: l.xnote, flags: l.flags || [], hl: l.hl || {} });
  }
  for (const n of N) { const o = by.get(n.business_id); if (!o) continue;
    o.notes.push({ id: n.id, d: new Date(n.created_at).toLocaleDateString('en-CA', { timeZone: 'America/Los_Angeles' }), txt: n.body, by: n.created_by, amt: n2(n.fee_paid) || 0 });
  }
  return {
    biz,
    side: S1.map((x) => ({ id: x.id, year: x.year, name: x.name, key: x.name_key, amt: Number(x.amount), kind: x.kind, bid: x.business_id && by.has(x.business_id) ? x.business_id : null })),
    waived: W.map((w) => w.k),
    templates: TP.map((x) => ({ id: x.id, name: x.name, en: { s: x.en_s, b: x.en_b }, vn: { s: x.vn_s, b: x.vn_b } })),
    price: price?.value || [],
    encOk: hasKey(),
    today: todayLA(),
  };
}

// ---------- business ----------
function bizFields(body, cur = {}) {
  const f = {};
  const set = (k, v) => { if (k in body) f[k] = v; };
  set('name', nice(t(body.name, 160)));
  set('type', TYPES.includes(body.type) ? body.type : cur.type || '');
  for (const k of ['ein', 'sos', 'phone', 'email', 'owner']) set(k, t(body[k], 120));
  set('addr', t(body.addr, 300));
  set('status', STATUSES.includes(body.status) ? body.status : cur.status || 'Active');
  set('formed', dt(body.formed));
  if ('name' in f) { if (!f.name) throw new HttpError(400, 'Cần tên business'); f.name_key = nkey(f.name); }
  if ('ssn' in body) f.ssn_enc = enc(body.ssn);
  return f;
}
async function savePayroll(sql, bid, p) {
  if (!p || typeof p !== 'object') return;
  const [cur] = await sql`select * from pr_payroll where business_id=${bid}`;
  const v = {
    active: 'active' in p ? !!p.active : cur ? cur.active : true,
    period: 'period' in p ? (PERIODS.includes(p.period) ? p.period : '') : cur?.period || '',
    fee: 'fee' in p ? (p.fee === '' || p.fee === null ? null : num(p.fee, { min: 0, max: 1e6 })) : cur?.fee ?? null,
    fee_txt: 'fee_txt' in p ? t(p.fee_txt, 40) : cur?.fee_txt || '',
    eddno: 'eddno' in p ? t(p.eddno, 40) : cur?.eddno || '',
    pw_note: 'pw_note' in p ? t(p.pw_note, 120) : cur?.pw_note || '',
    note: 'note' in p ? t(p.note, 300) : cur?.note || '',
    irs: 'irs' in p ? !!p.irs : cur?.irs || false,
    edd: 'edd' in p ? !!p.edd : cur?.edd || false,
    pin_enc: 'pin' in p ? enc(p.pin) : cur?.pin_enc || null,
    pw_enc: 'pw' in p ? enc(p.pw) : cur?.pw_enc || null,
    routing_enc: 'routing' in p ? enc(p.routing) : cur?.routing_enc || null,
    account_enc: 'account' in p ? enc(p.account) : cur?.account_enc || null,
  };
  await sql`insert into pr_payroll ${sql({ business_id: bid, ...v })}
    on conflict (business_id) do update set active=excluded.active, period=excluded.period, fee=excluded.fee, fee_txt=excluded.fee_txt, eddno=excluded.eddno, pw_note=excluded.pw_note, note=excluded.note,
      irs=excluded.irs, edd=excluded.edd, pin_enc=excluded.pin_enc, pw_enc=excluded.pw_enc, routing_enc=excluded.routing_enc, account_enc=excluded.account_enc`;
}
async function saveFormation(sql, bid, f) {
  if (!f || typeof f !== 'object') return;
  const [cur] = await sql`select * from pr_formations where business_id=${bid}`;
  const v = {
    no: 'no' in f ? (f.no === '' || f.no == null ? null : Math.round(num(f.no, { min: 0, max: 1e6 }))) : cur?.no ?? null,
    date: 'date' in f ? dt(f.date) : cur?.date || null,
    boi: 'boi' in f ? !!f.boi : cur?.boi || false,
    si: 'si' in f ? !!f.si : cur?.si || false,
    fee: 'fee' in f ? (f.fee === '' || f.fee == null ? null : num(f.fee, { min: 0, max: 1e6 })) : cur?.fee ?? null,
    f2553: 'f2553' in f ? t(f.f2553, 60) : cur?.f2553 || '',
    permit: 'permit' in f ? !!f.permit : cur?.permit || false,
    boir: 'boir' in f ? t(f.boir, 60) : cur?.boir || '',
    dl_enc: 'dl' in f ? enc(f.dl) : cur?.dl_enc || null,
  };
  await sql`insert into pr_formations ${sql({ business_id: bid, ...v })}
    on conflict (business_id) do update set no=excluded.no, date=excluded.date, boi=excluded.boi, si=excluded.si, fee=excluded.fee, f2553=excluded.f2553, permit=excluded.permit, boir=excluded.boir, dl_enc=excluded.dl_enc`;
}
export async function createBiz(user, body) {
  const sql = db();
  const f = bizFields({ status: 'Active', ...body });
  if (!f.name) throw new HttpError(400, 'Cần tên business');
  const [b] = await sql`insert into pr_businesses ${sql(f)} returning id`;
  await savePayroll(sql, b.id, body.payroll);
  await saveFormation(sql, b.id, body.formation);
  if (body.link1099) await sql`update pr_1099 set business_id=${b.id} where name_key=${t(body.link1099, 160)}`;
  await audit(sql, user, 'create', 'biz', b.id, null, { name: f.name });
  return { id: b.id };
}
export async function updateBiz(user, id, body) {
  const sql = db();
  const [cur] = await sql`select * from pr_businesses where id=${id} and deleted_at is null`;
  if (!cur) throw new HttpError(404, 'Không thấy business');
  const f = bizFields(body, cur);
  if (Object.keys(f).length) await sql`update pr_businesses set ${sql(f)}, updated_at=now() where id=${id}`;
  await savePayroll(sql, id, body.payroll);
  await saveFormation(sql, id, body.formation);
  const pub = (o) => Object.fromEntries(Object.entries(o).filter(([k]) => !k.endsWith('_enc')));
  await audit(sql, user, 'update', 'biz', id, pub(cur), { ...pub(f), payroll: body.payroll ? Object.keys(body.payroll) : undefined, formation: body.formation ? Object.keys(body.formation) : undefined });
  return { ok: true };
}
export async function deleteBiz(user, id) {
  const sql = db();
  const [cur] = await sql`update pr_businesses set deleted_at=now() where id=${id} and deleted_at is null returning id, name`;
  if (!cur) throw new HttpError(404, 'Không thấy business');
  await sql`insert into pr_trash (kind, row, deleted_by) values ('biz', ${sql.json({ id, name: cur.name })}, ${user.display_name})`;
  await audit(sql, user, 'delete', 'biz', id, { name: cur.name }, null);
  return { ok: true };
}
export async function listTrash() {
  const rows = await db()`select * from pr_trash where deleted_at > now() - interval '100 days' order by deleted_at desc`;
  return rows.map((r) => ({ id: r.id, kind: r.kind, name: r.row?.name || '', by: r.deleted_by, at: r.deleted_at }));
}
export async function restoreTrash(user, id) {
  const sql = db();
  const [tr] = await sql`select * from pr_trash where id=${id}`; if (!tr) throw new HttpError(404, 'Not found');
  if (tr.kind === 'biz') await sql`update pr_businesses set deleted_at=null where id=${tr.row.id}`;
  if (tr.kind === 'note') await sql`insert into pr_notes ${sql({ business_id: tr.row.business_id, body: tr.row.body, fee_paid: tr.row.fee_paid, created_at: tr.row.created_at, created_by: tr.row.created_by })}`;
  await sql`delete from pr_trash where id=${id}`;
  await audit(sql, user, 'restore', tr.kind, id, null, tr.row);
  return { ok: true };
}

// ---------- payroll ticks / note ----------
export async function putTick(user, body) {
  const sql = db(); const bid = Number(body.bid), year = Number(body.year), slot = t(body.slot, 3);
  if (!Number.isInteger(bid) || !Number.isInteger(year) || !/^(m([1-9]|1[0-2])|q[1-4])$/.test(slot)) throw new HttpError(400, 'Bad tick');
  if (body.done === null) await sql`delete from pr_ticks where business_id=${bid} and year=${year} and slot=${slot}`;
  else await sql`insert into pr_ticks (business_id, year, slot, done, done_at, done_by) values (${bid}, ${year}, ${slot}, ${!!body.done}, now(), ${user.display_name})
    on conflict (business_id, year, slot) do update set done=excluded.done, done_at=now(), done_by=excluded.done_by`;
  return { ok: true };
}
export async function putPNote(user, body) {
  const bid = Number(body.bid); if (!Number.isInteger(bid)) throw new HttpError(400, 'Bad id');
  await savePayroll(db(), bid, { note: body.note });
  return { ok: true };
}

// ---------- fees ----------
export async function putFee(user, body) {
  const sql = db(); const id = Number(body.line_id); const m = String(body.month);
  if (!Number.isInteger(id) || !(m === 'x' || /^([1-9]|1[0-2])$/.test(m))) throw new HttpError(400, 'Bad cell');
  const [l] = await sql`select * from pr_fee_lines where id=${id}`; if (!l) throw new HttpError(404, 'Not found');
  const v = body.value === null || body.value === '' || body.value === undefined ? null : num(body.value, { min: -1e6, max: 1e6 });
  if (m === 'x') await sql`update pr_fee_lines set extra=${v || 0} where id=${id}`;
  else { const mm = { ...(l.m || {}) }; if (v === null) delete mm[m]; else mm[m] = v; await sql`update pr_fee_lines set m=${sql.json(mm)} where id=${id}`; }
  await audit(sql, user, 'fee', 'fee_line', id, { [m]: m === 'x' ? l.extra : (l.m || {})[m] ?? null }, { [m]: v });
  return { ok: true };
}
export async function putFeeHl(user, body) {
  const sql = db(); const color = body.color ? t(body.color, 10) : '';
  if (color && !/^#[0-9a-f]{6}$/i.test(color)) throw new HttpError(400, 'Bad color');
  const cells = Array.isArray(body.cells) ? body.cells.slice(0, 200) : [];
  const ids = [...new Set(cells.map((c) => Number(c[0])).filter(Number.isInteger))];
  for (const id of ids) {
    const [l] = await sql`select hl from pr_fee_lines where id=${id}`; if (!l) continue;
    const hl = { ...(l.hl || {}) };
    cells.filter((c) => Number(c[0]) === id).forEach((c) => { const m = String(c[1]); if (color) hl[m] = color; else delete hl[m]; });
    await sql`update pr_fee_lines set hl=${sql.json(hl)} where id=${id}`;
  }
  return { ok: true };
}
export async function addFeeLine(user, body) {
  const sql = db(); const bid = Number(body.bid), year = Number(body.year); const svc = SVCS.includes(body.svc) ? body.svc : 'Bookkeeping';
  if (!Number.isInteger(bid) || !Number.isInteger(year)) throw new HttpError(400, 'Bad request');
  const [l] = await sql`insert into pr_fee_lines (business_id, year, svc, sort) values (${bid}, ${year}, ${svc}, 99) returning id`;
  await audit(sql, user, 'add', 'fee_line', l.id, null, { bid, year, svc });
  return { id: l.id };
}

// ---------- 1099 ----------
export async function add1099(user, body) {
  const sql = db(); const name = nice(t(body.name, 160)); const year = Number(body.year); const amt = num(body.amt, { min: 0, max: 1e6 });
  if (!name || !Number.isInteger(year) || !amt) throw new HttpError(400, 'Nhập năm, tên và số tiền');
  const key = nkey(name);
  let bid = body.bid ? Number(body.bid) : null;
  if (!bid) { const [o] = await sql`select business_id from pr_1099 where name_key=${key} and business_id is not null limit 1`; bid = o?.business_id || null; }
  const [r] = await sql`insert into pr_1099 (year, name, name_key, amount, kind, business_id) values (${year}, ${name}, ${key}, ${amt}, '1099', ${bid}) returning id`;
  await audit(sql, user, 'add', '1099', r.id, null, { year, name, amt, bid });
  return { id: r.id, bid };
}
export async function link1099(user, body) {
  const sql = db(); const key = t(body.key, 160); let bid = Number(body.bid);
  if (!key) throw new HttpError(400, 'Bad request');
  if (!Number.isInteger(bid)) { const r = await createBiz(user, { ...(body.biz || {}) }); bid = r.id; }
  await sql`update pr_1099 set business_id=${bid} where name_key=${key}`;
  return { bid };
}

// ---------- notes / waivers ----------
export async function addNote(user, body) {
  const sql = db(); const bid = Number(body.bid); const txt = t(body.body, 2000);
  if (!Number.isInteger(bid) || !txt) throw new HttpError(400, 'Nhập note');
  const fee = body.fee === '' || body.fee == null ? null : num(body.fee, { min: 0, max: 1e6 }) || null;
  const [n] = await sql`insert into pr_notes (business_id, body, fee_paid, created_by) values (${bid}, ${txt}, ${fee}, ${user.display_name}) returning id`;
  return { id: n.id };
}
export async function delNote(user, id) {
  const sql = db(); const [n] = await sql`delete from pr_notes where id=${id} returning *`; if (!n) throw new HttpError(404, 'Not found');
  await sql`insert into pr_trash (kind, row, deleted_by) values ('note', ${sql.json({ ...n, name: n.body.slice(0, 60) })}, ${user.display_name})`;
  return { ok: true };
}
export async function putWaive(user, body) {
  const sql = db(); const keys = (Array.isArray(body.keys) ? body.keys : []).map((k) => t(k, 200)).filter(Boolean).slice(0, 500);
  if (body.on) { for (const k of keys) await sql`insert into pr_waivers (k, created_by) values (${k}, ${user.display_name}) on conflict (k) do nothing`; }
  else if (keys.length) await sql`delete from pr_waivers where k = any(${sql.array(keys)})`;
  await audit(sql, user, body.on ? 'waive' : 'unwaive', 'waiver', null, null, { keys });
  return { ok: true };
}

// ---------- templates ----------
export async function putTemplates(user, body) {
  const sql = db(); const L = (Array.isArray(body.list) ? body.list : []).slice(0, 30);
  await sql.begin(async (tx) => {
    await tx`delete from pr_email_templates`;
    let i = 0;
    for (const x of L) { i++; await tx`insert into pr_email_templates (name, en_s, en_b, vn_s, vn_b, sort) values (${t(x.name, 120) || 'Template'}, ${t(x.en?.s, 300)}, ${t(x.en?.b, 5000)}, ${t(x.vn?.s, 300)}, ${t(x.vn?.b, 5000)}, ${i})`; }
  });
  return { ok: true };
}

// ---------- import from the Google Sheet (xlsx) ----------
export async function importXlsx(user, body) {
  const b64 = String(body.file || ''); if (!b64) throw new HttpError(400, 'Chọn file .xlsx');
  const buf = Buffer.from(b64.replace(/^data:[^,]+,/, ''), 'base64');
  if (buf.length > 8 * 1024 * 1024) throw new HttpError(400, 'File quá lớn (tối đa 8 MB)');
  let r; try { r = await parseWorkbook(buf); } catch (e) { throw new HttpError(400, 'Không đọc được file: ' + e.message); }
  if (!body.save) return { stats: r.stats, merges: r.merges };
  if (!hasKey()) throw new HttpError(500, 'Chưa đặt PR_ENC_KEY trên Netlify - đặt trước khi import (để mã hoá SSN / PIN / PW / bank)');
  const skip = new Set((Array.isArray(body.skip) ? body.skip : []).map(Number)); // merges admin un-ticked: keep the payroll record only
  const sql = db(); const year = Number(todayLA().slice(0, 4));
  const [{ n }] = await sql`select count(*)::int as n from pr_businesses where deleted_at is null`;
  if (n && !body.replace) throw new HttpError(400, `Đã có ${n} business. Tick "Thay toàn bộ" để import lại.`);
  await sql.begin(async (tx) => {
    if (n) { await tx`delete from pr_1099`; await tx`delete from pr_waivers`; await tx`delete from pr_businesses`; }
    const idMap = new Map();
    for (const b of r.biz) {
      const links = skip.has(b.id) ? b.links.slice(0, 1) : b.links;
      const [x] = await tx`insert into pr_businesses ${tx({ name: b.name, name_key: nkey(b.name), type: b.type || '', ein: b.ein || '', sos: b.sos || '', addr: b.addr || '', phone: b.phone || '', email: b.email || '', owner: b.owner || '',
        ssn_enc: enc(b.ssn), formed: b.formed || null, si_due: b.si_due || null, status: b.status || 'Active', links: tx.json(links) })} returning id`;
      idMap.set(b.id, x.id);
      if (b.payroll) {
        const p = b.payroll;
        await tx`insert into pr_payroll ${tx({ business_id: x.id, active: p.active, period: p.period || '', fee: p.fee, fee_txt: p.fee_txt || '', start_txt: p.start || '', irs: !!p.irs, edd: !!p.edd, eddno: p.eddno || '',
          pin_enc: enc(p.pin), pw_enc: enc(p.pw), pw_note: p.pw_note || '', routing_enc: enc(p.routing), account_enc: enc(p.account), note: '' })}`;
        const ticks = [];
        p.months.forEach((v, i) => { if (v !== null) ticks.push({ business_id: x.id, year, slot: 'm' + (i + 1), done: v === 1 }); });
        p.qs.forEach((v, i) => { if (v !== null) ticks.push({ business_id: x.id, year, slot: 'q' + (i + 1), done: v === 1 }); });
        if (ticks.length) await tx`insert into pr_ticks ${tx(ticks)}`;
      }
      if (b.formation) { const f = b.formation;
        await tx`insert into pr_formations ${tx({ business_id: x.id, no: f.no || null, date: f.date || null, boi: !!f.boi, si: !!f.si, fee: f.fee, f2553: f.f2553 || '', permit: !!f.permit, dl_enc: enc(f.dl), boir: f.boir || '' })}`; }
      const lines = []; Object.entries(b.fees).forEach(([y, L]) => L.forEach((l, i) => lines.push({ business_id: x.id, year: Number(y), svc: l.svc, m: tx.json(l.m), extra: l.extra || 0, xnote: l.xnote || '', flags: tx.json(l.flags || []), hl: tx.json({}), sort: i })));
      if (lines.length) await tx`insert into pr_fee_lines ${tx(lines)}`;
    }
    const side = r.side.map((o) => ({ year: o.year, name: o.name, name_key: o.key, amount: o.amt, kind: o.kind === 'Annual' ? 'Annual' : '1099', business_id: o.bid ? idMap.get(o.bid) : null }));
    if (side.length) await tx`insert into pr_1099 ${tx(side)}`;
  });
  await audit(sql, user, 'import', 'xlsx', null, null, r.stats);
  return { stats: r.stats, saved: true, autoWaive: true };
}
