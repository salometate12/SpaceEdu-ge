-- The user's own data (subjects, calendar, study plan, …) on their account,
-- so it follows them to every device. Run in Supabase → SQL Editor.
--
-- One row per user and key; `value` is that key's JSON document, the same
-- one the app keeps in localStorage (src/lib/user-data-keys.ts lists the
-- keys). Only study data: never passwords, tokens or payment details.

create table if not exists public.user_data (
  user_id uuid not null references auth.users on delete cascade,
  key text not null check (char_length(key) between 1 and 200),
  value jsonb not null check (octet_length(value::text) <= 1048576),
  updated_at timestamptz not null default now(),
  primary key (user_id, key)
);

-- The server's clock, never the device's: every write gets now(), so
-- "which copy is newer" doesn't depend on a phone's wrong time.
create or replace function public.user_data_touch()
returns trigger
language plpgsql
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists user_data_touch on public.user_data;
create trigger user_data_touch
  before insert or update on public.user_data
  for each row execute function public.user_data_touch();

-- Row level security: a user sees and changes only their own rows.
alter table public.user_data enable row level security;

drop policy if exists "user_data_select_own" on public.user_data;
create policy "user_data_select_own"
  on public.user_data for select
  to authenticated
  using (user_id = auth.uid());

drop policy if exists "user_data_insert_own" on public.user_data;
create policy "user_data_insert_own"
  on public.user_data for insert
  to authenticated
  with check (user_id = auth.uid());

drop policy if exists "user_data_update_own" on public.user_data;
create policy "user_data_update_own"
  on public.user_data for update
  to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

drop policy if exists "user_data_delete_own" on public.user_data;
create policy "user_data_delete_own"
  on public.user_data for delete
  to authenticated
  using (user_id = auth.uid());

-- No access at all for signed-out visitors.
revoke all on public.user_data from anon;
grant select, insert, update, delete on public.user_data to authenticated;
