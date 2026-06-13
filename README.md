# Notaty · نوتاتي

Dump whatever's on your mind into one box — Notaty auto-files it into the right **category**,
detects the **type**, parses a **due date** from natural language, sets **priority**, pulls out
**#tags**, and tracks **done / not done**. Built mobile-first as an installable iPhone PWA.

## The 8 note types (auto-detected)

| Type | Example you'd type | What it does |
|------|--------------------|--------------|
| ⏰ Reminder | `remind me to take meds at 9pm` | due time (today/tomorrow if passed) |
| 📅 Event | `team meeting Thursday 3pm at office` | date + time, location |
| ☑️ List | `groceries: milk, eggs, bread` | tickable sub-items |
| ❓ Question | `what's the best Supabase tier?` | answered / unanswered |
| 🎯 Goal | `goal: run 5k by August` | progress bar, never "overdue" |
| ✅ Task | `call dentist tomorrow 5pm !important` | done checkbox |
| 💡 Idea | `idea: app for splitting bills` | plain idea |
| 📝 Note | `the weather is nice today` | default |

Also understands Arabic cues (`بكرة`, `لازم`, `موعد`, `قائمة`, `هدف`, `ذكرني`…).
The composer shows a **live preview** of what it detected and lets you override the type with one tap.

## Tech

- **React + TypeScript + Vite**, **Tailwind** (Cinema-Dark theme), **vite-plugin-pwa** (offline + installable)
- **Supabase** (Postgres + auth) for private, synced storage — with an automatic **localStorage demo mode** when no keys are set
- On-device smart parser in `src/lib/parser.ts` (no AI calls, fully private)

## Run locally

```bash
npm install
npm run dev      # http://localhost:5173  (works immediately in offline demo mode)
```

Build / preview production:

```bash
npm run build
npm run preview
```

## Connect the database (Supabase) — ~3 minutes

1. Create a free project at <https://supabase.com>.
2. **SQL Editor → New query**, paste the contents of [`schema.sql`](schema.sql), **Run**.
   (Creates the `notes` table with per-user Row-Level Security.)
3. **Project Settings → API**, copy **Project URL** and the **anon public** key.
4. Copy `.env.example` to `.env.local` and fill them in:

   ```
   VITE_SUPABASE_URL=https://YOURPROJECT.supabase.co
   VITE_SUPABASE_ANON_KEY=eyJhbGc...
   ```

5. Restart `npm run dev`. The header badge flips from **⚲ Demo** to **☁ Synced**, and you'll get a
   sign-in / sign-up screen. Your notes are now private to your account and sync across devices.

## Deploy to the web (free) + install on iPhone

**Vercel (recommended):**

1. Push this folder to a GitHub repo (or use `vercel` CLI).
2. Import it at <https://vercel.com> — it auto-detects Vite (build `npm run build`, output `dist`).
3. Add the two env vars (`VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`) in the Vercel project settings.
4. Deploy → you get an `https://notaty-xxxx.vercel.app` URL.

**On your iPhone:** open that URL in **Safari** → tap **Share** → **Add to Home Screen**.
It launches full-screen like a native app, works offline, and syncs when online.

> Add your deployed URL to Supabase **Authentication → URL Configuration → Site URL** so email
> confirmation links point back to your app.

## Project layout

```
src/
  lib/parser.ts     smart parser (8 types, categories, NL dates, priority, tags)
  lib/db.ts         data layer (Supabase ↔ localStorage)
  lib/supabase.ts   client from env
  lib/format.ts     due-date formatting
  hooks/            useAuth, useNotes
  components/       AuthScreen, Composer, NoteCard, FilterBar, SearchBar, MenuSheet, EmptyState
schema.sql          Supabase table + RLS
scripts/generate-icons.mjs   regenerates PWA icons
```

## Export

Menu (⋯) → **Export notes (JSON)** downloads a full backup any time.
