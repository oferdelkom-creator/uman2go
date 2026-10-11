-- Installed on live Supabase. Applies only to the new sales-assistant tables.
create extension if not exists pg_cron;
select cron.schedule('uman-sales-retention','17 * * * *',$job$
 delete from public.sales_conversations where expires_at < now();
 delete from public.sales_usage where day < current_date - 2;
$job$);
