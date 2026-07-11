import { useCallback, useEffect, useState } from 'react';
import { listSince, addSince, logSince, type SinceItem, type NewSinceItem } from '../lib/since';

export function useSince(userId: string | undefined) {
  const [items, setItems] = useState<SinceItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    try {
      setError(null);
      setItems(await listSince());
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (userId) refresh();
  }, [userId, refresh]);

  const add = useCallback(
    async (f: NewSinceItem) => {
      await addSince(f);
      refresh();
    },
    [refresh],
  );

  const log = useCallback(
    async (id: string) => {
      // optimistic reset to 0
      setItems((prev) =>
        prev.map((i) => (i.id === id ? { ...i, days_since: 0, last_logged_at: new Date().toISOString() } : i)),
      );
      await logSince(id);
      refresh();
    },
    [refresh],
  );

  return { items, loading, error, refresh, add, log };
}
