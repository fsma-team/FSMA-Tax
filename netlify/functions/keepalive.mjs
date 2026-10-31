// Runs once a day so a Free Supabase project is never paused for inactivity.
// (Harmless on Supabase Pro.) Also cleans expired sessions.
import { db } from '../lib/core.mjs';

export default async function () {
  await db()`delete from sessions where expires_at < now() or last_seen < now() - interval '1 day'`;
  return new Response('ok');
}

export const config = { schedule: '23 13 * * *' };
