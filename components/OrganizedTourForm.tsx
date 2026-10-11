"use client";
import {useState, type FormEvent} from 'react';
import {useLocale} from 'next-intl';
import {createClient} from '@/lib/supabase/client';
import {organizedCopy, todayInUkraine, safeTourPhotos} from '@/lib/organized-tours';
import {FormField, Input, Select, Textarea} from '@/components/ui/FormField';
import {Button} from '@/components/ui/Button';
import {Link} from '@/i18n/navigation';
import {ProviderPhotoUpload} from '@/components/ProviderPhotoUpload';

export function OrganizedTourForm({userId}:{userId:string}) {
 const c=organizedCopy(useLocale());
 const [busy,setBusy]=useState(false), [result,setResult]=useState('');
 const [photos,setPhotos]=useState<string[]>([]);
 async function submit(e:FormEvent<HTMLFormElement>) {
  e.preventDefault(); if(busy) return; setBusy(true); setResult('');
  const f=new FormData(e.currentTarget);
  if(photos.length>12 || safeTourPhotos(photos).length!==photos.length){setResult('error');setBusy(false);return;}
  const text=(key:string)=>String(f.get(key)??'').trim();
  try {
   const {error}=await createClient().from('organized_tours').insert({organizer_id:userId,organizer_name:text('organizer_name'),contact_phone:text('contact_phone'),title:text('title'),destination:text('destination'),start_date:text('start_date'),end_date:text('end_date'),description:text('description'),included:text('included'),cancellation_terms:text('cancellation_terms'),payment_terms:text('payment_terms'),price:Number(f.get('price')),currency:text('currency'),capacity:Number(f.get('capacity')),photos:photos.slice(0,12)});
   setResult(error?'error':'done');
  } catch {setResult('error');} finally {setBusy(false);}
 }
 if(result==='done') return <div role="status" className="rounded-2xl bg-brand-teal/10 p-6"><p>{c.sent}</p><Link className="mt-4 block underline" href="/organized-tours/manage">{c.manage}</Link></div>;
 return <form onSubmit={submit} className="grid gap-5 sm:grid-cols-2">
  <FormField label={c.organizer} htmlFor="organizer_name" required><Input id="organizer_name" name="organizer_name" required minLength={2} maxLength={120}/></FormField>
  <FormField label={c.phone} htmlFor="contact_phone" required><Input id="contact_phone" name="contact_phone" type="tel" dir="ltr" required minLength={7} maxLength={30}/></FormField>
  <FormField label={c.name} htmlFor="title" required><Input id="title" name="title" required minLength={3} maxLength={160}/></FormField>
  <FormField label={c.destination} htmlFor="destination" required><Select id="destination" name="destination"><option value="uman">{c.uman}</option><option value="ukraine">{c.ukraine}</option></Select></FormField>
  <FormField label={c.start} htmlFor="start_date" required><Input id="start_date" name="start_date" type="date" min={todayInUkraine()} required/></FormField>
  <FormField label={c.end} htmlFor="end_date" required><Input id="end_date" name="end_date" type="date" min={todayInUkraine()} required/></FormField>
  <FormField label={c.price} htmlFor="price" required><Input id="price" name="price" type="number" min="0.01" step="0.01" max="9999999999" required/></FormField>
  <FormField label={c.currency} htmlFor="currency" required><Select id="currency" name="currency">{['USD','ILS','EUR','UAH'].map(x=><option key={x}>{x}</option>)}</Select></FormField>
  <FormField label={c.capacity} htmlFor="capacity" required><Input id="capacity" name="capacity" type="number" min={1} max={1000} step={1} required/></FormField>
  {(['description','included','cancellation_terms','payment_terms'] as const).map(key=><div className="sm:col-span-2" key={key}><FormField label={{description:c.description,included:c.included,cancellation_terms:c.cancellation,payment_terms:c.payment}[key]} htmlFor={key} required><Textarea id={key} name={key} required minLength={key==='description'?20:2} maxLength={key==='description'?12000:key==='included'?6000:4000}/></FormField></div>)}
  <p className="text-sm text-foreground/70 sm:col-span-2">{c.publishNotice}</p>
  <div className="sm:col-span-2"><ProviderPhotoUpload photos={photos} onChange={setPhotos}/></div>
  {result==='error'&&<p role="alert" className="text-red-700 sm:col-span-2">{c.failed}</p>}
  <Button disabled={busy} type="submit">{busy?c.sending:c.submit}</Button>
 </form>;
}
