// Sends a test push to the signed-in user's devices. Identified by the same
// per-user save token (kept simple for a personal app).
import { createClient } from '@supabase/supabase-js';
import webpush from 'web-push';

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const VAPID_PUBLIC = process.env.VAPID_PUBLIC_KEY || process.env.VITE_VAPID_PUBLIC_KEY;
const VAPID_PRIVATE = process.env.VAPID_PRIVATE_KEY;
const VAPID_SUBJECT = process.env.VAPID_SUBJECT || 'mailto:notaty@example.com';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'POST only' });

  if (!SUPABASE_URL || !SERVICE_KEY || !VAPID_PUBLIC || !VAPID_PRIVATE) {
    return res.status(500).json({ error: 'Server not configured (missing Supabase/VAPID env vars)' });
  }
  webpush.setVapidDetails(VAPID_SUBJECT, VAPID_PUBLIC, VAPID_PRIVATE);

  let body = req.body;
  if (typeof body === 'string') {
    try { body = JSON.parse(body); } catch { body = {}; }
  }
  const token = ((body && body.token) || req.query?.token || '').toString().trim();
  if (!token) return res.status(400).json({ error: 'Missing token' });

  const sb = createClient(SUPABASE_URL, SERVICE_KEY, { auth: { persistSession: false } });
  const { data: tok } = await sb.from('save_tokens').select('user_id').eq('token', token).single();
  if (!tok) return res.status(401).json({ error: 'Invalid token' });

  const { data: subs } = await sb
    .from('push_subscriptions')
    .select('*')
    .eq('user_id', tok.user_id);
  if (!subs || subs.length === 0) {
    return res.status(404).json({ error: 'No devices subscribed. Tap "Enable notifications" first.' });
  }

  const payload = JSON.stringify({
    title: 'Notaty 🔔',
    body: 'Test notification — your reminders will arrive like this!',
    url: '/',
  });

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

  return res.status(200).json({ ok: true, sent });
}
