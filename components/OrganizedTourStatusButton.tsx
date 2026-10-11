"use client";
import {useState} from 'react';
import {useLocale} from 'next-intl';
import {useRouter} from '@/i18n/navigation';
import {createClient} from '@/lib/supabase/client';
import {organizedCopy} from '@/lib/organized-tours';
import {Button} from '@/components/ui/Button';

export function OrganizedTourStatusButton({id,table,status,label}:{id:string;table:'organized_tours'|'organized_tour_bookings';status:string;label:string}) {
 const router=useRouter(), c=organizedCopy(useLocale());
 const [busy,setBusy]=useState(false),[error,setError]=useState(false);
 async function update(){setBusy(true);setError(false);try{const {data,error}=await createClient().from(table).update({status}).eq('id',id).select('id');if(error||!data?.length)setError(true);else router.refresh();}catch{setError(true);}finally{setBusy(false);}}
 return <div><Button type="button" variant="outline" disabled={busy} onClick={update}>{busy?c.sending:label}</Button>{error&&<p role="alert" className="text-sm text-red-700">{c.failed}</p>}</div>;
}
