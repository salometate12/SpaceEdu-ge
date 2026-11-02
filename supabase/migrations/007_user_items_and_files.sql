-- Everything a student makes follows the account, however much of it there is.
-- Run in Supabase → SQL Editor (after 006_subject_files.sql).
--
-- 1. user_items: the growing lists (decks, quizzes and their attempts,
--    conspectus, AI conversations, assignments, a subject's topics and
--    files, flashcard progress, lecture notes, the activity log…), one row
--    per item instead of one user_data row per list. A user_data value is
--    capped at 1 MB, and fifteen 50-card Georgian decks already pass it;
--    one row per item has no such ceiling and only what changed is sent.
--    The app moves a list's old user_data row here on its next sign-in.
--
-- 2. user-files: one private bucket for every file a student uploads (the
--    dashboard's important documents and „ჩემი საგნები“), each in their own
--    folder: user-files/<user_id>/documents/… and <user_id>/subjects/….
--    Files already in subject-files (006) stay readable there.

create table if not exists public.user_items (
  user_id uuid not null references auth.users on delete cascade,
  collection text not null check (char_length(collection) between 1 and 200),
  item_id text not null check (char_length(item_id) between 1 and 200),
  -- Where the item sits in its list, counted from the end (new items go first).
  position integer not null default 0,
  data jsonb not null check (octet_length(data::text) <= 2097152),
  updated_at timestamptz not null default now(),
  primary key (user_id, collection, item_id)
);

create index if not exists user_items_user_collection on public.user_items (user_id, collection);

create or replace function public.user_items_touch()
returns trigger
language plpgsql
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists user_items_touch on public.user_items;
create trigger user_items_touch
  before insert or update on public.user_items
  for each row execute function public.user_items_touch();

alter table public.user_items enable row level security;

drop policy if exists "user_items_select_own" on public.user_items;
create policy "user_items_select_own"
  on public.user_items for select
  to authenticated
  using (user_id = auth.uid());

drop policy if exists "user_items_insert_own" on public.user_items;
create policy "user_items_insert_own"
  on public.user_items for insert
  to authenticated
  with check (user_id = auth.uid());

drop policy if exists "user_items_update_own" on public.user_items;
create policy "user_items_update_own"
  on public.user_items for update
  to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

drop policy if exists "user_items_delete_own" on public.user_items;
create policy "user_items_delete_own"
  on public.user_items for delete
  to authenticated
  using (user_id = auth.uid());

revoke all on public.user_items from anon;
grant select, insert, update, delete on public.user_items to authenticated;

insert into storage.buckets (id, name, public, file_size_limit)
values ('user-files', 'user-files', false, 20971520) -- 20 MB a file
on conflict (id) do update
  set public = excluded.public,
      file_size_limit = excluded.file_size_limit;

drop policy if exists "user_files_select_own" on storage.objects;
create policy "user_files_select_own"
  on storage.objects for select
  to authenticated
  using (bucket_id = 'user-files' and (storage.foldername(name))[1] = auth.uid()::text);

drop policy if exists "user_files_insert_own" on storage.objects;
create policy "user_files_insert_own"
  on storage.objects for insert
  to authenticated
  with check (bucket_id = 'user-files' and (storage.foldername(name))[1] = auth.uid()::text);

drop policy if exists "user_files_update_own" on storage.objects;
create policy "user_files_update_own"
  on storage.objects for update
  to authenticated
  using (bucket_id = 'user-files' and (storage.foldername(name))[1] = auth.uid()::text)
  with check (bucket_id = 'user-files' and (storage.foldername(name))[1] = auth.uid()::text);

drop policy if exists "user_files_delete_own" on storage.objects;
create policy "user_files_delete_own"
  on storage.objects for delete
  to authenticated
  using (bucket_id = 'user-files' and (storage.foldername(name))[1] = auth.uid()::text);
