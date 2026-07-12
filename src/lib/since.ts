// "Since when" — recurring-cycle tracker (merged from the Dawra app).
// Each item tracks how many days since you last logged it, with an interval +
// grace period; overdue items get a push (via the shared cron). Cloud-only.
import { supabase } from './supabase';
import { usingLocal } from './session';

export interface SinceItem {
  id: string;
  user_id?: string;
  name: string;
  emoji: string | null;
  interval_days: number;
  reminder_offset_days: number;
  last_reminded_on: string | null;
  created_at: string;
  last_logged_at: string;
  days_since: number;
}

export interface SinceHistory {
  id: string;
  item_id: string;
  logged_at: string;
  notes: string | null;
  created_at: string;
}

export type StatusLevel = 'ok' | 'due' | 'overdue';

export function statusLevel(
  i: Pick<SinceItem, 'days_since' | 'interval_days' | 'reminder_offset_days'>,
): StatusLevel {
  const dueAt = i.interval_days + i.reminder_offset_days;
  if (i.days_since <= i.interval_days) return 'ok';
  if (i.days_since <= dueAt) return 'due';
  return 'overdue';
}

export function daysSinceLabel(days: number): string {
  if (days === 0) return 'today';
  if (days === 1) return '1 day';
  return `${days} days`;
}

async function uid(): Promise<string> {
  const { data } = await supabase!.auth.getUser();
  if (!data.user) throw new Error('Not signed in');
  return data.user.id;
}

/* ------------ localStorage fallback (demo / guest mode) ------------ */
const LS_ITEMS = 'notaty.since.items.v1';
const LS_HIST = 'notaty.since.history.v1';
type RawItem = Omit<SinceItem, 'last_logged_at' | 'days_since'>;
const lsItems = (): RawItem[] => JSON.parse(localStorage.getItem(LS_ITEMS) || '[]');
const lsHist = (): SinceHistory[] => JSON.parse(localStorage.getItem(LS_HIST) || '[]');
const setItems = (v: RawItem[]) => localStorage.setItem(LS_ITEMS, JSON.stringify(v));
const setHist = (v: SinceHistory[]) => localStorage.setItem(LS_HIST, JSON.stringify(v));

function lsStatus(): SinceItem[] {
  const hist = lsHist();
  return lsItems()
    .map((i) => {
      const logs = hist.filter((h) => h.item_id === i.id).map((h) => +new Date(h.logged_at));
      const lastMs = logs.length ? Math.max(...logs) : +new Date(i.created_at);
      const days_since = Math.max(0, Math.floor((Date.now() - lastMs) / 86_400_000));
      return { ...i, last_logged_at: new Date(lastMs).toISOString(), days_since };
    })
    .sort((a, b) => b.days_since - a.days_since);
}

export async function listSince(): Promise<SinceItem[]> {
  if (usingLocal()) return lsStatus();
  const { data, error } = await supabase!
    .from('since_items_status')
    .select('*')
    .order('days_since', { ascending: false });
  if (error) throw error;
  return data as SinceItem[];
}

export interface NewSinceItem {
  name: string;
  emoji: string | null;
  interval_days: number;
  reminder_offset_days: number;
}

export async function addSince(f: NewSinceItem): Promise<void> {
  if (usingLocal()) {
    setItems([
      ...lsItems(),
      { id: crypto.randomUUID(), ...f, last_reminded_on: null, created_at: new Date().toISOString() },
    ]);
    return;
  }
  const { error } = await supabase!.from('since_items').insert({ ...f, user_id: await uid() });
  if (error) throw error;
}

export async function logSince(itemId: string, notes?: string): Promise<void> {
  if (usingLocal()) {
    setHist([
      ...lsHist(),
      {
        id: crypto.randomUUID(),
        item_id: itemId,
        logged_at: new Date().toISOString(),
        notes: notes?.trim() || null,
        created_at: new Date().toISOString(),
      },
    ]);
    return;
  }
  const { error } = await supabase!
    .from('since_history')
    .insert({ item_id: itemId, user_id: await uid(), notes: notes?.trim() || null });
  if (error) throw error;
}

export async function updateSince(itemId: string, patch: Partial<NewSinceItem>): Promise<void> {
  if (usingLocal()) {
    setItems(lsItems().map((i) => (i.id === itemId ? { ...i, ...patch } : i)));
    return;
  }
  const { error } = await supabase!.from('since_items').update(patch).eq('id', itemId);
  if (error) throw error;
}

export async function deleteSince(itemId: string): Promise<void> {
  if (usingLocal()) {
    setItems(lsItems().filter((i) => i.id !== itemId));
    setHist(lsHist().filter((h) => h.item_id !== itemId));
    return;
  }
  const { error } = await supabase!.from('since_items').delete().eq('id', itemId);
  if (error) throw error;
}

export async function listHistory(itemId: string): Promise<SinceHistory[]> {
  if (usingLocal()) {
    return lsHist()
      .filter((h) => h.item_id === itemId)
      .sort((a, b) => +new Date(b.logged_at) - +new Date(a.logged_at));
  }
  const { data, error } = await supabase!
    .from('since_history')
    .select('id, item_id, logged_at, notes, created_at')
    .eq('item_id', itemId)
    .order('logged_at', { ascending: false });
  if (error) throw error;
  return data as SinceHistory[];
}

export async function updateHistoryNote(entryId: string, notes: string): Promise<void> {
  if (usingLocal()) {
    setHist(lsHist().map((h) => (h.id === entryId ? { ...h, notes: notes.trim() || null } : h)));
    return;
  }
  const { error } = await supabase!
    .from('since_history')
    .update({ notes: notes.trim() || null })
    .eq('id', entryId);
  if (error) throw error;
}

export async function deleteHistoryEntry(entryId: string): Promise<void> {
  if (usingLocal()) {
    setHist(lsHist().filter((h) => h.id !== entryId));
    return;
  }
  const { error } = await supabase!.from('since_history').delete().eq('id', entryId);
  if (error) throw error;
}
