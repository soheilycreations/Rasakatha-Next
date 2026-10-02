-- Payment tracking for online payments (PayHere). Safe to re-run.
alter table orders add column if not exists payment_status text not null default 'pending';
alter table orders drop constraint if exists orders_payment_status_check;
alter table orders add constraint orders_payment_status_check
  check (payment_status in ('pending', 'paid', 'failed', 'cod'));
update orders set payment_status = 'cod' where payment = 'cod' and payment_status = 'pending';
