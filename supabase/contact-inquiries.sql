create table public.contact_inquiries (
 id uuid primary key,
 full_name text not null check (char_length(full_name) between 1 and 200),
 email text not null check (char_length(email) between 3 and 254),
 message text not null check (char_length(message) between 1 and 10000),
 status text not null default 'new' check (status in ('new','follow_up','closed')),
 source text not null default 'contact_form',
 source_reference text unique,
 created_at timestamptz not null default now(),
 email_status text not null default 'pending' check (email_status in ('pending','sent','failed')),
 email_sent_at timestamptz
);
alter table public.contact_inquiries enable row level security;
revoke all on public.contact_inquiries from anon,authenticated;
grant select on public.contact_inquiries to authenticated;
grant update(status) on public.contact_inquiries to authenticated;
grant all on public.contact_inquiries to service_role;
create policy contact_admin_read on public.contact_inquiries for select to authenticated using ((select public.is_admin()));
create policy contact_admin_update on public.contact_inquiries for update to authenticated using ((select public.is_admin())) with check ((select public.is_admin()));
create index contact_inquiries_created_at_idx on public.contact_inquiries(created_at desc);
