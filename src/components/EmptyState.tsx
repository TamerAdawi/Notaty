export default function EmptyState({ filter }: { filter: string }) {
  const map: Record<string, { icon: string; title: string; sub: string }> = {
    all: { icon: '🧠', title: 'A clear mind', sub: 'Type anything below — Notaty files it for you.' },
    today: { icon: '☀️', title: 'Nothing due today', sub: 'Enjoy the breathing room.' },
    upcoming: { icon: '🗓', title: 'No upcoming items', sub: 'Add a note with “tomorrow” or a date.' },
    done: { icon: '🎉', title: 'Nothing done yet', sub: 'Completed items will collect here.' },
    saved: { icon: '🎬', title: 'No saved links yet', sub: 'Paste a reel link from Instagram, TikTok or Facebook to save it.' },
  };
  const e = map[filter] ?? { icon: '🔍', title: 'No matches', sub: 'Try a different search or filter.' };
  return (
    <div className="flex flex-col items-center justify-center text-center px-8 py-20 animate-fade-up">
      <div className="text-5xl mb-3">{e.icon}</div>
      <h3 className="font-display text-lg font-semibold text-ink">{e.title}</h3>
      <p className="text-muted text-sm mt-1">{e.sub}</p>
    </div>
  );
}
