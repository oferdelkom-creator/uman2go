begin;
do $$
declare cid uuid;
begin
 if has_function_privilege('anon','public.sales_claim_completion(uuid)','EXECUTE')
 or has_function_privilege('authenticated','public.sales_claim_completion(uuid)','EXECUTE') then
  raise exception 'Completion function must be server-only';
 end if;
 if has_column_privilege('authenticated','public.sales_conversations','token_hash','SELECT') then
  raise exception 'Private token hash exposed';
 end if;
 insert into public.sales_conversations(token_hash,full_name,contact)
 values(encode(gen_random_bytes(32),'hex'),'Completion regression','test@example.invalid') returning id into cid;
 if not public.sales_claim_turn(cid) then raise exception 'Initial turn failed'; end if;
 if public.sales_claim_completion(cid) then raise exception 'Completion overtook chat lock'; end if;
 update public.sales_conversations set busy_until=null where id=cid;
 if not public.sales_claim_completion(cid) then raise exception 'Completion failed'; end if;
 if public.sales_claim_completion(cid) then raise exception 'Duplicate completion claim'; end if;
 update public.sales_conversations set busy_until=null where id=cid;
 if public.sales_claim_turn(cid) then raise exception 'Completed conversation still writable'; end if;
 if not public.sales_claim_completion(cid) then raise exception 'Failed/unknown delivery cannot be retried'; end if;
 update public.sales_conversations set busy_until=null,summary_email_status='sent' where id=cid;
 if public.sales_claim_completion(cid) then raise exception 'Sent completion duplicated'; end if;
 update public.sales_conversations set summary_email_status='failed',completed_at=now()-interval '24 hours' where id=cid;
 if public.sales_claim_completion(cid) then raise exception 'Expired idempotency window allowed'; end if;
end $$;
rollback;
