"use client";
import {useState, type FormEvent} from 'react';
import {useLocale} from 'next-intl';
import {createClient} from '@/lib/supabase/client';
import {organizedCopy} from '@/lib/organized-tours';
import {formatCurrency} from '@/lib/format';
import {FormField, Input, Textarea} from '@/components/ui/FormField';
import {Button} from '@/components/ui/Button';

export function OrganizedTourBookingForm({tourId,price,currency,capacity}:{tourId:string;price:number;currency:string;capacity:number}) {
 const locale=useLocale(),c=organizedCopy(locale);
 const [participants,setParticipants]=useState(1),[busy,setBusy]=useState(false),[result,setResult]=useState('');
 async function submit(e:FormEvent<HTMLFormElement>) {
  e.preventDefault();if(busy)return;setBusy(true);setResult('');
  const f=new FormData(e.currentTarget);
  try {
   const {error}=await createClient().from('organized_tour_bookings').insert({id:crypto.randomUUID(),tour_id:tourId,full_name:String(f.get('full_name')).trim(),phone:String(f.get('phone')).replace(/[\s()-]/g,''),participants,notes:String(f.get('notes')??'').trim()});
   setResult(error?'error':'done');
  }catch{setResult('error');}finally{setBusy(false);}
 }
 if(result==='done')return <p role="status" className="rounded-xl bg-brand-teal/10 p-5">{c.requested}</p>;
 return <form onSubmit={submit} className="grid gap-4">
  <FormField label={c.fullName} htmlFor="guest-name" required><Input id="guest-name" name="full_name" minLength={2} maxLength={120} required/></FormField>
  <FormField label={c.guestPhone} htmlFor="guest-phone" required><Input id="guest-phone" name="phone" type="tel" dir="ltr" minLength={7} maxLength={30} required/></FormField>
  <FormField label={c.participants} htmlFor="participants" required><Input id="participants" name="participants" type="number" min={1} max={capacity} step={1} value={participants} onChange={e=>setParticipants(Number(e.target.value))} required/></FormField>
  <p className="font-bold">{c.total}: {formatCurrency(price*(Number.isFinite(participants)?participants:0),currency,locale)}</p>
  <p className="text-sm">{c.direct}</p>
  <FormField label={c.notes} htmlFor="guest-notes"><Textarea id="guest-notes" name="notes" maxLength={2000}/></FormField>
  <label className="flex items-start gap-2 text-sm"><input type="checkbox" required className="mt-1"/>{c.consent}</label>
  {result==='error'&&<p role="alert" className="text-red-700">{c.requestError}</p>}
  <Button type="submit" disabled={busy}>{busy?c.sending:c.register}</Button>
 </form>;
}
