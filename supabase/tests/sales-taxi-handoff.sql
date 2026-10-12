begin;
do $$
declare c uuid; h text := repeat('a',64); n integer;
begin
  insert into public.sales_conversations(token_hash,full_name,contact,locale,consent_at)
  values(repeat('b',64),'בדיקת תשתית AI','infra-check-20261011@example.invalid','he',now()) returning id into c;
  insert into public.sales_taxi_drafts(token_hash,conversation_id,destination,passengers)
  values(h,c,'Pushkina Street 20, Uman',3);
  select count(*) into n from public.sales_taxi_claim(h,123456789);
  if n <> 1 then raise exception 'First claim failed'; end if;
  select count(*) into n from public.sales_taxi_claim(h,123456790);
  if n <> 0 then raise exception 'Other Telegram user accessed draft'; end if;
  select count(*) into n from public.sales_taxi_claim(h,123456789);
  if n <> 1 then raise exception 'Same user cannot resume'; end if;
  update public.sales_taxi_drafts set expires_at=now()-interval '1 minute' where token_hash=h;
  select count(*) into n from public.sales_taxi_claim(h,123456789);
  if n <> 0 then raise exception 'Expired draft accessible'; end if;
  if has_table_privilege('anon','public.sales_taxi_drafts','SELECT') or has_table_privilege('authenticated','public.sales_taxi_drafts','SELECT') then
    raise exception 'Client role may access drafts';
  end if;
  if has_function_privilege('anon','public.sales_taxi_claim(text,bigint)','EXECUTE') or has_function_privilege('authenticated','public.sales_taxi_claim(text,bigint)','EXECUTE') then
    raise exception 'Client role may bind Telegram owner';
  end if;
end;
$$;
rollback;
