alter table public.sales_conversations add column summary_email_attempts integer not null default 0;

create or replace function public.sales_claim_completion(p_id uuid) returns boolean
language plpgsql security invoker set search_path = '' as $$
declare n uuid;
begin
 update public.sales_conversations
 set busy_until=now()+interval '90 seconds',completed_at=coalesce(completed_at,now()),
 summary_email_status='sending',summary_email_attempts=summary_email_attempts+1,status='follow_up',updated_at=now()
 where id=p_id and expires_at>now() and summary_email_status<>'sent'
 and (busy_until is null or busy_until<now())
 and (completed_at is null or completed_at>now()-interval '23 hours')
 returning id into n;
 return n is not null;
end $$;

create function public.sales_idle_candidates(p_limit integer default 3) returns setof uuid
language sql security invoker set search_path = '' as $$
 select id from public.sales_conversations
 where expires_at>now() and updated_at<=now()-interval '5 minutes'
 and summary_email_status<>'sent' and summary_email_attempts<3
 and (completed_at is null or completed_at>now()-interval '23 hours')
 and (busy_until is null or busy_until<now())
 order by updated_at limit least(greatest(p_limit,1),3)
$$;

create function public.sales_claim_idle_completion(p_id uuid) returns boolean
language plpgsql security invoker set search_path = '' as $$
begin
 -- Lock and recheck inactivity, so a newly arrived chat message wins over a stale candidate list.
 perform id from public.sales_conversations
 where id=p_id and updated_at<=now()-interval '5 minutes' and summary_email_attempts<3
 for update;
 if not found then return false; end if;
 return public.sales_claim_completion(p_id);
end $$;

revoke all on function public.sales_claim_completion(uuid),public.sales_idle_candidates(integer),public.sales_claim_idle_completion(uuid) from public,anon,authenticated;
grant execute on function public.sales_claim_completion(uuid),public.sales_idle_candidates(integer),public.sales_claim_idle_completion(uuid) to service_role;

-- The scheduler token is provisioned separately in Vault and Vercel; never commit its value.
-- Request headers contain the dedicated scheduler token while queued; browser roles cannot read them.
revoke select on net.http_request_queue from public,anon,authenticated;
create schema if not exists uman_private;
create function uman_private.dispatch_sales_summaries() returns bigint
language plpgsql security invoker set search_path = '' as $$
declare cron_token text;
begin
 if not exists(select 1 from public.sales_idle_candidates(1)) then return null; end if;
 select decrypted_secret into cron_token from vault.decrypted_secrets where name='uman_sales_summary_cron_token';
 if cron_token is null then raise exception 'Sales scheduler credential is missing'; end if;
 return net.http_post(
  url:='https://www.uman2go.com/api/internal/sales-summary',
  headers:=jsonb_build_object('Content-Type','application/json','Authorization','Bearer '||cron_token),
  body:='{}'::jsonb,timeout_milliseconds:=60000);
end $$;
revoke all on function uman_private.dispatch_sales_summaries() from public,anon,authenticated,service_role;
-- Activate only after the production endpoint and its secret have been deployed:
-- select cron.schedule('uman-sales-idle-summary','* * * * *','select uman_private.dispatch_sales_summaries();');
