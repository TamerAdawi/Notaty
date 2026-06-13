import type { Note } from '../lib/db';
import { CATEGORY_META } from '../lib/parser';
import { isToday, isUpcoming } from '../lib/format';

export type Filter = string; // 'all' | 'today' | 'upcoming' | 'done' | 'pinned' | `cat:<name>`

const SMART: { id: Filter; label: string; icon: string }[] = [
  { id: 'all', label: 'All', icon: '🗂' },
  { id: 'today', label: 'Today', icon: '📌' },
  { id: 'upcoming', label: 'Upcoming', icon: '🗓' },
  { id: 'done', label: 'Done', icon: '✅' },
];

export function matchesFilter(n: Note, f: Filter): boolean {
  if (f === 'all') return !n.done;
  if (f === 'done') return n.done;
  if (f === 'pinned') return n.pinned;
  if (f === 'today') return !n.done && isToday(n.due_date);
  if (f === 'upcoming') return !n.done && isUpcoming(n.due_date);
  if (f.startsWith('cat:')) return !n.done && n.category === f.slice(4);
  return true;
}

export default function FilterBar({
  notes,
  active,
  onChange,
}: {
  notes: Note[];
  active: Filter;
  onChange: (f: Filter) => void;
}) {
  const cats = Array.from(new Set(notes.filter((n) => !n.done).map((n) => n.category)));

  const pill = (id: Filter, label: string, icon: string) => {
    const on = active === id;
    return (
      <button
        key={id}
        onClick={() => onChange(id)}
        className={`press shrink-0 rounded-full px-3.5 py-1.5 text-sm border whitespace-nowrap ${
          on ? 'bg-accent text-white border-accent shadow-glow' : 'bg-surface text-muted border-hairline'
        }`}
      >
        <span className="mr-1">{icon}</span>
        {label}
      </button>
    );
  };

  return (
    <div className="flex gap-2 overflow-x-auto px-4 py-2 -mx-0.5">
      {SMART.map((s) => pill(s.id, s.label, s.icon))}
      {cats.map((c) => pill(`cat:${c}`, c, CATEGORY_META[c] ?? '📥'))}
    </div>
  );
}
