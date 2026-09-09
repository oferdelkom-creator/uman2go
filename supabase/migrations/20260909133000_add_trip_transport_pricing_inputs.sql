alter table public.trip_requests
  add column if not exists trip_type text not null default 'one_way',
  add column if not exists pickup_time time,
  add column if not exists vehicle_class text not null default 'standard',
  add column if not exists child_seats integer not null default 0,
  add column if not exists extra_stops integer not null default 0;

alter table public.trip_requests
  add constraint trip_requests_trip_type_check check (trip_type in ('one_way', 'round_trip')),
  add constraint trip_requests_vehicle_class_check check (vehicle_class in ('standard', 'comfort', 'minivan', 'van')),
  add constraint trip_requests_child_seats_check check (child_seats >= 0),
  add constraint trip_requests_extra_stops_check check (extra_stops >= 0);

