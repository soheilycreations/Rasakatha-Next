-- Per-IP rate limiting store (used when Upstash isn't configured). Safe to re-run.
create table if not exists rate_limits (
  key text primary key,
  count integer not null,
  reset_at timestamptz not null
);
alter table rate_limits enable row level security;

-- Atomically counts a hit inside a fixed window and returns the new count.
create or replace function rate_limit_hit(p_key text, p_window_seconds integer)
returns integer
language plpgsql
as $$
declare
  hits integer;
begin
  insert into rate_limits as r (key, count, reset_at)
  values (p_key, 1, now() + make_interval(secs => p_window_seconds))
  on conflict (key) do update
    set count = case when r.reset_at < now() then 1 else r.count + 1 end,
        reset_at = case when r.reset_at < now() then now() + make_interval(secs => p_window_seconds) else r.reset_at end
  returning count into hits;

  -- opportunistic cleanup of expired rows
  if random() < 0.01 then
    delete from rate_limits where reset_at < now() - interval '1 day';
  end if;
  return hits;
end;
$$;

-- Only the server (service role) may call it.
revoke all on function rate_limit_hit(text, integer) from public, anon, authenticated;
