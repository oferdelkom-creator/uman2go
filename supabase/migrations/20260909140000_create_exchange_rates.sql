alter table public.trip_requests
  add column if not exists preferred_currency text not null default 'USD';

do $$ begin
  alter table public.trip_requests add constraint trip_requests_preferred_currency_check check (preferred_currency in ('UAH', 'USD', 'EUR'));
exception when duplicate_object then null; end $$;

create table if not exists public.exchange_rates (
  base_currency text not null check (base_currency in ('UAH', 'USD', 'EUR')),
  quote_currency text not null check (quote_currency in ('UAH', 'USD', 'EUR')),
  rate numeric(18, 8) not null check (rate > 0),
  source text not null default 'manual',
  fetched_at timestamptz not null default now(),
  primary key (base_currency, quote_currency),
  check (base_currency <> quote_currency)
);

alter table public.exchange_rates enable row level security;
grant select on table public.exchange_rates to anon, authenticated;
grant insert, update, delete on table public.exchange_rates to authenticated;

create policy "Exchange rates are publicly viewable"
  on public.exchange_rates for select to anon, authenticated using (true);
create policy "Admins can manage exchange rates"
  on public.exchange_rates for all to authenticated
  using ((select public.is_admin())) with check ((select public.is_admin()));

