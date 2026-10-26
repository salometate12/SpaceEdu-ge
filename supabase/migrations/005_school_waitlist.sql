-- „შემატყობინე, როცა გაიხსნება“ on the closed school space.
-- Run in Supabase → SQL Editor (after 004_presentations.sql).
--
-- One row per signed-in user who asked to hear when the school space opens.
-- Users can add (and see) only their own row; reading the list is for the
-- service role.

create table if not exists public.school_waitlist (
  user_id uuid primary key references auth.users on delete cascade,
  email text check (email is null or char_length(email) <= 320),
  created_at timestamptz not null default now()
);

alter table public.school_waitlist enable row level security;

drop policy if exists "school_waitlist_select_own" on public.school_waitlist;
create policy "school_waitlist_select_own"
  on public.school_waitlist for select
  to authenticated
  using (user_id = auth.uid());

drop policy if exists "school_waitlist_insert_own" on public.school_waitlist;
create policy "school_waitlist_insert_own"
  on public.school_waitlist for insert
  to authenticated
  with check (user_id = auth.uid());

revoke all on public.school_waitlist from anon;
grant select, insert on public.school_waitlist to authenticated;
