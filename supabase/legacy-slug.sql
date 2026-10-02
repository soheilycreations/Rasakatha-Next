-- Old WooCommerce slug per book (audit/reference; redirects currently use the
-- bundled src/lib/data/legacy-slugs.json). Safe to re-run.
alter table books add column if not exists legacy_slug text;
create index if not exists books_legacy_slug_idx on books (legacy_slug);
