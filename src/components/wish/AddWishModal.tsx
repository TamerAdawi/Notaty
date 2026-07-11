import { useState } from 'react';

export interface WishFields {
  name: string;
  price?: number;
  currency?: string;
  url?: string;
}

export function AddWishModal({
  onAdd,
  onClose,
}: {
  onAdd: (f: WishFields) => Promise<void>;
  onClose: () => void;
}) {
  const [name, setName] = useState('');
  const [price, setPrice] = useState('');
  const [currency, setCurrency] = useState('₪');
  const [url, setUrl] = useState('');
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) {
      setErr('What do you want to buy?');
      return;
    }
    setSaving(true);
    setErr(null);
    try {
      await onAdd({
        name: name.trim(),
        price: price ? Number(price) : undefined,
        currency: currency.trim() || undefined,
        url: url.trim() || undefined,
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
        <h2 className="font-display text-lg font-bold mb-3">Add to wish list</h2>

        <label className="block text-xs text-muted mb-1">Item</label>
        <input className={`${inputCls} mb-3`} value={name} onChange={(e) => setName(e.target.value)} placeholder="AirPods Pro" autoFocus />

        <div className="flex gap-2 mb-3">
          <div className="flex-[2]">
            <label className="block text-xs text-muted mb-1">Price</label>
            <input className={inputCls} type="number" min={0} step="any" value={price} onChange={(e) => setPrice(e.target.value)} placeholder="250" inputMode="decimal" />
          </div>
          <div className="flex-1">
            <label className="block text-xs text-muted mb-1">Currency</label>
            <input className={inputCls} value={currency} onChange={(e) => setCurrency(e.target.value)} placeholder="₪" maxLength={4} />
          </div>
        </div>

        <label className="block text-xs text-muted mb-1">Link (optional)</label>
        <input className={`${inputCls} mb-4`} value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://…" inputMode="url" />

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
