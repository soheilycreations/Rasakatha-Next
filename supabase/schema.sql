-- Run this once in Supabase: SQL Editor -> New query -> paste -> Run.

create table if not exists books (
  id text primary key,
  title text not null,
  author text not null default '',
  publisher text,
  category text not null default 'Other',
  regular_price numeric not null default 0,
  sale_price numeric,
  on_sale boolean not null default false,
  in_stock boolean not null default true,
  rating numeric not null default 0,
  blurb text not null default '',
  cover text,
  weight integer not null default 303,
  created_at timestamptz not null default now()
);

create table if not exists orders (
  id text primary key,
  created_at timestamptz not null default now(),
  items jsonb not null,
  subtotal numeric not null,
  delivery_fee numeric not null,
  total numeric not null,
  payment text not null,
  status text not null default 'processing',
  customer jsonb not null
);
create index if not exists orders_created_at_idx on orders (created_at desc);

create table if not exists hero_slides (
  id text primary key,
  title text not null,
  cover text not null default '',
  author text,
  price numeric,
  position integer not null default 0
);

create table if not exists author_meta (
  name text primary key,
  bio text not null default '',
  photo text not null default ''
);

create table if not exists category_meta (
  name text primary key,
  image text not null default '',
  order_index integer not null default 999
);

-- All access goes through the server with the service-role key, which bypasses
-- RLS. Enabling RLS with no policies blocks the public anon key entirely.
alter table books enable row level security;
alter table orders enable row level security;
alter table hero_slides enable row level security;
alter table author_meta enable row level security;
alter table category_meta enable row level security;
