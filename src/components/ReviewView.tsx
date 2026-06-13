import type { Note } from '../lib/db';
import { TYPE_META, CATEGORY_META } from '../lib/parser';
import { ageLabel } from '../lib/format';

interface Props {
  items: Note[];
  onKeep: (id: string) => void;
  onToday: (id: string) => void;
  onDrop: (id: string) => void;
}

export default function ReviewView({ items, onKeep, onToday, onDrop }: Props) {
  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center text-center px-8 py-20 animate-fade-up">
        <div className="text-5xl mb-3">🎉</div>
        <h3 className="font-display text-lg font-semibold text-ink">All caught up</h3>
        <p className="text-muted text-sm mt-1">Nothing's been sitting untouched. Nice.</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <p className="text-muted text-sm px-1">
        {items.length} item{items.length > 1 ? 's' : ''} you haven't touched in a while. Keep it,
        do it today, or let it go.
      </p>

      {items.map((n) => (
        <div
          key={n.id}
          className="rounded-2xl border border-hairline bg-elevated p-3.5 shadow-card animate-fade-up"
        >
          <div className="flex items-center gap-2 text-xs text-muted mb-1.5">
            <span>
              {TYPE_META[n.type].icon} {TYPE_META[n.type].label}
            </span>
            <span>· {CATEGORY_META[n.category] ?? '📥'} {n.category}</span>
            <span className="ml-auto rounded-full bg-surface px-2 py-0.5">⏳ {ageLabel(n.updated_at)}</span>
          </div>

          <p className="text-[15px] leading-snug text-ink break-words mb-3">{n.content}</p>

          <div className="grid grid-cols-3 gap-2">
            <button
              onClick={() => onKeep(n.id)}
              className="press rounded-xl border border-hairline py-2 text-sm text-ink"
            >
              ✅ Keep
            </button>
            <button
              onClick={() => onToday(n.id)}
              className="press rounded-xl border border-accent bg-accent/15 py-2 text-sm text-accent font-medium"
            >
              📌 Today
            </button>
            <button
              onClick={() => onDrop(n.id)}
              className="press rounded-xl border border-hairline py-2 text-sm text-danger"
            >
              🗑 Drop
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
