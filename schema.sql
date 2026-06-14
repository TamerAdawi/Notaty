-- Notaty database schema.
-- Run this once in your Supabase project:  Dashboard → SQL Editor → New query → paste → Run.

create table if not exists public.notes (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users (id) on delete cascade,
  content     text not null,
  type        text not null default 'note',      -- reminder|event|list|question|goal|task|idea|note
  category    text not null default 'Inbox',
  due_date    timestamptz,
  priority    text not null default 'normal',     -- normal | high | urgent
  tags        text[] default '{}',
  meta        jsonb not null default '{}',        -- type-specific: list items, goal progress, event location
  done        boolean not null default false,
  pinned      boolean not null default false,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create index if not exists notes_user_idx     on public.notes (user_id);
create index if not exists notes_due_idx       on public.notes (user_id, due_date);
create index if not exists notes_category_idx  on public.notes (user_id, category);

-- Row Level Security: a user can only ever touch their own notes.
alter table public.notes enable row level security;

drop policy if exists "own notes - select" on public.notes;
create policy "own notes - select" on public.notes
  for select using (auth.uid() = user_id);

drop policy if exists "own notes - insert" on public.notes;
create policy "own notes - insert" on public.notes
  for insert with check (auth.uid() = user_id);

drop policy if exists "own notes - update" on public.notes;
create policy "own notes - update" on public.notes
  for update using (auth.uid() = user_id);

drop policy if exists "own notes - delete" on public.notes;
create policy "own notes - delete" on public.notes
  for delete using (auth.uid() = user_id);

-- ---------------------------------------------------------------------------
-- Save tokens: a per-user secret used by the "Save to Notaty" share endpoint
-- (Apple Shortcut → /api/save) to attribute a shared link to the right user.
-- ---------------------------------------------------------------------------
create table if not exists public.save_tokens (
  token       uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users (id) on delete cascade,
  created_at  timestamptz not null default now(),
  unique (user_id)
);

alter table public.save_tokens enable row level security;

drop policy if exists "own token - select" on public.save_tokens;
create policy "own token - select" on public.save_tokens
  for select using (auth.uid() = user_id);

drop policy if exists "own token - insert" on public.save_tokens;
create policy "own token - insert" on public.save_tokens
  for insert with check (auth.uid() = user_id);

drop policy if exists "own token - delete" on public.save_tokens;
create policy "own token - delete" on public.save_tokens
  for delete using (auth.uid() = user_id);
