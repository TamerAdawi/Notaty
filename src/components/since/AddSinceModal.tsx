import { useState } from 'react';
import type { NewSinceItem } from '../../lib/since';

export function AddSinceModal({
  onAdd,
  onClose,
}: {
  onAdd: (f: NewSinceItem) => Promise<void>;
  onClose: () => void;
}) {
  const [name, setName] = useState('');
  const [emoji, setEmoji] = useState('');
  const [interval, setInterval] = useState('7');
  const [grace, setGrace] = useState('0');
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) {
      setErr('Name is required');
      return;
    }
    setSaving(true);
    setErr(null);
    try {
      await onAdd({
        name: name.trim(),
        emoji: emoji.trim() || null,
        interval_days: Number(interval) || 1,
        reminder_offset_days: Number(grace) || 0,
      });
      onClose();
    } catch (e) {
      setErr((e as Error).message);
    } finally {
      setSaving(false);
    }
  }

  const inputCls =
    'w-full rounded-xl bg-surface border border-hairline px-3 py-2.5 text-ink outline-none focus:border-accent';

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60" onClick={onClose}>
      <form
        onSubmit={submit}
        onClick={(e) => e.stopPropagation()}
        className="glass w-full max-w-md rounded-t-3xl sm:rounded-2xl p-4 pb-[calc(env(safe-area-inset-bottom)+1rem)] animate-fade-up"
      >
        <h2 className="font-display text-lg font-bold mb-3">Track something new</h2>

        <div className="flex gap-2 mb-3">
          <div className="flex-[3]">
            <label className="block text-xs text-muted mb-1">Name</label>
            <input className={inputCls} value={name} onChange={(e) => setName(e.target.value)} placeholder="Water the plants" autoFocus />
          </div>
          <div className="flex-1">
            <label className="block text-xs text-muted mb-1">Emoji</label>
            <input className={inputCls} value={emoji} onChange={(e) => setEmoji(e.target.value)} placeholder="🌱" maxLength={4} />
          </div>
        </div>

        <div className="flex gap-2 mb-4">
          <div className="flex-1">
            <label className="block text-xs text-muted mb-1">Every (days)</label>
            <input className={inputCls} type="number" min={1} value={interval} onChange={(e) => setInterval(e.target.value)} />
          </div>
          <div className="flex-1">
            <label className="block text-xs text-muted mb-1">Grace (days)</label>
            <input className={inputCls} type="number" min={0} value={grace} onChange={(e) => setGrace(e.target.value)} />
          </div>
        </div>

        {err && <p className="text-danger text-sm mb-3">{err}</p>}

        <div className="flex gap-2">
          <button type="button" onClick={onClose} className="press flex-1 rounded-xl border border-hairline py-3 text-ink">
            Cancel
          </button>
          <button type="submit" disabled={saving} className="press flex-1 rounded-xl bg-accent text-onAccent font-semibold py-3 shadow-glow disabled:opacity-40">
            {saving ? 'Adding…' : 'Add'}
          </button>
        </div>
      </form>
    </div>
  );
}
