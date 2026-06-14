// Notaty data layer. One API for the app; hides whether we talk to Supabase
// (cloud, synced, multi-device) or localStorage (offline demo before keys are set).
import { supabase, isCloud } from './supabase';
import type { NoteType, Priority, NoteMeta, ParsedNote } from './parser';

export interface Note {
  id: string;
  user_id?: string;
  content: string;
  type: NoteType;
  category: string;
  due_date: string | null;
  priority: Priority;
  tags: string[];
  meta: NoteMeta;
  done: boolean;
  pinned: boolean;
  created_at: string;
  updated_at: string;
}

export interface AppUser {
  id: string;
  email: string;
}

export { isCloud };

/* ------------------------------ auth ------------------------------ */

export async function getUser(): Promise<AppUser | null> {
  if (!isCloud) return { id: 'local', email: 'demo (offline)' };
  const { data } = await supabase!.auth.getUser();
  return data.user ? { id: data.user.id, email: data.user.email ?? '' } : null;
}

export async function signUp(email: string, password: string) {
  const { data, error } = await supabase!.auth.signUp({ email, password });
  if (error) throw error;
  return data;
}

export async function signIn(email: string, password: string) {
  const { data, error } = await supabase!.auth.signInWithPassword({ email, password });
  if (error) throw error;
  return data;
}

export async function signOut() {
  if (!isCloud) return;
  await supabase!.auth.signOut();
}

export function onAuthChange(cb: (user: AppUser | null) => void): () => void {
  if (!isCloud) {
    cb({ id: 'local', email: 'demo (offline)' });
    return () => {};
  }
  supabase!.auth.getUser().then(({ data }) => {
    cb(data.user ? { id: data.user.id, email: data.user.email ?? '' } : null);
  });
  const { data: sub } = supabase!.auth.onAuthStateChange((_e, session) => {
    cb(session?.user ? { id: session.user.id, email: session.user.email ?? '' } : null);
  });
  return () => sub.subscription.unsubscribe();
}

/* ------------------------------ notes ----------------------------- */

const LS_KEY = 'notaty.notes.v1';

function lsRead(): Note[] {
  try {
    return JSON.parse(localStorage.getItem(LS_KEY) || '[]') as Note[];
  } catch {
    return [];
  }
}
function lsWrite(notes: Note[]) {
  localStorage.setItem(LS_KEY, JSON.stringify(notes));
}

export async function listNotes(): Promise<Note[]> {
  if (!isCloud) {
    return lsRead().sort(
      (a, b) => +new Date(b.created_at) - +new Date(a.created_at),
    );
  }
  const { data, error } = await supabase!
    .from('notes')
    .select('*')
    .order('pinned', { ascending: false })
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data as Note[];
}

export async function addNote(parsed: ParsedNote): Promise<Note> {
  if (!isCloud) {
    const now = new Date().toISOString();
    const row: Note = {
      ...parsed,
      id: crypto.randomUUID(),
      done: false,
      pinned: false,
      created_at: now,
      updated_at: now,
    };
    const notes = lsRead();
    notes.unshift(row);
    lsWrite(notes);
    return row;
  }
  const { data: u } = await supabase!.auth.getUser();
  const { data, error } = await supabase!
    .from('notes')
    .insert({ ...parsed, user_id: u.user!.id })
    .select()
    .single();
  if (error) throw error;
  return data as Note;
}

export async function updateNote(id: string, patch: Partial<Note>): Promise<Note | null> {
  if (!isCloud) {
    const notes = lsRead();
    const i = notes.findIndex((n) => n.id === id);
    if (i < 0) return null;
    notes[i] = { ...notes[i], ...patch, updated_at: new Date().toISOString() };
    lsWrite(notes);
    return notes[i];
  }
  const { data, error } = await supabase!
    .from('notes')
    .update({ ...patch, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  return data as Note;
}

/* --------------------- push subscriptions ------------------------- */

export async function savePushSubscription(sub: {
  endpoint: string;
  p256dh: string;
  auth: string;
}): Promise<void> {
  if (!isCloud) throw new Error('Sign in on the live app to enable notifications.');
  const { data: u } = await supabase!.auth.getUser();
  if (!u.user) throw new Error('Not signed in');
  const { error } = await supabase!
    .from('push_subscriptions')
    .upsert({ user_id: u.user.id, ...sub }, { onConflict: 'endpoint' });
  if (error) throw error;
}

/* ----------------------- save token (share) ----------------------- */

// Fetch (or lazily create) the current user's secret token used by the
// "Save to Notaty" Apple Shortcut. Cloud-only.
export async function getSaveToken(): Promise<string | null> {
  if (!isCloud) return null;
  const { data: u } = await supabase!.auth.getUser();
  if (!u.user) return null;

  const existing = await supabase!
    .from('save_tokens')
    .select('token')
    .eq('user_id', u.user.id)
    .maybeSingle();
  if (existing.data?.token) return existing.data.token as string;

  const created = await supabase!
    .from('save_tokens')
    .insert({ user_id: u.user.id })
    .select('token')
    .single();
  if (created.error) throw created.error;
  return created.data.token as string;
}

export async function deleteNote(id: string): Promise<void> {
  if (!isCloud) {
    lsWrite(lsRead().filter((n) => n.id !== id));
    return;
  }
  const { error } = await supabase!.from('notes').delete().eq('id', id);
  if (error) throw error;
}
