import { useState } from 'react';
import type { Note } from '../lib/db';
import { CATEGORY_META, TYPE_META, PLATFORM_META, type ChecklistItem } from '../lib/parser';
import { formatDue } from '../lib/format';

function prettyUrl(u: string): string {
  try {
    const x = new URL(u);
    const path = x.pathname.length > 1 ? x.pathname.replace(/\/$/, '') : '';
    return (x.hostname.replace(/^www\./, '') + path).slice(0, 36);
  } catch {
    return u;
  }
}

interface Props {
  note: Note;
  onToggleDone: (n: Note) => void;
  onTogglePin: (n: Note) => void;
  onDelete: (id: string) => void;
  onUpdate: (id: string, patch: Partial<Note>) => void;
}

export default function NoteCard({ note, onToggleDone, onTogglePin, onDelete, onUpdate }: Props) {
  const [menu, setMenu] = useState(false);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState('');
  const t = note.type;
  const due = t === 'goal' ? null : formatDue(note.due_date);
  const isReel = t === 'reel';
  // Everything except list/goal/question gets a leading done checkbox.
  // (list completes via its items, goal via progress, question via "answered".)
  const checkable = t === 'task' || t === 'reminder' || t === 'event' || t === 'note' || t === 'idea' || isReel;
  const isQuestion = t === 'question';
  const url = note.meta.url;
  const platform = note.meta.platform ?? 'link';
  const hasDesc = isReel && !!url && note.content.trim() !== url;
  const showContentText = !(isReel && url && note.content.trim() === url);

  function saveDesc() {
    const text = draft.trim();
    onUpdate(note.id, { content: text || url || note.content });
    setEditing(false);
  }

  function toggleItem(idx: number) {
    const items: ChecklistItem[] = (note.meta.items ?? []).map((it, i) =>
      i === idx ? { ...it, done: !it.done } : it,
    );
    onUpdate(note.id, {
      meta: { ...note.meta, items },
      done: items.length > 0 && items.every((it) => it.done),
    });
  }

  function bumpGoal(delta: number) {
    const p = Math.max(0, Math.min(100, (note.meta.goalProgress ?? 0) + delta));
    onUpdate(note.id, { meta: { ...note.meta, goalProgress: p }, done: p >= 100 });
  }

  const dimmed = note.done && !isQuestion;

  return (
    <div
      className={`relative rounded-2xl border border-hairline bg-elevated p-3.5 shadow-card transition-all ${
        dimmed ? 'opacity-55' : ''
      }`}
    >
      <div className="flex items-start gap-3">
        {/* leading control */}
        {checkable ? (
          <button
            onClick={() => onToggleDone(note)}
            aria-label={
              isReel
                ? note.done ? 'Mark not watched' : 'Mark watched'
                : note.done ? 'Mark not done' : 'Mark done'
            }
            className={`press mt-0.5 h-6 w-6 shrink-0 rounded-full border grid place-items-center text-sm ${
              note.done ? 'bg-ok border-ok text-white' : 'border-muted text-transparent'
            }`}
          >
            ✓
          </button>
        ) : (
          <span className="mt-0.5 text-lg leading-none shrink-0" aria-hidden>
            {TYPE_META[t].icon}
          </span>
        )}

        {/* body */}
        <div className="min-w-0 flex-1">
          {showContentText && (
            <p
              className={`text-[15px] leading-snug break-words ${
                note.done && !isQuestion ? 'line-through text-muted' : 'text-ink'
              }`}
            >
              {note.content}
            </p>
          )}

          {/* saved reel / link */}
          {isReel && url && (
            <a
              href={url}
              target="_blank"
              rel="noreferrer noopener"
              className={`press mt-1 flex items-center gap-2 rounded-xl bg-surface border border-hairline px-3 py-2 text-sm ${
                note.done ? 'opacity-70' : ''
              }`}
            >
              <span className="text-base shrink-0">{PLATFORM_META[platform].icon}</span>
              <span className="min-w-0 flex-1">
                <span className="block text-ink">{PLATFORM_META[platform].label}</span>
                <span className="block text-muted text-xs truncate">{prettyUrl(url)}</span>
              </span>
              <span className="text-accent shrink-0">Open ↗</span>
            </a>
          )}

          {/* reel description (what it's about) */}
          {isReel &&
            (editing ? (
              <div className="mt-2">
                <textarea
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  rows={2}
                  autoFocus
                  placeholder="What's this reel about? (e.g. easy 10-min pasta recipe)"
                  className="w-full rounded-lg bg-surface border border-hairline p-2 text-sm text-ink outline-none focus:border-accent"
                />
                <div className="flex gap-2 mt-1.5">
                  <button
                    onClick={saveDesc}
                    className="press rounded-lg bg-accent text-white px-3 py-1 text-xs font-medium"
                  >
                    Save
                  </button>
                  <button
                    onClick={() => setEditing(false)}
                    className="press rounded-lg border border-hairline px-3 py-1 text-xs text-muted"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <button
                onClick={() => {
                  setDraft(hasDesc ? note.content : '');
                  setEditing(true);
                }}
                className="press mt-1.5 text-xs text-accent"
              >
                {hasDesc ? '✏️ Edit note' : '＋ Add a note about this'}
              </button>
            ))}

          {/* checklist items */}
          {t === 'list' && note.meta.items && (
            <div className="mt-2 space-y-1.5">
              {note.meta.items.map((it, i) => (
                <button
                  key={i}
                  onClick={() => toggleItem(i)}
                  className="press flex items-center gap-2 text-sm w-full text-left"
                >
                  <span
                    className={`h-4 w-4 shrink-0 rounded border grid place-items-center text-[10px] ${
                      it.done ? 'bg-accent border-accent text-white' : 'border-muted text-transparent'
                    }`}
                  >
                    ✓
                  </span>
                  <span className={it.done ? 'line-through text-muted' : 'text-ink'}>{it.text}</span>
                </button>
              ))}
            </div>
          )}

          {/* goal progress */}
          {t === 'goal' && (
            <div className="mt-2.5">
              <div className="h-2 rounded-full bg-surface overflow-hidden">
                <div
                  className="h-full bg-accent transition-all duration-500 ease-cinema"
                  style={{ width: `${note.meta.goalProgress ?? 0}%` }}
                />
              </div>
              <div className="mt-1.5 flex items-center gap-2 text-xs text-muted">
                <button onClick={() => bumpGoal(-10)} className="press rounded-md border border-hairline px-2 py-0.5">
                  −
                </button>
                <span className="tabular-nums">{note.meta.goalProgress ?? 0}%</span>
                <button onClick={() => bumpGoal(10)} className="press rounded-md border border-hairline px-2 py-0.5">
                  +
                </button>
              </div>
            </div>
          )}

          {/* meta row */}
          <div className="mt-2 flex flex-wrap items-center gap-x-2.5 gap-y-1 text-xs text-muted">
            <span className="inline-flex items-center gap-1">
              {CATEGORY_META[note.category] ?? '📥'} {note.category}
            </span>
            {due && (
              <span className={due.overdue && !note.done ? 'text-danger' : ''}>
                · {due.overdue && !note.done ? '⚠ ' : ''}
                {due.label}
              </span>
            )}
            {note.priority !== 'normal' && (
              <span className={note.priority === 'urgent' ? 'text-danger' : 'text-warn'}>
                · {note.priority === 'urgent' ? 'Urgent' : 'High'}
              </span>
            )}
            {isQuestion && (
              <button
                onClick={() => onToggleDone(note)}
                className={`press rounded-md px-1.5 py-0.5 border ${
                  note.done ? 'border-ok text-ok' : 'border-hairline'
                }`}
              >
                {note.done ? '✔ Answered' : 'Mark answered'}
              </button>
            )}
            {note.tags.map((tag) => (
              <span key={tag} className="text-accent">
                #{tag}
              </span>
            ))}
          </div>
        </div>

        {/* trailing actions */}
        <div className="shrink-0 flex flex-col items-center gap-1">
          {note.pinned && <span className="text-xs">📌</span>}
          <button
            onClick={() => setMenu((m) => !m)}
            aria-label="More"
            className="press h-7 w-7 rounded-full grid place-items-center text-muted hover:bg-surface"
          >
            ⋯
          </button>
        </div>
      </div>

      {menu && (
        <div className="absolute right-2 top-10 z-10 glass rounded-xl p-1 shadow-card text-sm">
          <button
            onClick={() => {
              onToggleDone(note);
              setMenu(false);
            }}
            className="press block w-full text-left px-3 py-2 rounded-lg hover:bg-surface"
          >
            {note.done ? '↺ Mark not done' : '✓ Mark done'}
          </button>
          <button
            onClick={() => {
              onTogglePin(note);
              setMenu(false);
            }}
            className="press block w-full text-left px-3 py-2 rounded-lg hover:bg-surface"
          >
            {note.pinned ? '📌 Unpin' : '📌 Pin'}
          </button>
          <button
            onClick={() => {
              onDelete(note.id);
              setMenu(false);
            }}
            className="press block w-full text-left px-3 py-2 rounded-lg text-danger hover:bg-surface"
          >
            🗑 Delete
          </button>
        </div>
      )}
    </div>
  );
}
