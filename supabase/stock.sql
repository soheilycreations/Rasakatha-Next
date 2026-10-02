-- Optional stock tracking. NULL = not tracked (stays in stock until toggled manually).
-- When set, orders decrement it and in_stock turns false at 0. Safe to re-run.
alter table books add column if not exists stock_qty integer check (stock_qty is null or stock_qty >= 0);
