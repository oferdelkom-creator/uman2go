-- Server-only writes; administrators can read enquiries. Tokens never reach admin views.
create table public.sales_conversations (
 id uuid primary key default gen_random_uuid(),
 token_hash text unique not null,
 full_name text not null check (char_length(full_name) between 2 and 100),
 contact text not null check (char_length(contact) between 7 and 160),
 locale text not null default 'he',
 consent_at timestamptz not null default now(),
 created_at timestamptz not null default now(),
 updated_at timestamptz not null default now(),
 expires_at timestamptz not null default now() + interval '30 days',
 summary text not null default '',
 turns integer not null default 0,
 busy_until timestamptz,
 status text not null default 'new' check (status in ('new','follow_up','closed'))
);
create table public.sales_messages (
 id bigint generated always as identity primary key,
 conversation_id uuid not null references public.sales_conversations(id) on delete cascade,
 role text not null check (role in ('user','assistant')),
 content text not null check (char_length(content) between 1 and 6000),
 created_at timestamptz not null default now()
);
create index sales_messages_conversation_idx on public.sales_messages(conversation_id,id);
create index sales_conversations_expiry_idx on public.sales_conversations(expires_at);
create table public.sales_usage (
 bucket text not null,
 day date not null default current_date,
 count integer not null default 0,
 primary key(bucket,day)
);
alter table public.sales_conversations enable row level security;
alter table public.sales_messages enable row level security;
alter table public.sales_usage enable row level security;
revoke all on public.sales_conversations,public.sales_messages,public.sales_usage from anon,authenticated;
grant select (id,full_name,contact,locale,consent_at,created_at,updated_at,expires_at,summary,turns,status) on public.sales_conversations to authenticated;
grant select on public.sales_messages to authenticated;
grant all on public.sales_conversations,public.sales_messages,public.sales_usage to service_role;
grant usage,select on sequence public.sales_messages_id_seq to service_role;
create policy sales_admin_read on public.sales_conversations for select to authenticated using ((select public.is_admin()));
create policy sales_messages_admin_read on public.sales_messages for select to authenticated using ((select public.is_admin()));
-- Atomic quotas remain effective across parallel requests and serverless instances.
create function public.sales_take_quota(p_bucket text,p_limit integer) returns boolean
language plpgsql security invoker set search_path = '' as $$
declare n integer;
begin
 insert into public.sales_usage(bucket,day,count) values(p_bucket,current_date,1)
 on conflict(bucket,day) do update set count=public.sales_usage.count+1
 where public.sales_usage.count<p_limit returning count into n;
 return n is not null;
end $$;
revoke all on function public.sales_take_quota(text,integer) from public,anon,authenticated;
grant execute on function public.sales_take_quota(text,integer) to service_role;
create function public.sales_claim_turn(p_id uuid) returns boolean
language plpgsql security invoker set search_path = '' as $$
declare n uuid;
begin
 update public.sales_conversations set busy_until=now()+interval '90 seconds',turns=turns+1,updated_at=now()
 where id=p_id and expires_at>now() and turns<40 and (busy_until is null or busy_until<now()) returning id into n;
 return n is not null;
end $$;
revoke all on function public.sales_claim_turn(uuid) from public,anon,authenticated;
grant execute on function public.sales_claim_turn(uuid) to service_role;
