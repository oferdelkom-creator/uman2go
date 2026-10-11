-- Runs in a transaction; all fixtures and quota counters are rolled back.
begin;
do $$
begin
 if has_table_privilege('anon','public.sales_conversations','select') then raise exception 'Anonymous conversations access'; end if;
 if has_column_privilege('authenticated','public.sales_conversations','token_hash','select') then raise exception 'Session secret visible'; end if;
 if has_function_privilege('anon','public.sales_take_quota(text,integer)','execute') then raise exception 'Anonymous quota execution'; end if;
 if has_function_privilege('authenticated','public.sales_claim_turn(uuid)','execute') then raise exception 'User claim execution'; end if;
end $$;
insert into public.sales_conversations(id,token_hash,full_name,contact) values('a1111111-1111-4111-8111-111111111111','test-sales-token','Infrastructure test','test@example.invalid');
insert into public.sales_messages(conversation_id,role,content) values('a1111111-1111-4111-8111-111111111111','user','Test message');
set local role authenticated;
select set_config('request.jwt.claims','{"sub":"b2222222-2222-4222-8222-222222222222","role":"authenticated"}',true);
do $$
begin
 if exists(select id from public.sales_conversations) then raise exception 'Non-admin sees customer contacts'; end if;
 if exists(select id from public.sales_messages) then raise exception 'Non-admin sees messages'; end if;
end $$;
reset role;
-- Check a configured administrator without exposing their identity in test output.
do $$ declare admin_id uuid; begin
 select id into admin_id from public.profiles where role='admin' limit 1;
 if admin_id is null then raise exception 'Admin test requires a configured admin'; end if;
 perform set_config('request.jwt.claims',json_build_object('sub',admin_id,'role','authenticated')::text,true);
end $$;
set local role authenticated;
do $$ begin
 if not exists(select id from public.sales_conversations where id='a1111111-1111-4111-8111-111111111111') then raise exception 'Admin cannot see enquiry'; end if;
 if not exists(select id from public.sales_messages where conversation_id='a1111111-1111-4111-8111-111111111111') then raise exception 'Admin cannot see transcript'; end if;
end $$;
reset role;
set local role service_role;
do $$
begin
 if not public.sales_take_quota('test:sales:quota',2) then raise exception 'First quota failed'; end if;
 if not public.sales_take_quota('test:sales:quota',2) then raise exception 'Second quota failed'; end if;
 if public.sales_take_quota('test:sales:quota',2) then raise exception 'Quota bypass'; end if;
 if not public.sales_claim_turn('a1111111-1111-4111-8111-111111111111') then raise exception 'First claim failed'; end if;
 if public.sales_claim_turn('a1111111-1111-4111-8111-111111111111') then raise exception 'Concurrent claim allowed'; end if;
end $$;
reset role;
update public.sales_conversations set busy_until=null,turns=40 where id='a1111111-1111-4111-8111-111111111111';
set local role service_role;
do $$ begin if public.sales_claim_turn('a1111111-1111-4111-8111-111111111111') then raise exception 'Turn limit bypass'; end if; end $$;
reset role;
rollback;
