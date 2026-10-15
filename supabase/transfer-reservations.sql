create table public.transfer_reservations (
 id uuid primary key default gen_random_uuid(),
 conversation_id uuid references public.sales_conversations(id) on delete set null,
 source text not null check(source in ('website','bot')),
 full_name text not null,
 contact text not null,
 vehicle_code text not null,
 stops_code text not null,
 departure_date date,
 departure_time text,
 passengers integer not null check(passengers between 1 and 57),
 pickup text,
 notes text not null default '',
 pricing_version text not null,
 currency text not null default 'USD' check(currency='USD'),
 quote jsonb not null,
 total_cents integer not null check(total_cents>0),
 deposit_cents integer not null check(deposit_cents>0),
 driver_balance_cents integer not null check(driver_balance_cents>0),
 status text not null default 'pending_supplier' check(status in ('draft','pending_supplier','awaiting_deposit','confirmed')),
 supplier_name text,
 supplier_approved_at timestamptz,
 supplier_reference text,
 payment_verified_at timestamptz,
 payment_reference text,
 notification_status text not null default 'pending' check(notification_status in ('pending','sent','failed')),
 submitted_at timestamptz,
 created_at timestamptz not null default now(),
 expires_at timestamptz not null default now()+interval '1 day',
 check(total_cents=deposit_cents+driver_balance_cents),
 check(status='draft' or (departure_date is not null and departure_time is not null and pickup is not null and submitted_at is not null)),
 check(status not in ('awaiting_deposit','confirmed') or (supplier_approved_at is not null and supplier_name is not null and supplier_reference is not null)),
 check(status<>'confirmed' or (payment_verified_at is not null and payment_reference is not null))
);
alter table public.transfer_reservations enable row level security;
revoke all on public.transfer_reservations from anon,authenticated;
grant select on public.transfer_reservations to authenticated;
grant all on public.transfer_reservations to service_role;
create policy transfer_reservations_admin_read on public.transfer_reservations for select to authenticated using ((select public.is_admin()));
create index transfer_reservations_created_idx on public.transfer_reservations(created_at desc);
create index transfer_reservations_conversation_idx on public.transfer_reservations(conversation_id,created_at desc);
