-- Disposable fixtures live only within this rolled-back transaction.
begin;
select set_config('app.test_owner',(select id::text from public.profiles where role<>'admin' limit 1),true);
select set_config('app.test_tour',gen_random_uuid()::text,true);
select set_config('app.test_booking',gen_random_uuid()::text,true);
select set_config('request.jwt.claim.sub',current_setting('app.test_owner'),true);
set local role authenticated;
insert into public.organized_tours(id,organizer_id,organizer_name,contact_phone,title,destination,start_date,end_date,description,included,cancellation_terms,payment_terms,price,currency,capacity)
values(current_setting('app.test_tour')::uuid,current_setting('app.test_owner')::uuid,'Test organizer','0000000000','Disposable test tour','uman',current_date+30,current_date+32,'Test itinerary for a disposable test tour','Test inclusion','Test cancellation','Pay organizer directly',100,'USD',2);
do $$ begin
 if not exists(select 1 from public.organized_tours where id=current_setting('app.test_tour')::uuid and status='pending') then raise exception 'owner cannot read pending tour'; end if;
 update public.organized_tours set status='active' where id=current_setting('app.test_tour')::uuid;
 if found then raise exception 'owner can self-publish'; end if;
end $$;
reset role;
set local role anon;
select set_config('request.jwt.claim.sub','',true);
do $$ begin
 if exists(select 1 from public.organized_tours where id=current_setting('app.test_tour')::uuid) then raise exception 'pending tour is public'; end if;
 begin
  perform * from public.organized_tour_bookings;
  raise exception 'guest can read bookings';
 exception when insufficient_privilege then null; end;
end $$;
reset role;
update public.organized_tours set status='active' where id=current_setting('app.test_tour')::uuid;
set local role anon;
insert into public.organized_tour_bookings(id,tour_id,full_name,phone,participants) values(current_setting('app.test_booking')::uuid,current_setting('app.test_tour')::uuid,'Test guest','0000000001',2);
do $$ begin
 begin
  insert into public.organized_tour_bookings(id,tour_id,full_name,phone,participants) values(gen_random_uuid(),current_setting('app.test_tour')::uuid,'Test guest','0000000001',1);
  raise exception 'duplicate not blocked';
 exception when raise_exception then if sqlerrm<>'duplicate_request' then raise; end if; end;
 begin
  insert into public.organized_tour_bookings(id,tour_id,full_name,phone,participants,status) values(gen_random_uuid(),current_setting('app.test_tour')::uuid,'Test guest','0000000002',1,'confirmed');
  raise exception 'guest can confirm';
 exception when insufficient_privilege then null; end;
end $$;
reset role;
select set_config('request.jwt.claim.sub',gen_random_uuid()::text,true);
set local role authenticated;
do $$ begin
 if exists(select 1 from public.organized_tour_bookings where id=current_setting('app.test_booking')::uuid) then raise exception 'outsider can read bookings'; end if;
 update public.organized_tour_bookings set status='confirmed' where id=current_setting('app.test_booking')::uuid;
 if found then raise exception 'outsider can confirm'; end if;
end $$;
reset role;
select set_config('request.jwt.claim.sub',current_setting('app.test_owner'),true);
set local role authenticated;
update public.organized_tour_bookings set status='confirmed' where id=current_setting('app.test_booking')::uuid;
do $$ begin
 if not exists(select 1 from public.organized_tour_bookings where id=current_setting('app.test_booking')::uuid and status='confirmed') then raise exception 'owner cannot confirm'; end if;
end $$;
insert into public.organized_tour_bookings(id,tour_id,full_name,phone,participants) values(gen_random_uuid(),current_setting('app.test_tour')::uuid,'Another test guest','0000000003',1);
do $$ begin
 begin
  update public.organized_tour_bookings set status='confirmed' where tour_id=current_setting('app.test_tour')::uuid and phone='0000000003';
  raise exception 'overbooking not blocked';
 exception when raise_exception then if sqlerrm<>'tour_full' then raise; end if; end;
end $$;
reset role;
update public.organized_tours set status='closed' where id=current_setting('app.test_tour')::uuid;
set local role authenticated;
update public.organized_tour_bookings set status='cancelled' where id=current_setting('app.test_booking')::uuid;
reset role;
rollback;
