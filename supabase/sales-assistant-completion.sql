-- Completed conversations are immutable. All writes and completion claims stay server-only.
alter table public.sales_conversations
 add column completed_at timestamptz,
 add column completion_summary text,
 add column summary_email_status text not null default 'pending' check (summary_email_status in ('pending','sending','sent','failed')),
 add column summary_email_sent_at timestamptz,
 add column summary_email_id text;
grant select (completed_at,completion_summary,summary_email_status,summary_email_sent_at) on public.sales_conversations to authenticated;

create or replace function public.sales_claim_turn(p_id uuid) returns boolean
language plpgsql security invoker set search_path = '' as $$
declare n uuid;
begin
 update public.sales_conversations set busy_until=now()+interval '90 seconds',turns=turns+1,updated_at=now()
 where id=p_id and expires_at>now() and completed_at is null and turns<40
 and (busy_until is null or busy_until<now()) returning id into n;
 return n is not null;
end $$;
revoke all on function public.sales_claim_turn(uuid) from public,anon,authenticated;
grant execute on function public.sales_claim_turn(uuid) to service_role;

create function public.sales_claim_completion(p_id uuid) returns boolean
language plpgsql security invoker set search_path = '' as $$
declare n uuid;
begin
 update public.sales_conversations
 set busy_until=now()+interval '90 seconds',completed_at=coalesce(completed_at,now()),
 summary_email_status='sending',status='follow_up',updated_at=now()
 where id=p_id and expires_at>now() and summary_email_status<>'sent'
 and (busy_until is null or busy_until<now())
 -- Unknown outcomes are safe to retry only inside the provider's 24-hour deduplication window.
 and (completed_at is null or completed_at>now()-interval '23 hours')
 returning id into n;
 return n is not null;
end $$;
revoke all on function public.sales_claim_completion(uuid) from public,anon,authenticated;
grant execute on function public.sales_claim_completion(uuid) to service_role;
