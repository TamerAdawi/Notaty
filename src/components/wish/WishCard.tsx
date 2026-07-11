import type { Note } from '../../lib/db';

export function WishCard({
  item,
  onToggleBought,
  onDelete,
}: {
  item: Note;
  onToggleBought: (n: Note) => void;
  onDelete: (id: string) => void;
}) {
  const price = item.meta.price;
  const cur = item.meta.currency ?? '';
  const url = item.meta.url;

  return (
    <div
      className={`rounded-2xl border border-hairline bg-elevated p-3.5 shadow-card flex items-center gap-3 ${
        item.done ? 'opacity-55' : ''
      }`}
    >
      <button
        onClick={() => onToggleBought(item)}
        aria-label={item.done ? 'Mark not bought' : 'Mark bought'}
        className={`press h-6 w-6 shrink-0 rounded-full border grid place-items-center text-sm ${
          item.done ? 'bg-ok border-ok text-white' : 'border-muted text-transparent'
        }`}
      >
        ✓
      </button>

      <div className="min-w-0 flex-1">
        <div className={`text-[15px] break-words ${item.done ? 'line-through text-muted' : 'text-ink'}`}>
          {item.content}
        </div>
        {url && (
          <a href={url} target="_blank" rel="noreferrer noopener" className="press text-xs text-accent">
            Open ↗
          </a>
        )}
      </div>

      {price != null && (
        <div className="shrink-0 text-sm font-semibold text-ink tabular-nums">
          {price.toLocaleString()} {cur}
        </div>
      )}
      <button
        onClick={() => onDelete(item.id)}
        aria-label="Delete"
        className="press shrink-0 h-7 w-7 rounded-full grid place-items-center text-muted hover:bg-surface"
      >
        🗑
      </button>
    </div>
  );
}
