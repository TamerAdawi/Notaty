// Notaty — smart parsing engine (TypeScript port, extended to 8 note types).
// Takes raw text the user dumps and infers structure. Runs fully on-device.

export type NoteType =
  | 'reel'
  | 'reminder'
  | 'event'
  | 'list'
  | 'question'
  | 'goal'
  | 'task'
  | 'idea'
  | 'note';

export type Priority = 'normal' | 'high' | 'urgent';

export interface ChecklistItem {
  text: string;
  done: boolean;
}

export interface NoteMeta {
  items?: ChecklistItem[]; // list / checklist
  goalTarget?: string; // goal — the raw target phrase ("run 5k")
  goalProgress?: number; // goal — 0..100
  location?: string; // event — "at <place>"
  url?: string; // reel / saved link
  platform?: string; // reel — instagram | tiktok | facebook | youtube | link
}

export interface ParsedNote {
  content: string;
  type: NoteType;
  category: string;
  due_date: string | null; // ISO
  priority: Priority;
  tags: string[];
  meta: NoteMeta;
}

/* ------------------------- category rules ------------------------- */

interface CategoryRule {
  name: string;
  icon: string;
  words: string[];
}

const CATEGORY_RULES: CategoryRule[] = [
  { name: 'Work', icon: '💼', words: ['meeting', 'client', 'project', 'deadline', 'boss', 'report', 'presentation', 'office', 'team', 'deploy', 'invoice', 'standup', 'sprint', 'jira', 'ticket', 'email', 'colleague', 'manager', 'demo', 'launch', 'shift', 'work', 'اجتماع', 'عمل', 'مشروع', 'دوام'] },
  { name: 'Health', icon: '🩺', words: ['doctor', 'dentist', 'gym', 'workout', 'medicine', 'pills', 'pill', 'meds', 'run', 'running', 'exercise', 'water', 'sleep', 'therapy', 'clinic', 'hospital', 'vitamins', 'training', 'physio', 'صحة', 'طبيب', 'دكتور', 'نادي', 'تمرين', 'دواء'] },
  { name: 'Shopping', icon: '🛒', words: ['buy', 'groceries', 'grocery', 'milk', 'eggs', 'bread', 'store', 'order', 'amazon', 'shopping', 'cart', 'market', 'supermarket', 'shop', 'اشتري', 'تسوق', 'سوق', 'بقالة'] },
  { name: 'Finance', icon: '💰', words: ['pay', 'bill', 'bills', 'rent', 'money', 'bank', 'budget', 'tax', 'taxes', 'salary', 'transfer', 'loan', 'subscription', 'renew', 'فاتورة', 'ايجار', 'فلوس', 'بنك', 'راتب', 'ادفع'] },
  { name: 'Study', icon: '📚', words: ['study', 'exam', 'homework', 'read', 'course', 'learn', 'lecture', 'assignment', 'quiz', 'test', 'revise', 'revision', 'chapter', 'university', 'school', 'دراسة', 'امتحان', 'مذاكرة', 'محاضرة', 'واجب', 'اقرأ'] },
  { name: 'Home', icon: '🏠', words: ['clean', 'laundry', 'fix', 'repair', 'kitchen', 'garden', 'cook', 'dishes', 'vacuum', 'trash', 'tidy', 'wash', 'plumber', 'electrician', 'بيت', 'تنظيف', 'غسيل', 'مطبخ', 'صلح'] },
  { name: 'Travel', icon: '✈️', words: ['flight', 'hotel', 'trip', 'passport', 'visa', 'pack', 'packing', 'airport', 'ticket', 'booking', 'travel', 'vacation', 'holiday', 'سفر', 'رحلة', 'طيران', 'فندق', 'مطار', 'تذكرة'] },
  { name: 'Personal', icon: '🙂', words: ['mom', 'dad', 'family', 'friend', 'birthday', 'gift', 'call', 'wife', 'husband', 'kids', 'parents', 'anniversary', 'عائلة', 'صديق', 'هدية', 'اتصل', 'عيد ميلاد'] },
];

export const CATEGORY_META: Record<string, string> = {
  ...Object.fromEntries(CATEGORY_RULES.map((r) => [r.name, r.icon])),
  Ideas: '💡',
  Inbox: '📥',
};

// Order shown in the manual category picker.
export const CATEGORY_LIST: string[] = [
  'Inbox', 'Work', 'Personal', 'Ideas', 'Health', 'Shopping',
  'Finance', 'Study', 'Home', 'Travel',
];

export const TYPE_META: Record<NoteType, { icon: string; label: string }> = {
  reel: { icon: '🎬', label: 'Saved' },
  reminder: { icon: '⏰', label: 'Reminder' },
  event: { icon: '📅', label: 'Event' },
  list: { icon: '☑️', label: 'List' },
  question: { icon: '❓', label: 'Question' },
  goal: { icon: '🎯', label: 'Goal' },
  task: { icon: '✅', label: 'Task' },
  idea: { icon: '💡', label: 'Idea' },
  note: { icon: '📝', label: 'Note' },
};

/* --------------------------- word banks --------------------------- */

const ACTION_VERBS = ['buy', 'call', 'email', 'send', 'finish', 'do', 'fix', 'book', 'pay', 'schedule', 'submit', 'clean', 'wash', 'cook', 'order', 'renew', 'get', 'make', 'prepare', 'check', 'review', 'reply', 'meet', 'pick', 'go', 'text', 'message', 'اعمل', 'اتصل', 'اشتري', 'ادفع', 'راجع', 'ارسل'];
const TASK_PHRASES = ['need to', 'have to', 'must', 'todo', 'to-do', 'to do', 'لازم', 'يجب'];
const IDEA_WORDS = ['idea:', 'idea ', 'what if', 'maybe i', 'maybe we', 'concept', 'thought:', 'imagine', 'فكرة'];
const REMINDER_WORDS = ['remind me', 'reminder', "don't forget", 'dont forget', 'remember to', 'ذكرني', 'ذكّرني', 'تذكير', 'لا تنسى'];
const EVENT_WORDS = ['meeting', 'appointment', 'flight', 'dinner', 'lunch', 'breakfast', 'interview', 'party', 'wedding', 'conference', 'webinar', 'call with', 'date with', 'موعد', 'اجتماع', 'حفلة', 'مقابلة'];
const GOAL_WORDS = ['goal:', 'goal ', 'my goal', 'i want to', 'i wanna', 'aim to', 'aiming to', 'resolution', 'هدف', 'اريد ان', 'أريد أن'];
const QUESTION_STARTS = ['what', 'how', 'why', 'when', 'where', 'who', 'which', 'should', 'can', 'could', 'would', 'is', 'are', 'do', 'does', 'did', 'will', 'هل', 'كيف', 'ليش', 'لماذا', 'متى', 'وين', 'اين', 'ماذا', 'شو'];

const URGENT_WORDS = ['urgent', 'asap', 'critical', 'emergency', 'عاجل', 'ضروري'];
const HIGH_WORDS = ['important', 'high priority', 'priority', "don't forget", 'مهم'];

const WEEKDAYS = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
const MONTHS = ['january', 'february', 'march', 'april', 'may', 'june', 'july', 'august', 'september', 'october', 'november', 'december'];

/* ----------------------------- helpers ---------------------------- */

function startOfDay(d: Date): Date {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

function extractTime(text: string): { h: number; m: number } | null {
  let m = text.match(/\b(?:at\s*)?(\d{1,2})(?::(\d{2}))?\s*(am|pm)\b/i);
  if (m) {
    let h = parseInt(m[1], 10);
    const min = m[2] ? parseInt(m[2], 10) : 0;
    const ap = m[3].toLowerCase();
    if (ap === 'pm' && h < 12) h += 12;
    if (ap === 'am' && h === 12) h = 0;
    return { h, m: min };
  }
  m = text.match(/\bat\s*(\d{1,2}):(\d{2})\b/);
  if (m) return { h: parseInt(m[1], 10), m: parseInt(m[2], 10) };
  return null;
}

function hasClockTime(text: string): boolean {
  return extractTime(text) !== null;
}

function applyTime(date: Date, text: string): Date {
  const t = extractTime(text);
  if (t) date.setHours(t.h, t.m, 0, 0);
  else date.setHours(9, 0, 0, 0);
  return date;
}

function parseDueDate(rawText: string): Date | null {
  const text = ' ' + rawText.toLowerCase() + ' ';
  const now = new Date();
  let base: Date | null = null;

  if (/\btoday\b|\btonight\b|اليوم/.test(text)) {
    base = startOfDay(now);
    if (/tonight/.test(text)) {
      base.setHours(20, 0, 0, 0);
      return base;
    }
  } else if (/\b(tomorrow|tmrw|tmw)\b|بكرة|غدا|غدًا/.test(text)) {
    base = startOfDay(now);
    base.setDate(base.getDate() + 1);
  } else if (/day after tomorrow|بعد بكرة|بعد غد/.test(text)) {
    base = startOfDay(now);
    base.setDate(base.getDate() + 2);
  } else if (/\bnext week\b|الأسبوع القادم|الاسبوع الجاي/.test(text)) {
    base = startOfDay(now);
    base.setDate(base.getDate() + 7);
  } else {
    const inDays = text.match(/\bin\s+(\d+)\s+(day|days|week|weeks)\b/);
    if (inDays) {
      const n = parseInt(inDays[1], 10) * (/week/.test(inDays[2]) ? 7 : 1);
      base = startOfDay(now);
      base.setDate(base.getDate() + n);
    }
    if (!base) {
      for (let i = 0; i < WEEKDAYS.length; i++) {
        if (new RegExp('\\b(?:on |next )?' + WEEKDAYS[i] + '\\b').test(text)) {
          base = startOfDay(now);
          const diff = (i - base.getDay() + 7) % 7 || 7;
          base.setDate(base.getDate() + diff);
          break;
        }
      }
    }
    if (!base) {
      // "5 august" / "august 5"
      for (let i = 0; i < MONTHS.length; i++) {
        const re = new RegExp('\\b(?:(\\d{1,2})\\s+' + MONTHS[i] + '|' + MONTHS[i] + '\\s+(\\d{1,2}))\\b');
        const mm = text.match(re);
        if (mm) {
          const day = parseInt(mm[1] || mm[2], 10);
          const d = new Date(now.getFullYear(), i, day);
          if (d < startOfDay(now)) d.setFullYear(d.getFullYear() + 1);
          base = startOfDay(d);
          break;
        }
      }
    }
    if (!base) {
      const dm = text.match(/\b(\d{1,2})[/\-](\d{1,2})(?:[/\-](\d{2,4}))?\b/);
      if (dm) {
        const day = parseInt(dm[1], 10);
        const mon = parseInt(dm[2], 10) - 1;
        let yr = dm[3] ? parseInt(dm[3], 10) : now.getFullYear();
        if (yr < 100) yr += 2000;
        const d = new Date(yr, mon, day);
        if (!isNaN(d.getTime())) base = startOfDay(d);
      }
    }
  }

  if (!base) {
    // A bare clock time ("at 9pm") with no day → assume today, rolling to
    // tomorrow if that time has already passed. Helps reminders & events.
    if (extractTime(text)) {
      base = startOfDay(now);
      const withTime = applyTime(new Date(base), text);
      if (withTime.getTime() < now.getTime()) base.setDate(base.getDate() + 1);
      return applyTime(base, text);
    }
    return null;
  }
  return applyTime(base, text);
}

function includesAny(haystack: string, words: string[]): boolean {
  return words.some((w) => haystack.includes(w));
}

function startsWithActionVerb(text: string): boolean {
  const first = text.trim().toLowerCase().replace(/^to\s+/, '').split(/\s+/)[0] || '';
  const bare = first.replace(/[^\p{L}]/gu, '');
  return ACTION_VERBS.includes(bare);
}

function detectCategory(text: string, type: NoteType): string {
  const lower = ' ' + text.toLowerCase() + ' ';
  let best: CategoryRule | null = null;
  let bestScore = 0;
  for (const rule of CATEGORY_RULES) {
    let score = 0;
    for (const w of rule.words) if (lower.includes(w)) score++;
    if (score > bestScore) {
      bestScore = score;
      best = rule;
    }
  }
  if (best) return best.name;
  if (type === 'idea') return 'Ideas';
  return 'Inbox';
}

function parseList(text: string): ChecklistItem[] | null {
  // "label: a, b, c"
  const colon = text.indexOf(':');
  if (colon !== -1) {
    const rest = text.slice(colon + 1);
    const parts = rest
      .split(/,|،|\n|·|;/)
      .map((s) => s.trim())
      .filter(Boolean);
    if (parts.length >= 2) return parts.map((t) => ({ text: t, done: false }));
  }
  // bullet / multiline list
  const lines = text
    .split('\n')
    .map((l) => l.replace(/^[-*•\s]+/, '').trim())
    .filter(Boolean);
  if (lines.length >= 2 && /^[-*•]/m.test(text)) {
    return lines.map((t) => ({ text: t, done: false }));
  }
  return null;
}

const URL_RE = /https?:\/\/[^\s]+/i;

const PLATFORMS: { id: string; test: RegExp }[] = [
  { id: 'instagram', test: /instagram\.com|instagr\.am/i },
  { id: 'tiktok', test: /tiktok\.com|vm\.tiktok\.com/i },
  { id: 'facebook', test: /facebook\.com|fb\.watch|fb\.com|m\.facebook/i },
  { id: 'youtube', test: /youtube\.com|youtu\.be/i },
];

export const PLATFORM_META: Record<string, { icon: string; label: string }> = {
  instagram: { icon: '📸', label: 'Instagram' },
  tiktok: { icon: '🎵', label: 'TikTok' },
  facebook: { icon: '📘', label: 'Facebook' },
  youtube: { icon: '▶️', label: 'YouTube' },
  link: { icon: '🔗', label: 'Link' },
};

export function detectPlatform(url: string): string {
  for (const p of PLATFORMS) if (p.test.test(url)) return p.id;
  return 'link';
}

function detectType(text: string): { type: NoteType; meta: NoteMeta } {
  const lower = ' ' + text.toLowerCase() + ' ';
  const trimmed = text.trim();

  // 0. Saved link / reel (Instagram, TikTok, Facebook, YouTube, or a bare URL)
  const urlMatch = trimmed.match(URL_RE);
  if (urlMatch) {
    const isBareUrl = /^https?:\/\/\S+$/i.test(trimmed);
    const known = PLATFORMS.some((p) => p.test.test(trimmed));
    if (isBareUrl || known) {
      return { type: 'reel', meta: { url: urlMatch[0], platform: detectPlatform(urlMatch[0]) } };
    }
  }

  // 1. Reminder
  if (includesAny(lower, REMINDER_WORDS)) return { type: 'reminder', meta: {} };

  // 2. List / checklist
  if (/\blist\b|قائمة|checklist/.test(lower) || /:\s*\S+\s*[,،]/.test(text) || /^[-*•]/m.test(text)) {
    const items = parseList(text);
    if (items) return { type: 'list', meta: { items } };
  }

  // 3. Question
  const firstWord = trimmed.toLowerCase().split(/\s+/)[0]?.replace(/[^\p{L}]/gu, '') || '';
  if (trimmed.endsWith('?') || (QUESTION_STARTS.includes(firstWord) && !startsWithActionVerb(text))) {
    return { type: 'question', meta: {} };
  }

  // 4. Goal
  if (includesAny(lower, GOAL_WORDS) || /\b(run|save|lose|read|learn|finish|reach|hit)\b.*\b\d+\s?(k|kg|km|lbs|books|\$|kg)?\b.*\b(by|before|this year|next year)\b/.test(lower)) {
    const target = trimmed.replace(/^goal:?\s*/i, '');
    return { type: 'goal', meta: { goalTarget: target, goalProgress: 0 } };
  }

  // 5. Event / appointment
  const hasDate = parseDueDate(text) !== null;
  if (includesAny(lower, EVENT_WORDS) || (hasDate && hasClockTime(text) && !startsWithActionVerb(text))) {
    const loc = text.match(/\bat\s+([A-Z][\w' ]+?)(?:\s+(?:on|at|tomorrow|today|\d)|$)/);
    const meta: NoteMeta = {};
    if (loc && !/\d/.test(loc[1])) meta.location = loc[1].trim();
    return { type: 'event', meta };
  }

  // 6. Task
  if (startsWithActionVerb(text) || includesAny(lower, TASK_PHRASES)) {
    return { type: 'task', meta: {} };
  }

  // 7. Idea
  if (includesAny(lower, IDEA_WORDS)) return { type: 'idea', meta: {} };

  // 8. Note (default)
  return { type: 'note', meta: {} };
}

function detectPriority(text: string): Priority {
  const lower = text.toLowerCase();
  if (includesAny(lower, URGENT_WORDS) || /!!+/.test(text)) return 'urgent';
  if (includesAny(lower, HIGH_WORDS) || /!\s*$/.test(text.trim())) return 'high';
  return 'normal';
}

function extractTags(text: string): string[] {
  const tags: string[] = [];
  const re = /#([\p{L}\p{N}_]+)/gu;
  let m: RegExpExecArray | null;
  while ((m = re.exec(text)) !== null) tags.push(m[1].toLowerCase());
  return tags;
}

/** Main entry point. */
export function parseNote(rawText: string): ParsedNote {
  const content = rawText.trim();
  const { type, meta } = detectType(content);
  // Reels are filed manually — keyword-guessing a category from a URL is just noise.
  const category = type === 'reel' ? 'Inbox' : detectCategory(content, type);
  // Goals are aspirations, not deadlines — don't attach a due date that would read as "overdue".
  const due = type === 'goal' ? null : parseDueDate(content);
  const priority = detectPriority(content);
  const tags = extractTags(content);
  return {
    content,
    type,
    category,
    due_date: due ? due.toISOString() : null,
    priority,
    tags,
    meta,
  };
}
