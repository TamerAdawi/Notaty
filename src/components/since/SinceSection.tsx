import { useState } from 'react';
import type { SinceItem, NewSinceItem } from '../../lib/since';
import { SinceCard } from './SinceCard';
import { AddSinceModal } from './AddSinceModal';
import { SinceDetail } from './SinceDetail';

interface Since {
  items: SinceItem[];
  loading: boolean;
  error: string | null;
  refresh: () => void;
  add: (f: NewSinceItem) => Promise<void>;
  log: (id: string) => void;
}

export function SinceSection({ since }: { since: Since }) {
  const [showAdd, setShowAdd] = useState(false);
  const [detailId, setDetailId] = useState<string | null>(null);
  const detailItem = since.items.find((i) => i.id === detailId) ?? null;

  return (
    <>
      <main className="flex-1 px-4 pb-28 space-y-2.5">
        {since.error && <div className="rounded-xl bg-danger/15 text-danger text-sm p-3">{since.error}</div>}
        {since.loading ? (
          <div className="text-muted text-sm text-center py-16">Loading…</div>
        ) : since.items.length === 0 ? (
          <div className="flex flex-col items-center justify-center text-center px-8 py-20 animate-fade-up">
            <div className="text-5xl mb-3">🔄</div>
            <h3 className="font-display text-lg font-semibold text-ink">Nothing tracked yet</h3>
            <p className="text-muted text-sm mt-1">Tap ＋ to track something you do on a cycle — haircut, oil change, calling family…</p>
          </div>
        ) : (
          since.items.map((item) => (
            <SinceCard key={item.id} item={item} onLog={since.log} onOpen={setDetailId} />
          ))
        )}
      </main>

      <button
        onClick={() => setShowAdd(true)}
        aria-label="Track something"
        className="press fixed bottom-6 right-1/2 translate-x-[210px] max-[480px]:right-5 max-[480px]:translate-x-0 z-30 h-14 w-14 rounded-full bg-accent text-onAccent text-2xl grid place-items-center shadow-glow"
      >
        ＋
      </button>

      {showAdd && <AddSinceModal onAdd={since.add} onClose={() => setShowAdd(false)} />}
      {detailItem && (
        <SinceDetail item={detailItem} onClose={() => setDetailId(null)} onChanged={since.refresh} />
      )}
    </>
  );
}
