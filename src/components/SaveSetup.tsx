import { useEffect, useState } from 'react';
import { getSaveToken, isCloud } from '../lib/db';

export default function SaveSetup({ onClose }: { onClose: () => void }) {
  const [token, setToken] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState<string | null>(null);

  const endpoint = `${window.location.origin}/api/save`;

  useEffect(() => {
    if (!isCloud) {
      setLoading(false);
      return;
    }
    getSaveToken()
      .then((t) => setToken(t))
      .catch((e) => setErr((e as Error).message))
      .finally(() => setLoading(false));
  }, []);

  function copy(label: string, value: string) {
    navigator.clipboard?.writeText(value);
    setCopied(label);
    setTimeout(() => setCopied(null), 1500);
  }

  const Row = ({ label, value }: { label: string; value: string }) => (
    <div className="rounded-xl bg-surface border border-hairline p-3">
      <div className="text-xs text-muted mb-1">{label}</div>
      <div className="flex items-center gap-2">
        <code className="text-xs text-ink break-all flex-1">{value}</code>
        <button
          onClick={() => copy(label, value)}
          className="press shrink-0 rounded-lg bg-accent/15 text-accent px-2.5 py-1 text-xs font-medium"
        >
          {copied === label ? '✓' : 'Copy'}
        </button>
      </div>
    </div>
  );

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60" onClick={onClose}>
      <div
        className="min-h-dvh flex items-start justify-center p-4"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="glass w-full max-w-md rounded-2xl p-4 my-6 shadow-card animate-fade-up">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xl">📲</span>
            <h2 className="font-display text-lg font-bold">Save from your phone</h2>
            <button onClick={onClose} className="press ml-auto text-muted h-8 w-8 rounded-full hover:bg-surface">
              ✕
            </button>
          </div>
          <p className="text-muted text-sm mb-4">
            Set up a one-time iPhone Shortcut, then share any reel from Instagram, TikTok or
            Facebook straight into Notaty — no copy-paste.
          </p>

          {!isCloud ? (
            <div className="rounded-xl bg-warn/15 text-warn text-sm p-3">
              This works on the live, signed-in app. Open your deployed Notaty and sign in first.
            </div>
          ) : loading ? (
            <div className="text-muted text-sm py-6 text-center">Loading your token…</div>
          ) : err ? (
            <div className="rounded-xl bg-danger/15 text-danger text-sm p-3">
              {err}
              <div className="text-muted mt-1">
                Make sure the <code>save_tokens</code> table exists in Supabase.
              </div>
            </div>
          ) : (
            <>
              <div className="space-y-2 mb-4">
                <Row label="Paste this as the URL (your token is included — keep private)" value={token ? `${endpoint}?token=${token}` : endpoint} />
              </div>

              <ol className="space-y-2.5 text-sm text-ink list-decimal pl-5">
                <li>Open the <b>Shortcuts</b> app → tap <b>+</b> to create a new shortcut.</li>
                <li>
                  Tap the settings icon → turn on <b>Show in Share Sheet</b>; under accepted types
                  keep <b>URLs</b> and <b>Text</b>. Name it <b>“Save to Notaty”</b>.
                </li>
                <li>
                  Add the action <b>Get Contents of URL</b> and set:
                  <ul className="list-disc pl-5 mt-1 text-muted">
                    <li><b>URL</b>: paste the URL above (it already has your token)</li>
                    <li><b>Method</b>: POST</li>
                    <li><b>Request Body</b>: JSON</li>
                    <li>Add one field <code>url</code> (Text) = the <b>Shortcut Input</b> variable</li>
                  </ul>
                </li>
                <li>(Optional) add <b>Show Notification</b> = <b>Contents of URL</b> to see the result.</li>
                <li>
                  Done! In Instagram/TikTok/Facebook tap <b>Share → Save to Notaty</b>. It appears
                  under <b>🎬 Saved</b>.
                </li>
              </ol>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
