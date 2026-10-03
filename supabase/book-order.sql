-- Real publish date + "our own title" flag. Safe to re-run.
-- Run BEFORE supabase/data/book-data.sql (which backfills both columns from the old WooCommerce data).
alter table books add column if not exists published_at timestamptz not null default now();
alter table books add column if not exists is_own_title boolean not null default false;
create index if not exists books_published_at_idx on books (published_at desc);
create index if not exists books_is_own_title_idx on books (is_own_title) where is_own_title;
