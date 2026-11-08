// v17: every 10 minutes - send appointment reminders that are due + texts waiting in the queue
// (texts made at night wait until the morning). Outside Jan–Apr (LA time) it returns at once without touching the database.
import { db } from '../lib/core.mjs';
import { runQueue, laNow } from '../lib/sms.mjs';

export default async function () {
  const m = Number(laNow().date.slice(5, 7));
  if (m > 4) return new Response('off season');
  const sql = db();
  const rows = await sql`select key, value from settings where key='sms'`;
  const settings = {}; rows.forEach((r) => { settings[r.key] = r.value; });
  const out = await runQueue(sql, settings);
  return new Response(JSON.stringify(out));
}

export const config = { schedule: '*/10 * * * *' };
