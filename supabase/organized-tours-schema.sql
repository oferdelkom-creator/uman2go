create table public.organized_tours (
 id uuid primary key default gen_random_uuid(),
 organizer_id uuid not null references auth.users(id),
 organizer_name text not null check (length(organizer_name) between 2 and 120),
 contact_phone text not null check (length(contact_phone) between 7 and 30),
 title text not null check (length(title) between 3 and 160),
 destination text not null check (destination in ('uman','ukraine')),
 start_date date not null, end_date date not null check (end_date >= start_date),
 description text not null check (length(description) between 20 and 12000),
 included text not null check (length(included) between 2 and 6000),
 cancellation_terms text not null check (length(cancellation_terms) between 2 and 4000),
 payment_terms text not null check (length(payment_terms) between 2 and 4000),
 price numeric(12,2) not null check (price > 0),
 currency text not null check (currency in ('USD','ILS','EUR','UAH')),
 photos text[] not null default '{}' check (cardinality(photos)<=12),
 capacity integer not null check (capacity between 1 and 1000),
 status text not null default 'pending' check (status in ('pending','active','rejected','closed')),
 created_at timestamptz not null default now()
);
create index organized_tours_organizer_idx on public.organized_tours(organizer_id);
create index organized_tours_status_date_idx on public.organized_tours(status,start_date);
alter table public.organized_tours enable row level security;
revoke all on public.organized_tours from anon, authenticated;
grant select on public.organized_tours to anon,authenticated;
grant insert on public.organized_tours to authenticated;
grant update(status) on public.organized_tours to authenticated;
grant all on public.organized_tours to service_role;
create policy organized_tours_read on public.organized_tours for select to anon,authenticated
 using (status='active' or organizer_id=(select auth.uid()) or (select public.is_admin()));
create policy organized_tours_submit on public.organized_tours for insert to authenticated
 with check (organizer_id=(select auth.uid()) and status='pending' and start_date >= (now() at time zone 'Europe/Kyiv')::date);
create policy organized_tours_moderate on public.organized_tours for update to authenticated
 using ((select public.is_admin())) with check ((select public.is_admin()));

create table public.organized_tour_bookings (
 id uuid primary key,
 tour_id uuid not null references public.organized_tours(id),
 full_name text not null check (length(full_name) between 2 and 120),
 phone text not null check (length(phone) between 7 and 30),
 participants integer not null check (participants between 1 and 1000),
 notes text not null default '' check (length(notes)<=2000),
 status text not null default 'pending' check (status in ('pending','confirmed','cancelled')),
 created_at timestamptz not null default now()
);
create index organized_tour_bookings_tour_idx on public.organized_tour_bookings(tour_id);
alter table public.organized_tour_bookings enable row level security;
revoke all on public.organized_tour_bookings from anon,authenticated;
grant insert(id,tour_id,full_name,phone,participants,notes) on public.organized_tour_bookings to anon,authenticated;
grant select on public.organized_tour_bookings to authenticated;
grant update(status) on public.organized_tour_bookings to authenticated;
grant all on public.organized_tour_bookings to service_role;
create policy organized_bookings_submit on public.organized_tour_bookings for insert to anon,authenticated
 with check (status='pending' and exists(select 1 from public.organized_tours t where t.id=tour_id and t.status='active' and t.start_date >= (now() at time zone 'Europe/Kyiv')::date and participants<=t.capacity));
create policy organized_bookings_read on public.organized_tour_bookings for select to authenticated
 using ((select public.is_admin()) or exists(select 1 from public.organized_tours t where t.id=tour_id and t.organizer_id=(select auth.uid())));
create policy organized_bookings_manage on public.organized_tour_bookings for update to authenticated
 using ((select public.is_admin()) or exists(select 1 from public.organized_tours t where t.id=tour_id and t.organizer_id=(select auth.uid())))
 with check ((select public.is_admin()) or exists(select 1 from public.organized_tours t where t.id=tour_id and t.organizer_id=(select auth.uid())));

create schema if not exists private;
-- This trigger needs a complete count of bookings, which visitors cannot read.
-- It is not a callable public RPC and never returns guest records.
create function private.check_organized_booking() returns trigger language plpgsql security definer set search_path='' as $$
declare t public.organized_tours; used integer;
begin
 select * into t from public.organized_tours where id=new.tour_id for update;
 if tg_op='UPDATE' and new.status='cancelled' then return new; end if;
 if t.id is null or t.status<>'active' or t.start_date < (now() at time zone 'Europe/Kyiv')::date then raise exception 'tour_unavailable'; end if;
 if new.participants > t.capacity then raise exception 'tour_full'; end if;
 if tg_op='INSERT' then
  if new.status<>'pending' then raise exception 'invalid_status'; end if;
  if exists(select 1 from public.organized_tour_bookings where tour_id=new.tour_id and phone=new.phone and status<>'cancelled' and created_at>now()-interval '1 hour') then raise exception 'duplicate_request'; end if;
 end if;
 if new.status='confirmed' then
  select coalesce(sum(participants),0) into used from public.organized_tour_bookings where tour_id=new.tour_id and status='confirmed' and id<>new.id;
  if used+new.participants > t.capacity then raise exception 'tour_full'; end if;
 end if;
 return new;
end $$;
revoke all on function private.check_organized_booking() from public,anon,authenticated;
create trigger organized_booking_capacity before insert or update on public.organized_tour_bookings for each row execute function private.check_organized_booking();
