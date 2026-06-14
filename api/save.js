// Notaty — "Save to Notaty" ingest endpoint (Vercel serverless function).
// An Apple Shortcut on the iOS share sheet POSTs { token, url } here.
// We validate the token (→ user_id) with the service-role key, then insert a
// reel/saved-link note for that user. The service-role key bypasses RLS, so it
// MUST stay server-side only (set as a Vercel env var, never in the client).

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

const PLATFORMS = [
  ['instagram', /instagram\.com|instagr\.am/i],
  ['tiktok', /tiktok\.com|vm\.tiktok\.com/i],
  ['facebook', /facebook\.com|fb\.watch|fb\.com|m\.facebook/i],
  ['youtube', /youtube\.com|youtu\.be/i],
];

function detectPlatform(url) {
  for (const [id, re] of PLATFORMS) if (re.test(url)) return id;
  return 'link';
}

export default async function handler(req, res) {
  // Allow calls from anywhere (Shortcuts aren't browsers, but this also lets
  // a quick browser test work).
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'POST only' });

  if (!SUPABASE_URL || !SERVICE_KEY) {
    return res.status(500).json({ error: 'Server not configured (missing Supabase env vars)' });
  }

  let body = req.body;
  if (typeof body === 'string') {
    try { body = JSON.parse(body); } catch { /* leave as raw string */ }
  }
  const field = (k) => (body && typeof body === 'object' ? body[k] : undefined);

  // Token may arrive in the JSON body, the ?token= query param, or an x-notaty-token header.
  const token = (field('token') || req.query?.token || req.headers['x-notaty-token'] || '')
    .toString()
    .trim();

  // The shared link may arrive as body.url / body.text, the raw text body, or ?url=.
  const rawStr = (
    field('url') ||
    field('text') ||
    (typeof body === 'string' ? body : '') ||
    req.query?.url ||
    ''
  ).toString();
  const urlMatch = rawStr.match(/https?:\/\/[^\s]+/);

  if (!token) return res.status(400).json({ error: 'Missing token' });
  if (!urlMatch) return res.status(400).json({ error: 'No URL found in the shared content' });
  const url = urlMatch[0];

  const sb = createClient(SUPABASE_URL, SERVICE_KEY, { auth: { persistSession: false } });

  const { data: tok, error: tErr } = await sb
    .from('save_tokens')
    .select('user_id')
    .eq('token', token)
    .single();
  if (tErr || !tok) return res.status(401).json({ error: 'Invalid token' });

  const platform = detectPlatform(url);
  const { error: iErr } = await sb.from('notes').insert({
    user_id: tok.user_id,
    content: url,
    type: 'reel',
    category: 'Inbox',
    priority: 'normal',
    tags: [],
    meta: { url, platform },
  });
  if (iErr) return res.status(500).json({ error: iErr.message });

  return res.status(200).json({ ok: true, platform });
}
