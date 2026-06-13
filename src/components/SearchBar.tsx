export default function SearchBar({
  value,
  onChange,
}: {
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="px-4">
      <div className="flex items-center gap-2 rounded-xl bg-surface border border-hairline px-3 py-2">
        <span className="text-muted text-sm">🔍</span>
        <input
          type="search"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Search notes, #tags, categories…"
          className="flex-1 bg-transparent outline-none text-ink placeholder:text-muted text-sm"
        />
        {value && (
          <button onClick={() => onChange('')} className="press text-muted text-sm" aria-label="Clear">
            ✕
          </button>
        )}
      </div>
    </div>
  );
}
