import { isCloud, signOut, type Note, type AppUser } from '../lib/db';

export default function MenuSheet({
  notes,
  user,
  theme,
  onToggleTheme,
  onClose,
  onOpenSaveSetup,
}: {
  notes: Note[];
  user: AppUser | null;
  theme: 'dark' | 'light';
  onToggleTheme: () => void;
  onClose: () => void;
  onOpenSaveSetup: () => void;
}) {
  function exportJson() {
    const blob = new Blob([JSON.stringify(notes, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `notaty-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    onClose();
  }

  const item = 'press w-full text-left px-4 py-3.5 rounded-xl hover:bg-surface flex items-center gap-3';

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center" onClick={onClose}>
      <div className="absolute inset-0 bg-black/50" />
      <div
        className="relative glass w-full max-w-md rounded-t-3xl p-3 pb-[calc(env(safe-area-inset-bottom)+1rem)] animate-fade-up"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mx-auto mb-2 h-1 w-10 rounded-full bg-hairline" />
        <div className="px-4 py-2 text-xs text-muted">
          {isCloud ? user?.email : 'Offline demo · stored on this device'}
        </div>
        <button
          className={item}
          onClick={() => {
            onOpenSaveSetup();
            onClose();
          }}
        >
          📲 <span>Save reels from your phone</span>
        </button>
        <button className={item} onClick={exportJson}>
          ⬇️ <span>Export notes (JSON)</span>
          <span className="ml-auto text-muted text-xs">{notes.length}</span>
        </button>
        <button className={item} onClick={onToggleTheme}>
          {theme === 'dark' ? '☀️' : '🌙'} <span>{theme === 'dark' ? 'Light mode' : 'Dark mode'}</span>
        </button>
        {isCloud && (
          <button className={`${item} text-danger`} onClick={() => signOut()}>
            🚪 <span>Sign out</span>
          </button>
        )}
        <button className={`${item} text-muted justify-center`} onClick={onClose}>
          Close
        </button>
      </div>
    </div>
  );
}
