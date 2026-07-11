<div align="center">

<img src="public/apple-touch-icon.png" width="96" height="96" alt="Notaty logo" />

# Notaty · نوتاتي

**Dump whatever's on your mind — Notaty figures out what it is and files it for you.**

A smart, bilingual (English + Arabic) notes PWA that reads free‑form text and turns it into
structured tasks, reminders, lists, goals, saved reels, wish‑list items and more — then reminds
you at the right time. Installs on your phone like a native app.

[**▶ Live app**](https://notaty-delta.vercel.app) · installable on iOS/Android home screen

![React](https://img.shields.io/badge/React-18-61DAFB?logo=react&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?logo=typescript&logoColor=white)
![Vite](https://img.shields.io/badge/Vite-6-646CFF?logo=vite&logoColor=white)
![Tailwind](https://img.shields.io/badge/Tailwind-3-06B6D4?logo=tailwindcss&logoColor=white)
![Supabase](https://img.shields.io/badge/Supabase-Postgres%20%2B%20Auth-3ECF8E?logo=supabase&logoColor=white)
![Vercel](https://img.shields.io/badge/Vercel-Serverless-000?logo=vercel&logoColor=white)
![PWA](https://img.shields.io/badge/PWA-installable%20%2B%20push-5A0FC8?logo=pwa&logoColor=white)

</div>

---

## Why it exists

I capture thoughts, tasks and ideas all day — mostly in Arabic — and the stock Notes app just
piles them up until they rot. Notaty replaces that with **one capture box** that understands what
you wrote and routes it to the right place, plus reminders so nothing slips.

## Highlights

- 🧠 **On‑device NLP parser** — classifies each note into one of **11 types** and extracts a **due date, time, priority and #tags** from plain text. **No AI API calls** — it's a fast, private, rule‑based engine.
- 🌍 **Bilingual by design** — full **Levantine Arabic** support: imperative verbs, weekday names (incl. fused forms like `للجمعة`), **spelled‑out clock times** (`الساعة وحدة`, `ثنتين ونص`, `الا ربع`), and a trailing ✅ that marks a note done.
- 🔔 **Real push notifications** on iPhone — recurring reminders, events, and a weekly digest, delivered via **Web Push** (VAPID) to the installed PWA.
- 📲 **Share‑to‑save** — an iOS Shortcut posts Instagram/TikTok/Facebook reels straight into the app with no copy‑paste, via a serverless ingest endpoint.
- 🗂️ **Purpose‑built sections** — Notes, 🎬 Saved reels, 🚀 Hustle ideas, 🛍️ Wish list (with running total), and 🔄 “Since when?” (a recurring‑cycle tracker with overdue nudges).
- 🕰️ **Review & resurface** — stale, untouched items bubble up for one‑tap *keep / do / drop* triage so nothing you wrote gets forgotten.
- 📴 **Offline‑first PWA** — installable, works offline, dark/light themes, per‑user privacy.

## The 11 auto‑detected types

| Type | You type… | It becomes |
|------|-----------|------------|
| ✅ Task | `call dentist tomorrow 5pm !important` | task · due tomorrow 17:00 · high |
| ⏰ Reminder | `ذكرني بكرا الساعة وحدة` | reminder · tomorrow 13:00 (fires a push) |
| 📅 Event | `team meeting Thursday 3pm at office` | event · date/time · location |
| ☑️ List | `groceries: milk, eggs, bread` | list with tickable items |
| ❓ Question | `what's the best Supabase tier?` | answered / unanswered |
| 🎯 Goal | `goal: run 5k by August` | progress bar, never “overdue” |
| 💡 Idea | `idea: app for splitting bills` | plain idea |
| 🚀 Hustle | `side hustle: sell planners on Etsy` | money‑making idea (own section) |
| 🛍️ Wish | *(via form)* item + price | wish‑list item + running total |
| 🎬 Saved | any reel/video link | platform badge · watched toggle |
| 📝 Note | `the weather is nice today` | default |

The composer shows a **live preview** of what it detected and lets you override the type with one tap.

## Architecture

```
iPhone PWA  ──►  React + TS + Vite (Tailwind)          ← installable, offline (Workbox SW)
                    │  on-device parser (src/lib/parser.ts)
                    ▼
                 Supabase  ── Postgres + Row-Level Security + Auth   ← private, synced
                    ▲
   iOS Shortcut ─┐  │            Vercel serverless functions
   (share sheet)  └─┼──►  /api/save     ingest shared reels (per-user token)
                    ├──►  /api/cron      reminders · weekly digest · overdue cycles
   pg_cron ────────►┘     /api/push-test send a test Web Push
                          (web-push / VAPID → installed PWAs)
```

**Stack:** React 18 · TypeScript · Vite · Tailwind · `vite-plugin-pwa` (Workbox) · Supabase
(Postgres, Auth, RLS, `pg_cron` + `pg_net`) · Vercel serverless functions · `web-push` (VAPID).

**Notable engineering:**
- A dependency‑free bilingual parser (`src/lib/parser.ts`): type detection, natural‑language date/time (EN + Arabic numerals & words), categories, priority, tags.
- Web Push end‑to‑end: service‑worker handlers, VAPID subscriptions, a scheduler (`pg_cron` → serverless) that fires due reminders + a weekly digest and marks them sent (no duplicates).
- Row‑Level Security so every table is private per user; a capability‑scoped token lets the share endpoint attribute a reel to the right account without exposing credentials.

## Run it yourself

```bash
npm install
npm run dev          # http://localhost:5173  — runs instantly in offline demo mode
```

To enable cloud sync, create a free [Supabase](https://supabase.com) project, run
[`schema.sql`](schema.sql) in its SQL editor, and put your Project URL + anon key in `.env.local`
(see [`.env.example`](.env.example)). Deploy free to Vercel and add the same env vars.

## Project layout

```
src/
  lib/parser.ts        bilingual NLP engine (types, NL dates/times, priority, tags)
  lib/db.ts            data layer (Supabase ↔ localStorage demo fallback)
  lib/since.ts         "Since when?" cycle tracker
  lib/calendar.ts      .ics "Add to Calendar"
  hooks/               useAuth · useNotes · useSince
  components/          Composer, NoteCard, sections (since / wish), setup modals, …
api/                   Vercel functions: save · cron · push-test
public/push-sw.js      Web Push service-worker handlers
schema.sql             Postgres tables, RLS policies, views
```

## License

MIT © [Tamer Adawi](https://github.com/TamerAdawi)
