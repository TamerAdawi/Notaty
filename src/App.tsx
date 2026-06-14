import { useEffect, useMemo, useRef, useState } from 'react';
import { useAuth } from './hooks/useAuth';
import { useNotes } from './hooks/useNotes';
import { isCloud, type Note } from './lib/db';
import { TYPE_META, PLATFORM_META } from './lib/parser';
import AuthScreen from './components/AuthScreen';
import Composer from './components/Composer';
import NoteCard from './components/NoteCard';
import FilterBar, { matchesFilter, type Filter } from './components/FilterBar';
import SearchBar from './components/SearchBar';
import EmptyState from './components/EmptyState';
import MenuSheet from './components/MenuSheet';
import SaveSetup from './components/SaveSetup';
import NotifSetup from './components/NotifSetup';
import ReviewView from './components/ReviewView';
import { daysSince } from './lib/format';

// Open, non-reel items untouched for this many days surface in Review.
const STALE_DAYS = 21;

export default function App() {
  const { user, loading: authLoading } = useAuth();
  const [theme, setTheme] = useState<'dark' | 'light'>(
    () => (localStorage.getItem('notaty.theme') as 'dark' | 'light') || 'dark',
  );

  useEffect(() => {
    document.documentElement.classList.toggle('light', theme === 'light');
    document.documentElement.classList.toggle('dark', theme === 'dark');
    localStorage.setItem('notaty.theme', theme);
  }, [theme]);

  if (authLoading) {
    return (
      <div className="min-h-dvh grid place-items-center">
        <div className="app-bg" />
        <div className="text-3xl animate-pulse">📝</div>
      </div>
    );
  }

  if (isCloud && !user) return <AuthScreen />;

  return <Shell userId={user!.id} theme={theme} setTheme={setTheme} />;
}

type View = 'capture' | 'notes' | 'saved' | 'review';

function matchesSaved(n: Note, f: string): boolean {
  if (f === 'all') return true;
  if (f === 'unwatched') return !n.done;
  if (f === 'watched') return n.done;
  if (f.startsWith('plat:')) return (n.meta.platform ?? 'link') === f.slice(5);
  return true;
}

function Shell({
  userId,
  theme,
  setTheme,
}: {
  userId: string;
  theme: 'dark' | 'light';
  setTheme: (t: 'dark' | 'light') => void;
}) {
  const { user } = useAuth();
  const { notes, loading, error, add, remove, update, toggleDone, togglePin } = useNotes(userId);
  const [view, setView] = useState<View>('capture');
  const [filter, setFilter] = useState<Filter>('all');
  const [savedFilter, setSavedFilter] = useState<string>('all');
  const [search, setSearch] = useState('');
  const [menu, setMenu] = useState(false);
  const [saveSetup, setSaveSetup] = useState(false);
  const [notifSetup, setNotifSetup] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const toastTimer = useRef<number | undefined>(undefined);

  const reels = useMemo(() => notes.filter((n) => n.type === 'reel'), [notes]);
  const plainNotes = useMemo(() => notes.filter((n) => n.type !== 'reel'), [notes]);
  const openNotesCount = plainNotes.filter((n) => !n.done).length;
  const unwatchedCount = reels.filter((n) => !n.done).length;
  const staleItems = useMemo(
    () =>
      plainNotes
        .filter((n) => !n.done && daysSince(n.updated_at) >= STALE_DAYS)
        .sort((a, b) => +new Date(a.updated_at) - +new Date(b.updated_at)),
    [plainNotes],
  );

  const reviewKeep = (id: string) => update(id, { updated_at: new Date().toISOString() });
  const reviewToday = (id: string) => {
    const d = new Date();
    d.setHours(9, 0, 0, 0);
    update(id, { due_date: d.toISOString(), pinned: true, updated_at: new Date().toISOString() });
  };
  const reviewDrop = (id: string) => remove(id);

  async function addWithToast(raw: string, override?: Partial<Note>) {
    const n = (await add(raw, override)) as Note;
    const label = n.type === 'reel' ? 'Saved' : TYPE_META[n.type].label;
    setToast(`Saved · ${TYPE_META[n.type].icon} ${label}`);
    window.clearTimeout(toastTimer.current);
    toastTimer.current = window.setTimeout(() => setToast(null), 1700);
    return n;
  }

  const q = search.trim().toLowerCase();
  const textMatch = (n: Note) =>
    !q ||
    n.content.toLowerCase().includes(q) ||
    n.category.toLowerCase().includes(q) ||
    (n.meta.platform ?? '').includes(q) ||
    n.tags.some((t) => t.includes(q));

  const visibleNotes = useMemo(
    () =>
      plainNotes
        .filter((n) => matchesFilter(n, filter))
        .filter(textMatch)
        .sort((a, b) => Number(b.pinned) - Number(a.pinned)),
    [plainNotes, filter, q],
  );

  const visibleReels = useMemo(
    () =>
      reels
        .filter((n) => matchesSaved(n, savedFilter))
        .filter(textMatch)
        .sort((a, b) => Number(a.done) - Number(b.done)),
    [reels, savedFilter, q],
  );

  const overlays = (
    <>
      {menu && (
        <MenuSheet
          notes={notes}
          user={user}
          theme={theme}
          onToggleTheme={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
          onClose={() => setMenu(false)}
          onOpenSaveSetup={() => setSaveSetup(true)}
          onOpenNotifSetup={() => setNotifSetup(true)}
        />
      )}
      {saveSetup && <SaveSetup onClose={() => setSaveSetup(false)} />}
      {notifSetup && <NotifSetup onClose={() => setNotifSetup(false)} />}
    </>
  );

  /* ----------------------------- CAPTURE ----------------------------- */
  if (view === 'capture') {
    return (
      <div className="min-h-dvh flex flex-col">
        <div className="app-bg" />
        <header className="flex items-center gap-2 px-4 py-3 max-w-md mx-auto w-full">
          <span className="text-xl">📝</span>
          <h1 className="font-display text-lg font-bold tracking-tight">
            Notaty <span className="text-muted text-xs font-normal align-middle">نوتاتي</span>
          </h1>
          <span
            className={`ml-auto text-[10px] rounded-full px-2 py-0.5 ${
              isCloud ? 'bg-ok/15 text-ok' : 'bg-warn/15 text-warn'
            }`}
          >
            {isCloud ? '☁ Synced' : '⚲ Demo'}
          </span>
          <button
            onClick={() => setMenu(true)}
            aria-label="Menu"
            className="press h-8 w-8 rounded-full grid place-items-center text-muted hover:bg-surface"
          >
            ⋯
          </button>
        </header>

        <main className="flex-1 grid place-items-center px-4 pb-10">
          <div className="w-full max-w-md">
            <h2 className="font-display text-2xl font-semibold mb-1 text-ink">What's on your mind?</h2>
            <p className="text-muted text-sm mb-4">
              Dump it here — Notaty files it for you. Paste a reel link to save it too.
            </p>
            <Composer onAdd={addWithToast} autoFocus />

            <div className="mt-5 flex items-center justify-center gap-2">
              <button
                onClick={() => setView('notes')}
                className="press flex items-center gap-2 rounded-full bg-surface border border-hairline px-4 py-2 text-sm text-ink"
              >
                🗂 My notes
                <span className="rounded-full bg-accent/20 text-accent px-2 py-0.5 text-xs">
                  {openNotesCount}
                </span>
              </button>
              <button
                onClick={() => setView('saved')}
                className="press flex items-center gap-2 rounded-full bg-surface border border-hairline px-4 py-2 text-sm text-ink"
              >
                🎬 Saved
                <span className="rounded-full bg-accent/20 text-accent px-2 py-0.5 text-xs">
                  {unwatchedCount}
                </span>
              </button>
            </div>

            {staleItems.length > 0 && (
              <button
                onClick={() => setView('review')}
                className="press mt-3 w-full rounded-xl border border-hairline bg-surface px-4 py-3 text-sm text-ink flex items-center gap-2 animate-fade-up"
              >
                <span className="text-base">🕰</span>
                <span className="text-left">
                  <span className="block font-medium">Review {staleItems.length} forgotten item{staleItems.length > 1 ? 's' : ''}</span>
                  <span className="block text-muted text-xs">Untouched for 3+ weeks — keep, do, or drop</span>
                </span>
                <span className="ml-auto text-accent">→</span>
              </button>
            )}
          </div>
        </main>

        {toast && (
          <div className="fixed bottom-6 inset-x-0 z-30 flex justify-center pointer-events-none">
            <div className="glass rounded-full px-4 py-2 text-sm text-ink shadow-card animate-fade-up">
              {toast}
            </div>
          </div>
        )}
        {overlays}
      </div>
    );
  }

  /* ------------------------------ REVIEW ----------------------------- */
  if (view === 'review') {
    return (
      <div className="min-h-dvh">
        <div className="app-bg" />
        <div className="mx-auto w-full max-w-md flex flex-col min-h-dvh">
          <header className="glass sticky top-0 z-20 flex items-center gap-2 px-3 py-3">
            <button
              onClick={() => setView('capture')}
              aria-label="Back to capture"
              className="press h-8 w-8 rounded-full grid place-items-center text-ink hover:bg-surface"
            >
              ←
            </button>
            <h1 className="font-display text-lg font-bold tracking-tight">🕰 Review</h1>
            <span className="text-muted text-xs ml-1">{staleItems.length}</span>
          </header>
          <main className="flex-1 px-4 py-3 pb-28">
            <ReviewView
              items={staleItems}
              onKeep={reviewKeep}
              onToday={reviewToday}
              onDrop={reviewDrop}
            />
          </main>
        </div>
        {overlays}
      </div>
    );
  }

  /* ------------------------ SHARED BROWSE CHROME --------------------- */
  const isSaved = view === 'saved';
  const list = isSaved ? visibleReels : visibleNotes;

  return (
    <div className="min-h-dvh">
      <div className="app-bg" />
      <div className="mx-auto w-full max-w-md flex flex-col min-h-dvh">
        <header className="glass sticky top-0 z-20 flex items-center gap-2 px-3 py-3">
          <button
            onClick={() => setView('capture')}
            aria-label="Back to capture"
            className="press h-8 w-8 rounded-full grid place-items-center text-ink hover:bg-surface"
          >
            ←
          </button>
          <h1 className="font-display text-lg font-bold tracking-tight">
            {isSaved ? '🎬 Saved' : '🗂 My notes'}
          </h1>
          <span className="text-muted text-xs ml-1">{isSaved ? reels.length : plainNotes.length}</span>
          {/* switch between the two sections */}
          <button
            onClick={() => setView(isSaved ? 'notes' : 'saved')}
            className="press ml-auto rounded-full bg-surface border border-hairline px-3 py-1 text-xs text-ink"
          >
            {isSaved ? '🗂 Notes' : '🎬 Saved'}
          </button>
          <button
            onClick={() => setMenu(true)}
            aria-label="Menu"
            className="press h-8 w-8 rounded-full grid place-items-center text-muted hover:bg-surface"
          >
            ⋯
          </button>
        </header>

        <div className="py-2 space-y-1">
          <SearchBar value={search} onChange={setSearch} />
          {isSaved ? (
            <SavedFilters reels={reels} active={savedFilter} onChange={setSavedFilter} />
          ) : (
            <FilterBar notes={plainNotes} active={filter} onChange={setFilter} />
          )}
        </div>

        <main className="flex-1 px-4 pb-28 space-y-2.5">
          {error && <div className="rounded-xl bg-danger/15 text-danger text-sm p-3">{error}</div>}
          {loading ? (
            <div className="text-muted text-sm text-center py-16">Loading…</div>
          ) : list.length === 0 ? (
            <EmptyState filter={search ? 'search' : isSaved ? 'saved' : filter} />
          ) : (
            list.map((n) => (
              <NoteCard
                key={n.id}
                note={n}
                onToggleDone={toggleDone}
                onTogglePin={togglePin}
                onDelete={remove}
                onUpdate={update}
              />
            ))
          )}
        </main>
      </div>

      <button
        onClick={() => setView('capture')}
        aria-label="New note"
        className="press fixed bottom-6 right-1/2 translate-x-[210px] max-[480px]:right-5 max-[480px]:translate-x-0 z-30 h-14 w-14 rounded-full bg-accent text-white text-2xl grid place-items-center shadow-glow"
      >
        ＋
      </button>

      {overlays}
    </div>
  );
}

/* Saved-reel filter pills: watched state + platforms present. */
function SavedFilters({
  reels,
  active,
  onChange,
}: {
  reels: Note[];
  active: string;
  onChange: (f: string) => void;
}) {
  const platforms = Array.from(new Set(reels.map((n) => n.meta.platform ?? 'link')));
  const smart: { id: string; label: string; icon: string }[] = [
    { id: 'all', label: 'All', icon: '🎬' },
    { id: 'unwatched', label: 'To watch', icon: '🔵' },
    { id: 'watched', label: 'Watched', icon: '✅' },
  ];
  const pill = (id: string, label: string, icon: string) => {
    const on = active === id;
    return (
      <button
        key={id}
        onClick={() => onChange(id)}
        className={`press shrink-0 rounded-full px-3.5 py-1.5 text-sm border whitespace-nowrap ${
          on ? 'bg-accent text-white border-accent shadow-glow' : 'bg-surface text-muted border-hairline'
        }`}
      >
        <span className="mr-1">{icon}</span>
        {label}
      </button>
    );
  };
  return (
    <div className="flex gap-2 overflow-x-auto px-4 py-2 -mx-0.5">
      {smart.map((s) => pill(s.id, s.label, s.icon))}
      {platforms.map((p) => pill(`plat:${p}`, PLATFORM_META[p]?.label ?? p, PLATFORM_META[p]?.icon ?? '🔗'))}
    </div>
  );
}
