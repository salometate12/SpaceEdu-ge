-- „ჩემი პრეზენტაციები“ on the account: every presentation on every device.
-- Run in Supabase → SQL Editor (after 003_user_data.sql).
--
-- One row per presentation (its slides, form and answers as JSON — the same
-- record the app keeps in IndexedDB), and its photos as files in a private
-- bucket: presentation-photos/<user_id>/<presentation_id>/<photo_id>.
-- Kept apart from user_data so the app's regular sync doesn't carry whole
-- presentations around on every pull.

create table if not exists public.user_presentations (
  user_id uuid not null references auth.users on delete cascade,
  id text not null check (char_length(id) between 1 and 100),
  data jsonb not null check (octet_length(data::text) <= 2097152),
  updated_at timestamptz not null default now(),
  primary key (user_id, id)
);

create or replace function public.user_presentations_touch()
returns trigger
language plpgsql
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists user_presentations_touch on public.user_presentations;
create trigger user_presentations_touch
  before insert or update on public.user_presentations
  for each row execute function public.user_presentations_touch();

alter table public.user_presentations enable row level security;

drop policy if exists "user_presentations_select_own" on public.user_presentations;
create policy "user_presentations_select_own"
  on public.user_presentations for select
  to authenticated
  using (user_id = auth.uid());

drop policy if exists "user_presentations_insert_own" on public.user_presentations;
create policy "user_presentations_insert_own"
  on public.user_presentations for insert
  to authenticated
  with check (user_id = auth.uid());

drop policy if exists "user_presentations_update_own" on public.user_presentations;
create policy "user_presentations_update_own"
  on public.user_presentations for update
  to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

drop policy if exists "user_presentations_delete_own" on public.user_presentations;
create policy "user_presentations_delete_own"
  on public.user_presentations for delete
  to authenticated
  using (user_id = auth.uid());

revoke all on public.user_presentations from anon;
grant select, insert, update, delete on public.user_presentations to authenticated;

-- Photos: a private bucket (unlike avatars, nobody else may read them).
-- Only inside your own folder: presentation-photos/<auth.uid()>/…
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('presentation-photos', 'presentation-photos', false, 5242880, array['image/webp', 'image/jpeg', 'image/png'])
on conflict (id) do update
  set public = excluded.public,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "presentation_photos_select_own" on storage.objects;
create policy "presentation_photos_select_own"
  on storage.objects for select
  to authenticated
  using (bucket_id = 'presentation-photos' and (storage.foldername(name))[1] = auth.uid()::text);

drop policy if exists "presentation_photos_insert_own" on storage.objects;
create policy "presentation_photos_insert_own"
  on storage.objects for insert
  to authenticated
  with check (bucket_id = 'presentation-photos' and (storage.foldername(name))[1] = auth.uid()::text);

drop policy if exists "presentation_photos_update_own" on storage.objects;
create policy "presentation_photos_update_own"
  on storage.objects for update
  to authenticated
  using (bucket_id = 'presentation-photos' and (storage.foldername(name))[1] = auth.uid()::text)
  with check (bucket_id = 'presentation-photos' and (storage.foldername(name))[1] = auth.uid()::text);

drop policy if exists "presentation_photos_delete_own" on storage.objects;
create policy "presentation_photos_delete_own"
  on storage.objects for delete
  to authenticated
  using (bucket_id = 'presentation-photos' and (storage.foldername(name))[1] = auth.uid()::text);
