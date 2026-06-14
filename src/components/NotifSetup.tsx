import { useState } from 'react';
import { enablePush, notifPermission, pushSupported } from '../lib/push';
import { getSaveToken, isCloud } from '../lib/db';

export default function NotifSetup({ onClose }: { onClose: () => void }) {
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [enabled, setEnabled] = useState(notifPermission() === 'granted');
  const standalone =
    window.matchMedia('(display-mode: standalone)').matches ||
    // iOS Safari
    (navigator as unknown as { standalone?: boolean }).standalone === true;

  async function handleEnable() {
    setBusy(true);
    setMsg(null);
    try {
      const r = await enablePush();
      setMsg(r.message);
      setEnabled(r.ok);
    } catch (e) {
      setMsg((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  async function handleTest() {
    setBusy(true);
    setMsg(null);
    try {
      const token = await getSaveToken();
      if (!token) throw new Error('Sign in on the live app first.');
      const res = await fetch(`${window.location.origin}/api/push-test`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token }),
      });
      const data = await res.json();
      setMsg(res.ok ? `Test sent to ${data.sent} device(s) — check your lock screen!` : data.error);
    } catch (e) {
      setMsg((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60" onClick={onClose}>
      <div className="min-h-dvh flex items-start justify-center p-4" onClick={(e) => e.stopPropagation()}>
        <div className="glass w-full max-w-md rounded-2xl p-4 my-6 shadow-card animate-fade-up">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xl">🔔</span>
            <h2 className="font-display text-lg font-bold">Notifications</h2>
            <button onClick={onClose} className="press ml-auto text-muted h-8 w-8 rounded-full hover:bg-surface">
              ✕
            </button>
          </div>
          <p className="text-muted text-sm mb-4">
            Get a notification when a reminder or event is due, plus a weekly digest of saved reels &
            forgotten notes.
          </p>

          {!isCloud ? (
            <div className="rounded-xl bg-warn/15 text-warn text-sm p-3">
              Open the live, signed-in app to enable notifications.
            </div>
          ) : !pushSupported() ? (
            <div className="rounded-xl bg-warn/15 text-warn text-sm p-3">
              This browser can't receive push. On iPhone: add Notaty to your Home Screen, then open it
              from there.
            </div>
          ) : (
            <>
              {!standalone && (
                <div className="rounded-xl bg-warn/15 text-warn text-sm p-3 mb-3">
                  📱 On iPhone, notifications only work from the <b>Home Screen app</b>. If you're in
                  Safari, add it to your Home Screen first (Share → Add to Home Screen), then open it
                  from the icon.
                </div>
              )}

              <button
                onClick={handleEnable}
                disabled={busy}
                className="press w-full rounded-xl bg-accent text-white font-semibold py-3 shadow-glow disabled:opacity-40"
              >
                {enabled ? '🔔 Notifications enabled — re-enable this device' : '🔔 Enable notifications'}
              </button>

              <button
                onClick={handleTest}
                disabled={busy}
                className="press w-full rounded-xl mt-2 border border-hairline text-ink py-3 disabled:opacity-40"
              >
                Send me a test notification
              </button>

              {msg && <p className="text-sm mt-4 text-ink leading-relaxed">{msg}</p>}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
