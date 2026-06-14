// Notaty scheduler target. A cron service pings this periodically.
//   ?job=reminders  → push due reminders/events/tasks (default)
//   ?job=digest     → weekly summary of unwatched reels + stale notes
// Protected by ?secret=<CRON_SECRET>.
import { createClient } from '@supabase/supabase-js';
import webpush from 'web-push';

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const VAPID_PUBLIC = process.env.VAPID_PUBLIC_KEY || process.env.VITE_VAPID_PUBLIC_KEY;
const VAPID_PRIVATE = process.env.VAPID_PRIVATE_KEY;
const VAPID_SUBJECT = process.env.VAPID_SUBJECT || 'mailto:notaty@example.com';
const CRON_SECRET = process.env.CRON_SECRET;

const STALE_DAYS = 21;

async function pushToUser(sb, userId, payloadObj) {
  const { data: subs } = await sb.from('push_subscriptions').select('*').eq('user_id', userId);
  if (!subs || subs.length === 0) return 0;
  const payload = JSON.stringify(payloadObj);
  let sent = 0;
  const dead = [];
  for (const s of subs) {
    try {
      await webpush.sendNotification(
        { endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } },
        payload,
      );
      sent++;
    } catch (e) {
      if (e.statusCode === 404 || e.statusCode === 410) dead.push(s.endpoint);
    }
  }
  if (dead.length) await sb.from('push_subscriptions').delete().in('endpoint', dead);
  return sent;
}

export default async function handler(req, res) {
  if (!SUPABASE_URL || !SERVICE_KEY || !VAPID_PRIVATE) {
    return res.status(500).json({ error: 'Server not configured' });
  }
  const secret = req.query?.secret || req.headers['x-cron-secret'];
  if (!CRON_SECRET || secret !== CRON_SECRET) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  webpush.setVapidDetails(VAPID_SUBJECT, VAPID_PUBLIC, VAPID_PRIVATE);
  const sb = createClient(SUPABASE_URL, SERVICE_KEY, { auth: { persistSession: false } });
  const job = req.query?.job || 'reminders';

  /* -------------------------- weekly digest ------------------------- */
  if (job === 'digest') {
    const since = new Date(Date.now() - STALE_DAYS * 86_400_000).toISOString();
    const { data: rows } = await sb
      .from('notes')
      .select('user_id,type,updated_at')
      .eq('done', false);
    const byUser = {};
    for (const n of rows || []) {
      const u = (byUser[n.user_id] = byUser[n.user_id] || { reels: 0, stale: 0 });
      if (n.type === 'reel') u.reels++;
      else if (n.updated_at <= since) u.stale++;
    }
    let sent = 0;
    for (const [uid, c] of Object.entries(byUser)) {
      if (c.reels === 0 && c.stale === 0) continue;
      const parts = [];
      if (c.reels) parts.push(`${c.reels} saved reel${c.reels > 1 ? 's' : ''} to watch`);
      if (c.stale) parts.push(`${c.stale} note${c.stale > 1 ? 's' : ''} to review`);
      sent += await pushToUser(sb, uid, {
        title: '🗒️ Your weekly Notaty digest',
        body: parts.join(' · '),
        url: '/',
      });
    }
    return res.status(200).json({ ok: true, job, sent });
  }

  /* ---------------------------- reminders --------------------------- */
  const now = new Date().toISOString();
  const { data: due } = await sb
    .from('notes')
    .select('id,user_id,content,type,due_date')
    .lte('due_date', now)
    .eq('done', false)
    .is('reminded_at', null)
    .not('due_date', 'is', null)
    .in('type', ['reminder', 'event', 'task']);

  let sent = 0;
  for (const n of due || []) {
    const icon = n.type === 'reminder' ? '⏰' : n.type === 'event' ? '📅' : '✅';
    const label = n.type[0].toUpperCase() + n.type.slice(1);
    sent += await pushToUser(sb, n.user_id, {
      title: `${icon} ${label} due`,
      body: (n.content || '').slice(0, 120),
      url: '/',
    });
    await sb.from('notes').update({ reminded_at: now }).eq('id', n.id);
  }
  return res.status(200).json({ ok: true, job: 'reminders', count: (due || []).length, sent });
}
