-- Deployment companion; secrets must be inserted separately through a secure connection.
create extension if not exists pg_cron;
create extension if not exists pg_net;
create schema if not exists uman_private;
revoke all on schema uman_private from public,anon,authenticated;
create table if not exists uman_private.deployment (
  id integer primary key check(id=1), secret text not null
);
alter table uman_private.deployment enable row level security;
revoke all on uman_private.deployment from public,anon,authenticated;

-- Initially inactive: seed data and complete webhook cutover before enabling.
select cron.alter_job(cron.schedule('uman-bot-outbox','* * * * *',
$$select net.http_post(
  url:='https://uman2go-live.vercel.app/api/umanbot?r=drain',
  headers:=jsonb_build_object('Content-Type','application/json','X-UMAN-Secret',
    (select secret from uman_private.deployment where id=1)),
  body:='{}'::jsonb,timeout_milliseconds:=55000);$$),active:=false);

-- After cutover: select cron.alter_job(jobid,active:=true) from cron.job where jobname='uman-bot-outbox';

