import { statusLevel, daysSinceLabel, type SinceItem } from '../../lib/since';

export function SinceCard({
  item,
  onLog,
  onOpen,
}: {
  item: SinceItem;
  onLog: (id: string) => void;
  onOpen: (id: string) => void;
}) {
  const level = statusLevel(item);
  const ring =
    level === 'overdue' ? 'border-danger/60' : level === 'due' ? 'border-warn/60' : 'border-hairline';
  const daysColor =
    level === 'overdue' ? 'text-danger' : level === 'due' ? 'text-warn' : 'text-muted';

  return (
    <div className={`rounded-2xl border ${ring} bg-elevated p-3.5 shadow-card flex items-center gap-3`}>
      <button onClick={() => onOpen(item.id)} className="press flex-1 text-left min-w-0">
        <div className="flex items-center gap-2 text-[15px] text-ink">
          {item.emoji && <span>{item.emoji}</span>}
          <span className="truncate">{item.name}</span>
        </div>
        <div className={`text-xs mt-0.5 ${daysColor}`}>
          {daysSinceLabel(item.days_since)} since · every {item.interval_days}d
        </div>
      </button>
      <button
        onClick={() => onLog(item.id)}
        className="press shrink-0 rounded-lg bg-accent text-onAccent text-xs font-semibold px-3 py-2"
      >
        Log today
      </button>
    </div>
  );
}
