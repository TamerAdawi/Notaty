import { useEffect, useState } from 'react';
import {
  listHistory,
  logSince,
  updateSince,
  deleteSince,
  updateHistoryNote,
  deleteHistoryEntry,
  type SinceHistory,
  type SinceItem,
} from '../../lib/since';

function fmt(iso: string): string {
  return new Date(iso).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' });
}

export function SinceDetail({
  item,
  onClose,
  onChanged,
}: {
  item: SinceItem;
  onClose: () => void;
  onChanged: () => void;
}) {
  const [interval, setIntervalDays] = useState(item.interval_days);
  const [grace, setGrace] = useState(item.reminder_offset_days);
  const [history, setHistory] = useState<SinceHistory[]>([]);
  const [newNote, setNewNote] = useState('');
  const [editId, setEditId] = useState<string | null>(null);
  const [draft, setDraft] = useState('');

  async function load() {
    setHistory(await listHistory(item.id));
  }
  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [item.id]);

  async function saveField(field: 'interval_days' | 'reminder_offset_days', value: number) {
    if (field === 'interval_days') setIntervalDays(value);
    else setGrace(value);
    await updateSince(item.id, { [field]: value });
    onChanged();
  }

  async function logWithNote() {
    await logSince(item.id, newNote);
    setNewNote('');
    await load();
    onChanged();
  }

  async function removeItem() {
    if (!window.confirm(`Delete "${item.name}"? This removes its whole history too.`)) return;
    await deleteSince(item.id);
    onChanged();
    onClose();
  }

  const inputCls =
    'w-full rounded-xl bg-surface border border-hairline px-3 py-2.5 text-ink outline-none focus:border-accent';
  const heading = 'text-xs uppercase tracking-wide text-muted mt-5 mb-2';

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-base">
      <div className="app-bg" />
      <div className="mx-auto w-full max-w-md min-h-dvh flex flex-col">
        <header className="glass sticky top-0 z-10 flex items-center gap-2 px-3 py-3">
          <button onClick={onClose} aria-label="Back" className="press h-8 w-8 rounded-full grid place-items-center text-ink hover:bg-surface">
            ←
          </button>
          <h2 className="font-display text-lg font-bold">
            {item.emoji ? `${item.emoji} ` : ''}
            {item.name}
          </h2>
        </header>

        <div className="px-4 pb-28">
          <div className={heading}>Settings</div>
          <div className="flex gap-2">
            <div className="flex-1">
              <label className="block text-xs text-muted mb-1">Every (days)</label>
              <input className={inputCls} type="number" min={1} value={interval} onChange={(e) => saveField('interval_days', Number(e.target.value) || 1)} />
            </div>
            <div className="flex-1">
              <label className="block text-xs text-muted mb-1">Grace (days)</label>
              <input className={inputCls} type="number" min={0} value={grace} onChange={(e) => saveField('reminder_offset_days', Number(e.target.value) || 0)} />
            </div>
          </div>

          <div className={heading}>Log with a note</div>
          <textarea className={inputCls} rows={2} placeholder="Optional note…" value={newNote} onChange={(e) => setNewNote(e.target.value)} />
          <button onClick={logWithNote} className="press w-full mt-2 rounded-xl bg-accent text-onAccent font-semibold py-3 shadow-glow">
            Log now
          </button>

          <div className={heading}>History</div>
          {history.length === 0 ? (
            <p className="text-muted text-sm">No logs yet.</p>
          ) : (
            <div className="space-y-2">
              {history.map((entry) => (
                <div key={entry.id} className="rounded-xl border border-hairline bg-elevated p-3">
                  <div className="text-xs text-muted">{fmt(entry.logged_at)}</div>
                  {editId === entry.id ? (
                    <>
                      <textarea className={`${inputCls} mt-2`} rows={2} value={draft} onChange={(e) => setDraft(e.target.value)} />
                      <div className="flex gap-2 mt-2">
                        <button onClick={() => setEditId(null)} className="press rounded-lg border border-hairline px-3 py-1 text-xs text-muted">
                          Cancel
                        </button>
                        <button
                          onClick={async () => {
                            await updateHistoryNote(entry.id, draft);
                            setEditId(null);
                            await load();
                          }}
                          className="press rounded-lg bg-accent text-onAccent px-3 py-1 text-xs font-medium"
                        >
                          Save
                        </button>
                      </div>
                    </>
                  ) : (
                    <>
                      {entry.notes && <div className="text-sm text-ink mt-1">{entry.notes}</div>}
                      <div className="flex gap-2 mt-2">
                        <button
                          onClick={() => {
                            setEditId(entry.id);
                            setDraft(entry.notes ?? '');
                          }}
                          className="press rounded-lg border border-hairline px-3 py-1 text-xs text-muted"
                        >
                          {entry.notes ? 'Edit note' : 'Add note'}
                        </button>
                        <button
                          onClick={async () => {
                            await deleteHistoryEntry(entry.id);
                            await load();
                            onChanged();
                          }}
                          className="press rounded-lg border border-hairline px-3 py-1 text-xs text-danger"
                        >
                          Delete
                        </button>
                      </div>
                    </>
                  )}
                </div>
              ))}
            </div>
          )}

          <button onClick={removeItem} className="press w-full mt-6 rounded-xl border border-danger/40 text-danger py-3 text-sm">
            🗑 Delete item
          </button>
        </div>
      </div>
    </div>
  );
}
