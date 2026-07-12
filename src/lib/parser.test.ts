import { describe, it, expect } from 'vitest';
import { parseNote } from './parser';

/* helpers ----------------------------------------------------------- */
const type = (s: string) => parseNote(s).type;

function d(iso: string | null): Date {
  if (!iso) throw new Error('expected a due date, got null');
  return new Date(iso);
}
/** whole-day offset of a due date from today, in local time */
function dayOffset(iso: string | null): number {
  const due = d(iso);
  due.setHours(0, 0, 0, 0);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return Math.round((+due - +today) / 86_400_000);
}
/** offset of the next occurrence of a weekday (0=Sun), matching the parser rule */
function nextWeekday(target: number): number {
  return ((target - new Date().getDay() + 7) % 7) || 7;
}

/* 1. classification ------------------------------------------------- */
describe('classification — all types', () => {
  it('plain note is the fallback', () => {
    expect(type('the weather is nice today')).toBe('note');
    expect(type('الطقس حلو اليوم')).toBe('note');
  });

  it('tasks from action verbs (EN + AR)', () => {
    expect(type('call the dentist')).toBe('task');
    expect(type('fix the kitchen sink')).toBe('task');
    expect(type('اتصل بالبنك')).toBe('task');
    expect(type('رتّب المكتب')).toBe('task');
  });

  it('reminders', () => {
    expect(type('remind me to drink water')).toBe('reminder');
    expect(type("don't forget the passport")).toBe('reminder');
    expect(type('ذكّرني اشرب مي')).toBe('reminder');
    expect(type('تذكر توخذ الدواء')).toBe('reminder');
  });

  it('events', () => {
    expect(type('team meeting Thursday 3pm')).toBe('event');
    expect(type('dinner with Sara on Friday')).toBe('event');
    expect(type('اجتماع الفريق الخميس')).toBe('event');
  });

  it('lists with parsed items', () => {
    const p = parseNote('groceries: milk, eggs, bread');
    expect(p.type).toBe('list');
    expect(p.meta.items?.map((i) => i.text)).toEqual(['milk', 'eggs', 'bread']);
  });

  it('questions', () => {
    expect(type("what's the best Supabase tier?")).toBe('question');
    expect(type('how do I center a div')).toBe('question');
  });

  it('goals', () => {
    expect(type('goal: run 5k by August')).toBe('goal');
    expect(type('my goal is to read 12 books')).toBe('goal');
  });

  it('ideas', () => {
    expect(type('idea: an app for splitting bills')).toBe('idea');
    expect(type('فكرة: نشرة أسبوعية عن المشي')).toBe('idea');
  });

  it('hustle (money-making)', () => {
    expect(type('side hustle: sell Notion templates')).toBe('hustle');
    expect(type('passive income from dividends')).toBe('hustle');
    expect(type('بيزنس قهوة مختصة اونلاين')).toBe('hustle');
  });

  it('reels from links, with platform', () => {
    const ig = parseNote('https://www.instagram.com/reel/CxAbc123/');
    expect(ig.type).toBe('reel');
    expect(ig.meta.platform).toBe('instagram');
    expect(parseNote('https://vm.tiktok.com/ZM123/').meta.platform).toBe('tiktok');
    expect(parseNote('https://youtu.be/dQw4').meta.platform).toBe('youtube');
  });

  it('wish is NOT auto-detected from text (manual only)', () => {
    // a price-ish note must not silently become a wish
    expect(type('AirPods Pro 999')).not.toBe('wish');
  });
});

/* 2. ordering rules ------------------------------------------------- */
describe('ordering — reminder > event > task', () => {
  it('"remind me about the meeting" is a reminder, not an event', () => {
    expect(type('remind me about the meeting tomorrow 3pm')).toBe('reminder');
  });

  it('a dated meeting with no verb is an event', () => {
    expect(type('meeting tomorrow 3pm')).toBe('event');
  });

  it('a dated action verb is a task, not an event (would break if order flipped)', () => {
    expect(type('call dentist tomorrow 3pm')).toBe('task');
    expect(type('اتصل بالدكتور بكرا الساعة ثلاثة')).toBe('task');
  });

  it('hustle is checked before task', () => {
    expect(type('اعمل مشروع تجاري لبيع القهوة')).toBe('hustle');
    expect(type('start a business selling planners')).toBe('hustle');
  });

  it('task phrase beats a question word ("شو لازم اعرف")', () => {
    expect(type('شو لازم اعرف قبل السفر')).toBe('task');
  });
});

/* 3. arabic natural language ---------------------------------------- */
describe('arabic dates & times', () => {
  it('بكرا → tomorrow', () => {
    expect(dayOffset(parseNote('ذكّرني بكرا اتصل بالبنك').due_date)).toBe(1);
  });

  it('preposition-fused weekday للجمعة → next Friday', () => {
    expect(dayOffset(parseNote('ذكرني للجمعة الجاي').due_date)).toBe(nextWeekday(5));
  });

  it('spelled-out hour: الساعة وحدة → 13:00 (1–7 assumed PM)', () => {
    const due = d(parseNote('تذكر بكرا الساعة وحدة').due_date);
    expect(due.getHours()).toBe(13);
    expect(due.getMinutes()).toBe(0);
  });

  it('ثنتين ونص المسا → 14:30', () => {
    const due = d(parseNote('تذكر بكرا الساعة ثنتين ونص المسا').due_date);
    expect(due.getHours()).toBe(14);
    expect(due.getMinutes()).toBe(30);
  });

  it('الصبح forces AM: الساعة عشرة الصبح → 10:00', () => {
    expect(d(parseNote('تذكر بكرا الساعة عشرة الصبح').due_date).getHours()).toBe(10);
  });

  it('الا ربع (quarter-to): الساعة وحدة الا ربع → 12:45', () => {
    const due = d(parseNote('تذكر الساعة وحدة الا ربع').due_date);
    expect(due.getHours()).toBe(12);
    expect(due.getMinutes()).toBe(45);
  });

  it('✅ done marker sets done and is stripped from content', () => {
    const p = parseNote('خلصت التقرير ✅');
    expect(p.done).toBe(true);
    expect(p.content).not.toContain('✅');
    expect(p.content.trim()).toBe('خلصت التقرير');
  });
});

/* 4. english dates & times ------------------------------------------ */
describe('english dates & times', () => {
  it('"tomorrow 5pm" → +1 day at 17:00', () => {
    const p = parseNote('call the dentist tomorrow 5pm');
    expect(dayOffset(p.due_date)).toBe(1);
    expect(d(p.due_date).getHours()).toBe(17);
  });

  it('"at 9pm" → 21:00', () => {
    expect(d(parseNote('remind me to call mom at 9pm').due_date).getHours()).toBe(21);
  });

  it('weekday name → next occurrence', () => {
    expect(dayOffset(parseNote('meeting on Friday').due_date)).toBe(nextWeekday(5));
  });
});

/* 5. date rollover edge cases --------------------------------------- */
describe('date rollover edge cases', () => {
  it('a weekday that IS today rolls to next week (offset 7, never 0)', () => {
    const todayName = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'][
      new Date().getDay()
    ];
    expect(dayOffset(parseNote(`gym on ${todayName}`).due_date)).toBe(7);
  });

  it('"in 40 days" crosses month boundaries correctly', () => {
    expect(dayOffset(parseNote('renew passport in 40 days').due_date)).toBe(40);
  });

  it('a bare time already past today rolls to tomorrow', () => {
    const target = new Date();
    target.setHours(1, 0, 0, 0); // 1am
    const expected = +target < Date.now() ? 1 : 0;
    const p = parseNote('remind me at 1am');
    expect(d(p.due_date).getHours()).toBe(1);
    expect(dayOffset(p.due_date)).toBe(expected);
  });
});

/* 6. garbage / fall-through ----------------------------------------- */
describe('garbage input falls through to a plain note with no due date', () => {
  it.each(['', 'asdfghjkl qwerty', '🎉🎉🎉', '   '])('%j → note', (input) => {
    const p = parseNote(input);
    expect(p.type).toBe('note');
    expect(p.due_date).toBeNull();
  });
});

/* 7. priority, tags, category --------------------------------------- */
describe('priority, tags, category', () => {
  it('priority from cues', () => {
    expect(parseNote('finish the report !!').priority).toBe('urgent');
    expect(parseNote('call the client urgent').priority).toBe('urgent');
    expect(parseNote('buy milk !important').priority).toBe('high');
    expect(parseNote('water the plants').priority).toBe('normal');
  });

  it('extracts #tags lowercased', () => {
    expect(parseNote('review PR #Work #Frontend').tags).toEqual(['work', 'frontend']);
  });

  it('categorises by keyword (EN + AR)', () => {
    expect(parseNote('call the dentist').category).toBe('Health');
    expect(parseNote('pay the rent').category).toBe('Finance');
    expect(parseNote('study for the exam').category).toBe('Study');
    expect(parseNote('روح عالنادي').category).toBe('Health');
  });

  it('does not mis-file "اعمل" as Work (the عمل substring collision)', () => {
    // اعمل ("do") contains عمل ("work") — must not force the Work category
    expect(parseNote('اعمل بوست عن السفر').category).not.toBe('Work');
    // but a real work word still lands in Work
    expect(parseNote('دوام بكرا الصبح').category).toBe('Work');
  });
});
