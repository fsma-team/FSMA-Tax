// v20: every day ~6:10am LA - pull news for feeds that are due (tax every 3 days, payroll every Monday / 7 days).
import { runDue } from '../lib/news.mjs';
import { pullAll } from '../lib/horo.mjs'; // v21.5: Quick reading

export default async function () {
  try {
    const out = await runDue(false);
    try { out.horoscope = await pullAll(); } catch (e) { console.error('horoscope', e); }
    return new Response(JSON.stringify(out));
  } catch (e) {
    console.error('news-cron', e);
    return new Response('error', { status: 500 });
  }
}

export const config = { schedule: '10 14 * * *' };
