// Seeds the localStorage backend with realistic bilingual sample data for the
// no-account demo, so the app never opens empty. Runs the sample text through the
// real parser so every card reflects genuine parser output.
import { parseNote } from './parser';
import type { Note } from './db';

const NOTES_KEY = 'notaty.notes.v1';
const SINCE_ITEMS_KEY = 'notaty.since.items.v1';

function daysAgo(n: number): string {
  return new Date(Date.now() - n * 86_400_000).toISOString();
}

function make(raw: string, over: Partial<Note>, createdDaysAgo: number): Note {
  const parsed = parseNote(raw);
  const ts = daysAgo(createdDaysAgo);
  return {
    ...parsed,
    id: crypto.randomUUID(),
    done: false,
    pinned: false,
    created_at: ts,
    updated_at: ts,
    ...over,
  };
}

export function seedDemo(force = false): void {
  try {
    if (!force && (localStorage.getItem(NOTES_KEY) || localStorage.getItem(SINCE_ITEMS_KEY))) return;

    const notes: Note[] = [
      // Notes & tasks — Arabic + English
      make('ذكّرني بكرا الساعة وحدة اتصل بالبنك', {}, 0),
      make('call the dentist tomorrow 5pm !important', {}, 0),
      make('اجتماع الفريق الخميس الساعة تسعة الصبح', {}, 1),
      make('groceries: milk, eggs, bread, coffee, olive oil', {}, 1),
      make('goal: run 5k by August', { meta: { goalProgress: 40 } }, 6),
      make('رتّب مكتب الشغل قبل الويك اند', {}, 2),
      make('what’s the best mechanical keyboard under 500?', {}, 3),
      make('idea: a weekend newsletter about local hiking trails', {}, 4),
      make('الطقس حلو اليوم، بدي اطلع مشوار عالبحر', {}, 0),
      make('اقرأ الفصل الثالث من كتاب الأنظمة', { done: true }, 5),
      make('idea: learn to sail next summer', {}, 30), // old → surfaces in Review

      // Saved reels (with a human description on top of the link)
      make('sourdough starter — no-knead method', {
        type: 'reel',
        content: 'sourdough starter — no-knead method',
        meta: { url: 'https://www.instagram.com/reel/CxSample1/', platform: 'instagram' },
      }, 2),
      make('10-minute weeknight pasta 🍝', {
        type: 'reel',
        content: '10-minute weeknight pasta',
        meta: { url: 'https://www.tiktok.com/@chef/video/7300000000000', platform: 'tiktok' },
      }, 3),
      make('React re-render deep dive', {
        type: 'reel',
        done: true,
        content: 'React re-render deep dive',
        meta: { url: 'https://youtu.be/dQw4w9WgXcQ', platform: 'youtube' },
      }, 8),

      // Hustle ideas
      make('side hustle: sell Notion templates online', {}, 4),
      make('بيزنس: قهوة مختصة اونلاين مع اشتراك شهري', {}, 7),

      // Bucket list
      make('see the northern lights in Iceland', { type: 'bucket', content: 'see the northern lights in Iceland' }, 9),
      make('learn to surf', { type: 'bucket', done: true, content: 'learn to surf' }, 30),
      make('زيارة اليابان في موسم الساكورا', { type: 'bucket', content: 'زيارة اليابان في موسم الساكورا' }, 12),

      // Wish list
      make('AirPods Pro', { type: 'wish', content: 'AirPods Pro', meta: { price: 999, currency: '₪' } }, 5),
      make('mechanical keyboard', { type: 'wish', content: 'Keychron K2 keyboard', meta: { price: 450, currency: '₪' } }, 6),
      make('standing desk', { type: 'wish', done: true, content: 'standing desk', meta: { price: 1200, currency: '₪' } }, 20),
    ];
    localStorage.setItem(NOTES_KEY, JSON.stringify(notes));

    // "Since when?" recurring items — created_at drives days-since / status colour
    const since = [
      { id: crypto.randomUUID(), name: 'Haircut', emoji: '💈', interval_days: 30, reminder_offset_days: 3, last_reminded_on: null, created_at: daysAgo(41) },
      { id: crypto.randomUUID(), name: 'Water the plants', emoji: '🌱', interval_days: 3, reminder_offset_days: 1, last_reminded_on: null, created_at: daysAgo(1) },
      { id: crypto.randomUUID(), name: 'Call grandma', emoji: '☎️', interval_days: 14, reminder_offset_days: 2, last_reminded_on: null, created_at: daysAgo(17) },
      { id: crypto.randomUUID(), name: 'Car oil change', emoji: '🛢️', interval_days: 180, reminder_offset_days: 14, last_reminded_on: null, created_at: daysAgo(96) },
    ];
    localStorage.setItem(SINCE_ITEMS_KEY, JSON.stringify(since));
  } catch {
    /* ignore storage errors */
  }
}
