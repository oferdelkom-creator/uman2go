create table public.sales_taxi_drafts (
  token_hash text primary key check (token_hash ~ '^[a-f0-9]{64}$'),
  conversation_id uuid not null references public.sales_conversations(id) on delete cascade,
  destination text not null check (length(destination) between 5 and 400),
  passengers integer not null check (passengers between 1 and 50),
  expires_at timestamptz not null default (now() + interval '15 minutes'),
  telegram_user_id bigint check (telegram_user_id > 0)
);
create index sales_taxi_drafts_expiry on public.sales_taxi_drafts(expires_at);
create index sales_taxi_drafts_conversation on public.sales_taxi_drafts(conversation_id);
alter table public.sales_taxi_drafts enable row level security;
revoke all on public.sales_taxi_drafts from public, anon, authenticated;
grant select, insert, update, delete on public.sales_taxi_drafts to service_role;

-- Only the verified Telegram server identity may bind/read a draft. No booking occurs here.
create function public.sales_taxi_claim(p_hash text, p_user_id bigint)
returns table(destination text, passengers integer)
language sql security invoker set search_path = '' as $$
  update public.sales_taxi_drafts d set telegram_user_id = p_user_id
  where d.token_hash = p_hash and d.expires_at > now() and p_user_id > 0
    and (d.telegram_user_id is null or d.telegram_user_id = p_user_id)
  returning d.destination, d.passengers;
$$;
revoke all on function public.sales_taxi_claim(text,bigint) from public, anon, authenticated;
grant execute on function public.sales_taxi_claim(text,bigint) to service_role;
select cron.schedule('uman-sales-taxi-draft-retention', '23 * * * *',
  $job$delete from public.sales_taxi_drafts where expires_at <= now();$job$);
