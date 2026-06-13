import { useState } from 'react';
import { signIn, signUp } from '../lib/db';

export default function AuthScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  async function handle(mode: 'in' | 'up') {
    setBusy(true);
    setMsg(null);
    try {
      if (mode === 'up') {
        await signUp(email, password);
        setMsg('Account created. Check your email if confirmation is required, then sign in.');
      } else {
        await signIn(email, password);
      }
    } catch (e) {
      setMsg((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="min-h-dvh flex items-center justify-center px-6">
      <div className="app-bg" />
      <div className="glass w-full max-w-sm rounded-2xl p-7 shadow-card animate-fade-up">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-2xl">📝</span>
          <h1 className="font-display text-2xl font-bold tracking-tight">
            Notaty <span className="text-muted text-base font-normal">نوتاتي</span>
          </h1>
        </div>
        <p className="text-muted text-sm mb-6">Dump your thoughts. It sorts them out.</p>

        <label className="block text-xs text-muted mb-1">Email</label>
        <input
          type="email"
          inputMode="email"
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@example.com"
          className="w-full mb-3 rounded-xl bg-surface border border-hairline px-4 py-3 text-ink outline-none focus:border-accent transition-colors"
        />
        <label className="block text-xs text-muted mb-1">Password</label>
        <input
          type="password"
          autoComplete="current-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="••••••••"
          className="w-full mb-5 rounded-xl bg-surface border border-hairline px-4 py-3 text-ink outline-none focus:border-accent transition-colors"
        />

        <button
          onClick={() => handle('in')}
          disabled={busy || !email || !password}
          className="press w-full rounded-xl bg-accent text-white font-semibold py-3 shadow-glow disabled:opacity-40 disabled:shadow-none"
        >
          {busy ? '…' : 'Sign in'}
        </button>
        <button
          onClick={() => handle('up')}
          disabled={busy || !email || !password}
          className="press w-full rounded-xl mt-2 border border-hairline text-ink py-3 disabled:opacity-40"
        >
          Create account
        </button>

        {msg && <p className="text-xs text-warn mt-4 leading-relaxed">{msg}</p>}
      </div>
    </div>
  );
}
