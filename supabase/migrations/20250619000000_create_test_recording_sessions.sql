-- Flow recording sessions for /test-3 validation page.
-- Run manually in Supabase SQL editor or via `supabase db push` when ready.

create table if not exists public.test_recording_sessions (
  id uuid primary key default gen_random_uuid(),
  flow_name text not null,
  steps jsonb not null default '[]'::jsonb,
  locked boolean not null default false,
  created_at timestamptz not null default now()
);

-- Allow anon key access for the validation test page (adjust RLS as needed for production).
alter table public.test_recording_sessions enable row level security;

create policy "Allow anon read test_recording_sessions"
  on public.test_recording_sessions
  for select
  to anon
  using (true);

create policy "Allow anon insert test_recording_sessions"
  on public.test_recording_sessions
  for insert
  to anon
  with check (true);

create policy "Allow anon update test_recording_sessions"
  on public.test_recording_sessions
  for update
  to anon
  using (true)
  with check (true);
