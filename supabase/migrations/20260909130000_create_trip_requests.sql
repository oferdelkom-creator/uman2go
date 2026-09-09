create table if not exists public.trip_requests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete set null,
  full_name text not null,
  phone text not null,
  email text,
  passengers integer not null default 1 check (passengers > 0),
  arrival_date date not null,
  departure_date date not null,
  needs_hotel boolean not null default false,
  needs_transport boolean not null default false,
  needs_tours boolean not null default false,
  rooms_count integer check (rooms_count is null or rooms_count > 0),
  hotel_budget numeric(10, 2) check (hotel_budget is null or hotel_budget >= 0),
  pickup_location text,
  destination text not null default 'Uman',
  trip_type text not null default 'one_way' check (trip_type in ('one_way', 'round_trip')),
  pickup_time time,
  vehicle_class text not null default 'standard' check (vehicle_class in ('standard', 'comfort', 'minivan', 'van')),
  luggage_count integer check (luggage_count is null or luggage_count >= 0),
  child_seats integer not null default 0 check (child_seats >= 0),
  extra_stops integer not null default 0 check (extra_stops >= 0),
  tour_interests text[] not null default '{}',
  notes text,
  status text not null default 'new' check (status in ('new', 'quoted', 'confirmed', 'completed', 'cancelled')),
  quoted_total numeric(12, 2) check (quoted_total is null or quoted_total >= 0),
  currency text not null default 'USD',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint trip_requests_service_selected check (needs_hotel or needs_transport or needs_tours),
  constraint trip_requests_dates_valid check (departure_date >= arrival_date)
);

create index if not exists trip_requests_status_created_at_idx
  on public.trip_requests (status, created_at desc);
create index if not exists trip_requests_user_id_idx
  on public.trip_requests (user_id) where user_id is not null;

alter table public.trip_requests enable row level security;

grant insert on table public.trip_requests to anon, authenticated;
grant select, update on table public.trip_requests to authenticated;

create policy "Anyone can submit a trip request"
  on public.trip_requests for insert
  to anon, authenticated
  with check (user_id is null or (select auth.uid()) = user_id);

create policy "Customers and admins can view trip requests"
  on public.trip_requests for select
  to authenticated
  using ((select auth.uid()) = user_id or (select public.is_admin()));

create policy "Admins can update trip requests"
  on public.trip_requests for update
  to authenticated
  using ((select public.is_admin()))
  with check ((select public.is_admin()));
