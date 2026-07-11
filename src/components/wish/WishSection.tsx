import { useMemo, useState } from 'react';
import type { Note } from '../../lib/db';
import { WishCard } from './WishCard';
import { AddWishModal, type WishFields } from './AddWishModal';

export function WishSection({
  items,
  loading,
  onAdd,
  onToggleBought,
  onDelete,
}: {
  items: Note[];
  loading: boolean;
  onAdd: (f: WishFields) => Promise<void>;
  onToggleBought: (n: Note) => void;
  onDelete: (id: string) => void;
}) {
  const [showAdd, setShowAdd] = useState(false);

  const sorted = useMemo(
    () => [...items].sort((a, b) => Number(a.done) - Number(b.done)),
    [items],
  );

  const { total, currency } = useMemo(() => {
    const open = items.filter((n) => !n.done && typeof n.meta.price === 'number');
    const sum = open.reduce((s, n) => s + (n.meta.price ?? 0), 0);
    return { total: sum, currency: open.find((n) => n.meta.currency)?.meta.currency ?? '' };
  }, [items]);

  return (
    <>
      {items.length > 0 && (
        <div className="px-4 pt-1">
          <div className="rounded-xl bg-surface border border-hairline px-4 py-2.5 text-sm flex items-center">
            <span className="text-muted">Still want to buy</span>
            <span className="ml-auto font-semibold text-ink tabular-nums">
              {total.toLocaleString()} {currency}
            </span>
          </div>
        </div>
      )}

      <main className="flex-1 px-4 pt-2 pb-28 space-y-2.5">
        {loading ? (
          <div className="text-muted text-sm text-center py-16">Loading…</div>
        ) : items.length === 0 ? (
          <div className="flex flex-col items-center justify-center text-center px-8 py-20 animate-fade-up">
            <div className="text-5xl mb-3">🛍️</div>
            <h3 className="font-display text-lg font-semibold text-ink">Your wish list is empty</h3>
            <p className="text-muted text-sm mt-1">Tap ＋ to add something you want to buy and its price.</p>
          </div>
        ) : (
          sorted.map((item) => (
            <WishCard key={item.id} item={item} onToggleBought={onToggleBought} onDelete={onDelete} />
          ))
        )}
      </main>

      <button
        onClick={() => setShowAdd(true)}
        aria-label="Add wish"
        className="press fixed bottom-6 right-1/2 translate-x-[210px] max-[480px]:right-5 max-[480px]:translate-x-0 z-30 h-14 w-14 rounded-full bg-accent text-onAccent text-2xl grid place-items-center shadow-glow"
      >
        ＋
      </button>

      {showAdd && <AddWishModal onAdd={onAdd} onClose={() => setShowAdd(false)} />}
    </>
  );
}
