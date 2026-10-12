begin;
do $$
declare cid uuid;
begin
 if has_function_privilege('anon','public.sales_claim_idle_completion(uuid)','EXECUTE')
 or has_function_privilege('authenticated','public.sales_idle_candidates(integer)','EXECUTE')
 or has_function_privilege('service_role','uman_private.dispatch_sales_summaries()','EXECUTE') then
  raise exception 'Scheduler access exposed';
 end if;
 if has_table_privilege('anon','vault.decrypted_secrets','SELECT')
 or has_table_privilege('authenticated','vault.decrypted_secrets','SELECT') then
  raise exception 'Vault secret exposed';
 end if;
 if position('Bearer ' in pg_get_functiondef('uman_private.dispatch_sales_summaries()'::regprocedure))>0
 or position('extensions.hmac' in pg_get_functiondef('uman_private.dispatch_sales_summaries()'::regprocedure))=0 then
  raise exception 'Persistent scheduler secret must not enter the HTTP queue';
 end if;
 insert into public.sales_conversations(token_hash,full_name,contact)
 values(encode(gen_random_bytes(32),'hex'),'Idle regression','test@example.invalid') returning id into cid;
 if public.sales_claim_idle_completion(cid) then raise exception 'Fresh conversation completed'; end if;
 update public.sales_conversations set updated_at=now()-interval '6 minutes' where id=cid;
 if not exists(select 1 from public.sales_idle_candidates(3) x where x=cid) then raise exception 'Idle candidate missing'; end if;
 update public.sales_conversations set updated_at=now() where id=cid;
 if public.sales_claim_idle_completion(cid) then raise exception 'New message failed to reset timer'; end if;
 update public.sales_conversations set updated_at=now()-interval '6 minutes',busy_until=now()+interval '90 seconds' where id=cid;
 if public.sales_claim_idle_completion(cid) then raise exception 'Idle worker overtook active generation'; end if;
 update public.sales_conversations set busy_until=null where id=cid;
 if not public.sales_claim_idle_completion(cid) then raise exception 'Idle completion failed'; end if;
 update public.sales_conversations set busy_until=null where id=cid;
 if public.sales_claim_turn(cid) then raise exception 'Finished chat writable'; end if;
 update public.sales_conversations set updated_at=now()-interval '6 minutes',summary_email_status='sent' where id=cid;
 if public.sales_claim_idle_completion(cid) then raise exception 'Sent summary duplicated'; end if;
 update public.sales_conversations set summary_email_status='failed',summary_email_attempts=3 where id=cid;
 if public.sales_claim_idle_completion(cid) then raise exception 'Automatic retry limit bypassed'; end if;
end $$;
rollback;
