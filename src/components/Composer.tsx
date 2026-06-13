import { useEffect, useMemo, useRef, useState } from 'react';
import {
  parseNote,
  TYPE_META,
  CATEGORY_META,
  CATEGORY_LIST,
  type NoteType,
  type Priority,
} from '../lib/parser';
import { formatDue } from '../lib/format';
import type { Note } from '../lib/db';

const ALL_TYPES = Object.keys(TYPE_META) as NoteType[];
const PRIORITIES: { id: Priority; label: string; dot: string }[] = [
  { id: 'normal', label: 'Normal', dot: '⚪' },
  { id: 'high', label: 'High', dot: '🟡' },
  { id: 'urgent', label: 'Urgent', dot: '🔴' },
];

export default function Composer({
  onAdd,
  autoFocus,
}: {
  onAdd: (raw: string, override?: Partial<Note>) => Promise<unknown>;
  autoFocus?: boolean;
}) {
  const [text, setText] = useState('');
  const [oType, setOType] = useState<NoteType | null>(null);
  const [oCat, setOCat] = useState<string | null>(null);
  const [oPriority, setOPriority] = useState<Priority | null>(null);
  const [busy, setBusy] = useState(false);
  const taRef = useRef<HTMLTextAreaElement>(null);

  const parsed = useMemo(() => (text.trim() ? parseNote(text) : null), [text]);
  const effType = oType ?? parsed?.type ?? 'note';
  const effCat = oCat ?? parsed?.category ?? 'Inbox';
  const effPriority = oPriority ?? parsed?.priority ?? 'normal';
  const due = parsed ? formatDue(parsed.due_date) : null;

  useEffect(() => {
    if (autoFocus) taRef.current?.focus();
  }, [autoFocus]);

  function grow() {
    const ta = taRef.current;
    if (!ta) return;
    ta.style.height = 'auto';
    ta.style.height = Math.min(ta.scrollHeight, 200) + 'px';
  }

  function reset() {
    setText('');
    setOType(null);
    setOCat(null);
    setOPriority(null);
    if (taRef.current) {
      taRef.current.style.height = 'auto';
      taRef.current.focus();
    }
  }

  async function submit() {
    const raw = text.trim();
    if (!raw || busy) return;
    setBusy(true);
    try {
      const override: Partial<Note> = {};
      if (oType) override.type = oType;
      if (oCat) override.category = oCat;
      if (oPriority) override.priority = oPriority;
      await onAdd(raw, override);
      reset();
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="glass rounded-2xl p-3 shadow-card w-full">
      <textarea
        ref={taRef}
        rows={3}
        value={text}
        onChange={(e) => {
          setText(e.target.value);
          grow();
        }}
        onKeyDown={(e) => {
          if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
            e.preventDefault();
            submit();
          }
        }}
        placeholder="What's on your mind?"
        className="w-full bg-transparent resize-none outline-none text-ink placeholder:text-muted px-1.5 py-1 text-[16px] leading-relaxed min-h-[64px]"
      />

      {/* live detection hint */}
      {parsed && (
        <div className="flex flex-wrap items-center gap-1.5 px-1 pb-2 text-xs animate-fade-up">
          <span className="inline-flex items-center gap-1 rounded-lg bg-accent/15 text-accent px-2 py-1 font-medium">
            {TYPE_META[effType].icon} {TYPE_META[effType].label}
          </span>
          {due && (
            <span
              className={`inline-flex items-center gap-1 rounded-lg px-2 py-1 ${
                due.overdue ? 'bg-danger/15 text-danger' : 'bg-surface text-muted'
              }`}
            >
              ⏱ {due.label}
            </span>
          )}
          {parsed.tags.map((t) => (
            <span key={t} className="rounded-lg bg-surface px-2 py-1 text-accent">
              #{t}
            </span>
          ))}
          {/* type override */}
          <div className="flex gap-1 overflow-x-auto ml-auto">
            {ALL_TYPES.map((t) => (
              <button
                key={t}
                onClick={() => setOType(t)}
                title={`Mark as ${TYPE_META[t].label}`}
                className={`press shrink-0 rounded-lg px-1.5 py-1 border ${
                  t === effType ? 'border-accent bg-accent/15' : 'border-hairline opacity-60'
                }`}
              >
                {TYPE_META[t].icon}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* manual controls: category + priority (optional) */}
      <div className="flex items-center gap-2 px-1">
        <div className="relative">
          <select
            value={oCat ?? ''}
            onChange={(e) => setOCat(e.target.value || null)}
            className="appearance-none rounded-lg bg-surface border border-hairline pl-2.5 pr-7 py-1.5 text-sm text-ink outline-none focus:border-accent"
            aria-label="Category"
          >
            <option value="">{CATEGORY_META[effCat]} {parsed ? `Auto · ${effCat}` : 'Category'}</option>
            {CATEGORY_LIST.map((c) => (
              <option key={c} value={c}>
                {CATEGORY_META[c]} {c}
              </option>
            ))}
          </select>
          <span className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-muted text-xs">▾</span>
        </div>

        <div className="flex gap-1">
          {PRIORITIES.map((p) => (
            <button
              key={p.id}
              onClick={() => setOPriority(p.id)}
              title={p.label}
              className={`press rounded-lg px-2 py-1.5 text-sm border ${
                p.id === effPriority ? 'border-accent bg-accent/15 text-ink' : 'border-hairline text-muted'
              }`}
            >
              {p.dot}
            </button>
          ))}
        </div>

        <button
          onClick={submit}
          disabled={!text.trim() || busy}
          aria-label="Add note"
          className="press ml-auto shrink-0 h-10 px-4 rounded-full bg-accent text-white font-semibold grid place-items-center shadow-glow disabled:opacity-30 disabled:shadow-none"
        >
          {busy ? '…' : 'Add ↑'}
        </button>
      </div>
    </div>
  );
}
