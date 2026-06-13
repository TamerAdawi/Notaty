// Date helpers for due-date chips and Today/Upcoming filters.

function startOfDay(d: Date): Date {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

export function dayDiff(iso: string): number {
  const today = startOfDay(new Date());
  const due = startOfDay(new Date(iso));
  return Math.round((+due - +today) / 86_400_000);
}

/** Whole days since a timestamp (for staleness/review). */
export function daysSince(iso: string): number {
  return Math.floor((Date.now() - new Date(iso).getTime()) / 86_400_000);
}

/** Compact age label: "3d", "2w", "4mo". */
export function ageLabel(iso: string): string {
  const d = daysSince(iso);
  if (d < 1) return 'today';
  if (d < 7) return `${d}d`;
  if (d < 30) return `${Math.floor(d / 7)}w`;
  return `${Math.floor(d / 30)}mo`;
}

export function isToday(iso: string | null): boolean {
  return iso != null && dayDiff(iso) === 0;
}

export function isUpcoming(iso: string | null): boolean {
  return iso != null && dayDiff(iso) > 0;
}

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

function timePart(d: Date): string {
  const h = d.getHours();
  const m = d.getMinutes();
  if (h === 9 && m === 0) return ''; // 9:00 is our "no explicit time" default → hide it
  const ampm = h >= 12 ? 'pm' : 'am';
  const hr = h % 12 || 12;
  return ` ${hr}${m ? ':' + String(m).padStart(2, '0') : ''}${ampm}`;
}

export interface DueInfo {
  label: string;
  overdue: boolean;
  today: boolean;
}

export function formatDue(iso: string | null): DueInfo | null {
  if (!iso) return null;
  const d = new Date(iso);
  const diff = dayDiff(iso);
  let day: string;
  if (diff === 0) day = 'Today';
  else if (diff === 1) day = 'Tomorrow';
  else if (diff === -1) day = 'Yesterday';
  else if (diff > 1 && diff < 7) day = WEEKDAYS[d.getDay()];
  else day = `${MONTHS[d.getMonth()]} ${d.getDate()}`;
  return {
    label: day + timePart(d),
    overdue: diff < 0,
    today: diff === 0,
  };
}
