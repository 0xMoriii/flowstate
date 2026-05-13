-- Flowstate: one row per user for trades, discipline_notes, and models (JSON).
-- Run this in Supabase SQL Editor (Dashboard → SQL Editor → New query).

create table if not exists public.user_data (
  id uuid primary key default gen_random_uuid(),
  user_id text not null unique,
  trades jsonb default '[]'::jsonb,
  discipline_notes jsonb default '{}'::jsonb,
  models jsonb default '[]'::jsonb,
  theme text,
  user_has_imported boolean default false,
  updated_at timestamptz default now()
);

-- RLS: users can only read/write their own row.
alter table public.user_data enable row level security;

create policy "Users can read own user_data"
  on public.user_data for select
  using (auth.uid()::text = user_id);

create policy "Users can insert own user_data"
  on public.user_data for insert
  with check (auth.uid()::text = user_id);

create policy "Users can update own user_data"
  on public.user_data for update
  using (auth.uid()::text = user_id)
  with check (auth.uid()::text = user_id);

-- Optional: allow delete (e.g. “delete my account data”).
create policy "Users can delete own user_data"
  on public.user_data for delete
  using (auth.uid()::text = user_id);
