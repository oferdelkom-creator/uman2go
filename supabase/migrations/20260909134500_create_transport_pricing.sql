create table if not exists public.transport_default_pricing (
  vehicle_class text primary key check (vehicle_class in ('standard', 'comfort', 'minivan', 'van')),
  price_per_km numeric(10, 2) not null check (price_per_km > 0),
  currency text not null default 'UAH',
  service_fee_pct numeric(5, 2) not null default 12 check (service_fee_pct >= 0 and service_fee_pct <= 100),
  included_wait_minutes integer not null default 30 check (included_wait_minutes >= 0),
  extra_stop_price numeric(10, 2) not null default 0 check (extra_stop_price >= 0),
  child_seat_price numeric(10, 2) not null default 0 check (child_seat_price >= 0),
  night_surcharge_pct numeric(5, 2) not null default 15 check (night_surcharge_pct >= 0),
  peak_surcharge_pct numeric(5, 2) not null default 20 check (peak_surcharge_pct >= 0),
  round_trip_discount_pct numeric(5, 2) not null default 10 check (round_trip_discount_pct >= 0 and round_trip_discount_pct <= 100),
  updated_at timestamptz not null default now()
);

insert into public.transport_default_pricing (vehicle_class, price_per_km)
values ('standard', 18), ('comfort', 23), ('minivan', 25), ('van', 28)
on conflict (vehicle_class) do nothing;

create table if not exists public.driver_pricing (
  id uuid primary key default gen_random_uuid(),
  driver_id uuid not null unique references public.drivers(id) on delete cascade,
  vehicle_class text not null default 'standard' check (vehicle_class in ('standard', 'comfort', 'minivan', 'van')),
  price_per_km numeric(10, 2) not null check (price_per_km > 0),
  currency text not null default 'UAH',
  minimum_fare numeric(10, 2) not null default 0 check (minimum_fare >= 0),
  included_wait_minutes integer not null default 30 check (included_wait_minutes >= 0),
  waiting_price_per_minute numeric(10, 2) not null default 0 check (waiting_price_per_minute >= 0),
  extra_stop_price numeric(10, 2) not null default 0 check (extra_stop_price >= 0),
  child_seat_price numeric(10, 2) not null default 0 check (child_seat_price >= 0),
  night_surcharge_pct numeric(5, 2) not null default 15 check (night_surcharge_pct >= 0),
  peak_surcharge_pct numeric(5, 2) not null default 20 check (peak_surcharge_pct >= 0),
  round_trip_discount_pct numeric(5, 2) not null default 10 check (round_trip_discount_pct >= 0 and round_trip_discount_pct <= 100),
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.transport_default_pricing enable row level security;
alter table public.driver_pricing enable row level security;

grant select on table public.transport_default_pricing to anon, authenticated;
grant select on table public.driver_pricing to anon, authenticated;
grant insert, update, delete on table public.driver_pricing to authenticated;
grant update on table public.transport_default_pricing to authenticated;

create policy "Default transport pricing is publicly viewable"
  on public.transport_default_pricing for select to anon, authenticated using (true);
create policy "Admins can update default transport pricing"
  on public.transport_default_pricing for update to authenticated
  using ((select public.is_admin())) with check ((select public.is_admin()));

create policy "Active or owned driver pricing is viewable"
  on public.driver_pricing for select to anon, authenticated
  using (
    active
    or (select auth.uid()) = (select owner_id from public.drivers where id = driver_id)
    or (select public.is_admin())
  );
create policy "Drivers can create their own pricing"
  on public.driver_pricing for insert to authenticated
  with check ((select auth.uid()) = (select owner_id from public.drivers where id = driver_id) or (select public.is_admin()));
create policy "Drivers can update their own pricing"
  on public.driver_pricing for update to authenticated
  using ((select auth.uid()) = (select owner_id from public.drivers where id = driver_id) or (select public.is_admin()))
  with check ((select auth.uid()) = (select owner_id from public.drivers where id = driver_id) or (select public.is_admin()));
create policy "Drivers can delete their own pricing"
  on public.driver_pricing for delete to authenticated
  using ((select auth.uid()) = (select owner_id from public.drivers where id = driver_id) or (select public.is_admin()));

