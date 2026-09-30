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

-- In-store (POS) sales, kept in their own table separate from web `orders`
-- so till/cashier billing never mixes with the online checkout flow, while
-- reports can still combine both sources.
create table if not exists pos_sales (
  id text primary key,
  created_at timestamptz not null default now(),
  items jsonb not null,
  subtotal numeric not null,
  discount numeric not null default 0,
  total numeric not null,
  payment text not null default 'cash',
  customer_name text,
  customer_phone text,
  customer_email text,
  note text
);
create index if not exists pos_sales_created_at_idx on pos_sales (created_at desc);
-- Safe to re-run: adds the columns if this table already existed without them.
alter table pos_sales add column if not exists customer_phone text;
alter table pos_sales add column if not exists customer_email text;

-- All access goes through the server with the service-role key, which bypasses
-- RLS. Enabling RLS with no policies blocks the public anon key entirely.
alter table books enable row level security;
alter table orders enable row level security;
alter table hero_slides enable row level security;
alter table author_meta enable row level security;
alter table category_meta enable row level security;
alter table pos_sales enable row level security;
