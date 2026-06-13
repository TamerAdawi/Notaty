import { useCallback, useEffect, useState } from 'react';
import {
  listNotes,
  addNote as dbAdd,
  updateNote as dbUpdate,
  deleteNote as dbDelete,
  type Note,
} from '../lib/db';
import { parseNote } from '../lib/parser';

export function useNotes(userId: string | undefined) {
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    try {
      setError(null);
      const data = await listNotes();
      setNotes(data);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (userId) refresh();
  }, [userId, refresh]);

  /** Parse raw text and persist; optimistic insert at the top. */
  const add = useCallback(async (raw: string, override?: Partial<Note>) => {
    const parsed = { ...parseNote(raw), ...override };
    const created = await dbAdd(parsed);
    setNotes((prev) => [created, ...prev]);
    return created;
  }, []);

  const update = useCallback(async (id: string, patch: Partial<Note>) => {
    setNotes((prev) => prev.map((n) => (n.id === id ? { ...n, ...patch } : n)));
    await dbUpdate(id, patch);
  }, []);

  const remove = useCallback(async (id: string) => {
    setNotes((prev) => prev.filter((n) => n.id !== id));
    await dbDelete(id);
  }, []);

  const toggleDone = useCallback(
    (n: Note) => update(n.id, { done: !n.done }),
    [update],
  );

  const togglePin = useCallback(
    (n: Note) => update(n.id, { pinned: !n.pinned }),
    [update],
  );

  return { notes, loading, error, refresh, add, update, remove, toggleDone, togglePin };
}
