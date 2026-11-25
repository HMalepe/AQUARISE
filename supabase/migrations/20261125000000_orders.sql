-- AQUARISE orders. Written only by the Vercel functions using the service-role key.
-- RLS is on with no policies: the anon and authenticated roles can read or write nothing.

create table public.orders (
  id            uuid primary key default gen_random_uuid(),
  ref           text not null unique,                       -- PayFast m_payment_id
  status        text not null default 'pending' check (status in ('pending', 'paid', 'failed', 'review')),
  amount_cents  integer not null check (amount_cents > 0),  -- expected total, ZAR cents
  currency      text not null default 'ZAR',
  items         jsonb not null,
  is_subscription boolean not null default false,
  buyer_name    text,
  buyer_email   text,
  created_at    timestamptz not null default now(),
  paid_at       timestamptz,
  updated_at    timestamptz not null default now()
);

create table public.order_events (
  id                 bigint generated always as identity primary key,
  order_ref          text not null references public.orders (ref) on delete cascade,
  pf_payment_id      text not null,
  payment_status     text not null,
  amount_gross_cents integer,
  verified           boolean not null,                      -- false = amount did not match the order
  note               text,
  created_at         timestamptz not null default now(),
  unique (order_ref, pf_payment_id)                         -- makes ITN handling idempotent
);

create index orders_status_created_idx on public.orders (status, created_at desc);

create function public.touch_updated_at() returns trigger
language plpgsql set search_path = '' as $$
begin new.updated_at = now(); return new; end $$;

create trigger orders_touch_updated_at before update on public.orders
  for each row execute function public.touch_updated_at();

alter table public.orders enable row level security;
alter table public.order_events enable row level security;

revoke all on public.orders, public.order_events from anon, authenticated;
revoke all on function public.touch_updated_at() from public, anon, authenticated;
