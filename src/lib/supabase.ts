// Supabase client. Reads creds from Vite env (set in .env.local / Vercel).
// If the keys are missing, the app falls back to on-device localStorage demo mode.
import { createClient, type SupabaseClient } from '@supabase/supabase-js';

const url = import.meta.env.VITE_SUPABASE_URL;
const anon = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const isCloud = Boolean(url && anon);

export const supabase: SupabaseClient | null = isCloud
  ? createClient(url as string, anon as string)
  : null;
