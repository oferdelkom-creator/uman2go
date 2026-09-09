create table if not exists public.tourist_tax_rates (
  id uuid primary key default gen_random_uuid(),
  city text not null default 'Uman',
  tax_year integer not null,
  accommodation_type text not null check (accommodation_type in ('hotel', 'private')),
  guest_type text not null check (guest_type in ('ukrainian', 'foreign')),
  amount_per_adult_per_night numeric(10, 2) not null check (amount_per_adult_per_night >= 0),
  currency text not null default 'UAH',
  children_exempt_under_age integer not null default 18,
  source_url text,
  active boolean not null default true,
  updated_at timestamptz not null default now(),
  unique (city, tax_year, accommodation_type, guest_type)
);

insert into public.tourist_tax_rates (
  city, tax_year, accommodation_type, guest_type, amount_per_adult_per_night, source_url
) values (
  'Uman', 2026, 'hotel', 'foreign', 216.18, 'https://umantravel.com/en/tourist-tax/'
) on conflict (city, tax_year, accommodation_type, guest_type) do nothing;

alter table public.tourist_tax_rates enable row level security;
grant select on table public.tourist_tax_rates to anon, authenticated;
grant insert, update, delete on table public.tourist_tax_rates to authenticated;

create policy "Active tourist tax rates are publicly viewable"
  on public.tourist_tax_rates for select to anon, authenticated using (active);
create policy "Admins can manage tourist tax rates"
  on public.tourist_tax_rates for all to authenticated
  using ((select public.is_admin())) with check ((select public.is_admin()));

alter table public.bookings
  add column if not exists adults_count integer,
  add column if not exists children_count integer not null default 0,
  add column if not exists tourist_tax_per_adult_night numeric(10, 2) not null default 0,
  add column if not exists tourist_tax_total numeric(12, 2) not null default 0,
  add column if not exists tourist_tax_currency text not null default 'UAH';

