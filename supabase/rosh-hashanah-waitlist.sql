-- Separate campaign consent and retention; conversations still expire after 30 days.
create table public.rosh_hashanah_waitlist (
 id uuid primary key default gen_random_uuid(),
 campaign text not null default 'rosh-hashanah-2027' check (campaign = 'rosh-hashanah-2027'),
 contact_key text not null,
 full_name text not null check (char_length(full_name) between 2 and 100),
 contact text not null check (char_length(contact) between 7 and 160),
 departure_city text not null check (departure_city in ('tel-aviv','new-york','london','paris')),
 passengers integer not null check (passengers between 1 and 500),
 installments integer check (installments between 1 and 24),
 consent_at timestamptz not null default now(),
 consent_version text not null default 'waitlist-2027-v1',
 created_at timestamptz not null default now(),
 expires_at timestamptz not null default '2027-11-01T00:00:00Z',
 unique(campaign,contact_key)
);
alter table public.rosh_hashanah_waitlist enable row level security;
revoke all on public.rosh_hashanah_waitlist from anon,authenticated;
grant select(id,campaign,full_name,contact,departure_city,passengers,installments,consent_at,created_at,expires_at) on public.rosh_hashanah_waitlist to authenticated;
grant all on public.rosh_hashanah_waitlist to service_role;
create policy waitlist_admin_read on public.rosh_hashanah_waitlist for select to authenticated using ((select public.is_admin()));
select cron.schedule('uman-waitlist-retention','27 * * * *',$job$ delete from public.rosh_hashanah_waitlist where expires_at < now(); $job$);
