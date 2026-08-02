-- SpaceEdu platform JSON stores (handbook, future admin blobs)
-- Run in Supabase → SQL Editor

create table if not exists public.platform_data (
  key text primary key,
  data jsonb not null,
  updated_at timestamptz not null default now()
);

alter table public.platform_data enable row level security;

-- Public read for exam calculator (anon key)
create policy "platform_data_public_read"
  on public.platform_data
  for select
  to anon, authenticated
  using (true);

-- Writes use service role key from admin API routes (bypasses RLS)

create index if not exists platform_data_updated_at_idx
  on public.platform_data (updated_at desc);
