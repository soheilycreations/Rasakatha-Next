-- Admin v2, Phase 0: staff accounts, audit log, settings, soft-delete for books.
-- Run once in the Supabase SQL Editor. Safe to re-run. Nothing here changes existing data.
--
-- Afterwards create the first owner:
--   node --env-file=.env.local scripts/create-owner.mjs you@example.com "Your Name" "a-long-password"

-- ---- Staff ----------------------------------------------------------------------------------------
-- One row per staff member; the sign-in itself is a Supabase Auth user with the same id.
create table if not exists staff (
  id uuid primary key references auth.users (id),
  email text not null unique,
  full_name text not null,
  role text not null check (role in ('owner', 'manager', 'cashier', 'stock')),
  pin_hash text,                       -- scrypt hash of the 4-6 digit till PIN (cashier / stock only)
  totp_secret text,                    -- AES-GCM encrypted by the server
  totp_enabled boolean not null default false,
  recovery_codes text[] not null default '{}', -- HMAC hashes of the one-time 2FA recovery codes
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  last_login_at timestamptz
);
create index if not exists staff_role_idx on staff (role) where active;

create or replace function touch_updated_at() returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;
drop trigger if exists staff_touch on staff;
create trigger staff_touch before update on staff for each row execute function touch_updated_at();

-- ---- Audit log (append-only) -----------------------------------------------------------------------
create table if not exists audit_log (
  id bigint generated always as identity primary key,
  at timestamptz not null default now(),
  actor_id uuid,
  actor_name text not null,
  actor_role text,
  action text not null,               -- e.g. books.update, orders.status, settings.update, auth.login
  entity text not null,               -- book, order, staff, settings, ...
  entity_id text,
  before jsonb,
  after jsonb,
  ip text,
  note text
);
create index if not exists audit_log_at_idx on audit_log (at desc);
create index if not exists audit_log_entity_idx on audit_log (entity, entity_id);
create index if not exists audit_log_actor_idx on audit_log (actor_name);

-- Nobody (not even the server) can edit or delete audit rows.
create or replace function audit_log_immutable() returns trigger language plpgsql as $$
begin
  raise exception 'audit_log is append-only';
end;
$$;
drop trigger if exists audit_log_no_update on audit_log;
create trigger audit_log_no_update before update or delete on audit_log for each row execute function audit_log_immutable();

-- ---- Settings --------------------------------------------------------------------------------------
create table if not exists settings (
  key text primary key,
  value jsonb not null,
  updated_at timestamptz not null default now(),
  updated_by uuid
);

-- ---- Books: archive instead of delete --------------------------------------------------------------
alter table books add column if not exists archived_at timestamptz;
alter table books add column if not exists archive_reason text;
create index if not exists books_archived_idx on books (archived_at) where archived_at is not null;

-- ---- Row level security -------------------------------------------------------------------------------
-- All access is through the server with the service-role key (which bypasses RLS). With RLS on and no
-- policies, the public anon key can read none of these tables.
alter table staff enable row level security;
alter table audit_log enable row level security;
alter table settings enable row level security;
