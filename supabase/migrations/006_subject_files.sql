-- „ჩემი საგნები“: the files a student uploads to a subject (lectures,
-- readings, assignments, presentations).
-- Run in Supabase → SQL Editor (after 004_presentations.sql).
--
-- The files live in a private bucket: subject-files/<user_id>/<subject_id>/<file_id>.
-- What's known about each file (name, kind, topics, due date) is kept with
-- the subject's topics in user_data (003), like the rest of the student's
-- data, so this migration only adds the bucket and its policies: each
-- student reads and writes inside their own folder, nobody else's.

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'subject-files',
  'subject-files',
  false,
  20971520, -- 20 MB a file; the per-subject total (SUBJECT_STORAGE_LIMIT_MB) is checked by the app.
  array[
    'application/pdf',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    'text/plain',
    'text/markdown',
    'image/png',
    'image/jpeg',
    'image/webp',
    'application/octet-stream'
  ]
)
on conflict (id) do update
  set public = excluded.public,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "subject_files_select_own" on storage.objects;
create policy "subject_files_select_own"
  on storage.objects for select
  to authenticated
  using (bucket_id = 'subject-files' and (storage.foldername(name))[1] = auth.uid()::text);

drop policy if exists "subject_files_insert_own" on storage.objects;
create policy "subject_files_insert_own"
  on storage.objects for insert
  to authenticated
  with check (bucket_id = 'subject-files' and (storage.foldername(name))[1] = auth.uid()::text);

drop policy if exists "subject_files_update_own" on storage.objects;
create policy "subject_files_update_own"
  on storage.objects for update
  to authenticated
  using (bucket_id = 'subject-files' and (storage.foldername(name))[1] = auth.uid()::text)
  with check (bucket_id = 'subject-files' and (storage.foldername(name))[1] = auth.uid()::text);

drop policy if exists "subject_files_delete_own" on storage.objects;
create policy "subject_files_delete_own"
  on storage.objects for delete
  to authenticated
  using (bucket_id = 'subject-files' and (storage.foldername(name))[1] = auth.uid()::text);
