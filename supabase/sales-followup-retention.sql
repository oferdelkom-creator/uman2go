alter table public.sales_conversations add column if not exists retained_for_followup boolean not null default false;
grant select(retained_for_followup) on public.sales_conversations to authenticated;
select cron.alter_job(jobid, command := 'delete from public.sales_conversations where expires_at < now() and not retained_for_followup; delete from public.sales_usage where day < current_date - 2;') from cron.job where jobname='uman-sales-retention';

