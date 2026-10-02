-- Extra book details (all optional). Safe to re-run.
alter table books add column if not exists isbn text;
alter table books add column if not exists pages integer check (pages is null or pages > 0);
alter table books add column if not exists language text;
alter table books add column if not exists published_year integer check (published_year is null or published_year between 1400 and 2200);
alter table books add column if not exists binding text;
alter table books add column if not exists translator text;

alter table books drop constraint if exists books_language_check;
alter table books add constraint books_language_check check (language is null or language in ('si', 'en', 'ta'));
