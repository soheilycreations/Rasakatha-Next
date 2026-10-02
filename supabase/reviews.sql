-- Reader reviews (added Oct 2026). Run once in Supabase: SQL Editor -> New query -> paste -> Run.
create table if not exists reviews (
  id uuid primary key default gen_random_uuid(),
  book_id text not null references books(id) on delete cascade,
  user_id uuid not null,
  name text not null,
  rating integer not null check (rating between 1 and 5),
  text text not null,
  approved boolean not null default true,
  created_at timestamptz not null default now(),
  unique (book_id, user_id)
);
create index if not exists reviews_book_idx on reviews (book_id, created_at desc);
alter table reviews enable row level security;
