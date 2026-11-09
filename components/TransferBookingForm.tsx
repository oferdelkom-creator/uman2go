"use client";
import { useState, type FormEvent } from "react";
import { useLocale } from "next-intl";
import { TRANSFER_VEHICLES, TRANSFER_STOPS, transferQuote, usd } from "@/lib/transfer-pricing";
export function TransferBookingForm({initialVehicle='private',initialStops='none'}:{initialVehicle?:string;initialStops?:string}){
 const he=useLocale()==='he';
 const [vehicle,setVehicle]=useState(TRANSFER_VEHICLES.some(v=>v.code===initialVehicle)?initialVehicle:'private');
 const [stops,setStops]=useState(TRANSFER_STOPS.some(s=>s.code===initialStops)?initialStops:'none');
 const [id,setId]=useState<string|null>(null);const [status,setStatus]=useState('idle');
 const q=transferQuote(vehicle,stops);
 async function submit(e:FormEvent<HTMLFormElement>){e.preventDefault();setStatus('saving');const form=new FormData(e.currentTarget);const requestId=id??crypto.randomUUID();setId(requestId);try{
 const response=await fetch('/api/transport/reservations',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({id:requestId,vehicle_code:vehicle,stops_code:stops,full_name:form.get('full_name'),contact:form.get('contact'),departure_date:form.get('departure_date'),departure_time:form.get('departure_time'),pickup:form.get('pickup'),passengers:Number(form.get('passengers')),notes:form.get('notes'),consent:form.get('consent')==='on'})});if(!response.ok)throw Error();setStatus('saved');}catch{setStatus('error');}}
 if(status==='saved')return <div role="status" className="rounded-xl bg-green-50 p-5">{he?'בקשת ההזמנה נשמרה וממתינה לאישור ספק. לא בוצע חיוב. לאחר אישור הספק הצוות יתאם תשלום מקדמה; ההזמנה תאושר סופית רק לאחר אימות התשלום.':'Your request was saved and is awaiting supplier approval. No charge was made. The team will coordinate the advance after supplier approval; final confirmation requires verified payment.'}</div>;
 const label=(a:string,b:string)=>he?a:b;
 return <form onSubmit={submit} className="grid gap-4" aria-busy={status==='saving'}>
 <h2 className="text-xl font-bold">{label('בקשת הזמנה לפי מחירון קישינב → אומן','Request a Chisinau → Uman transfer')}</h2>
 <label>{label('רכב','Vehicle')}<select name="vehicle" value={vehicle} onChange={e=>setVehicle(e.target.value)} className="mt-1 block w-full rounded border p-3">{TRANSFER_VEHICLES.map(v=><option key={v.code} value={v.code}>{he?v.he:v.en}</option>)}</select></label>
 <label>{label('עצירות','Stops')}<select value={stops} onChange={e=>setStops(e.target.value)} className="mt-1 block w-full rounded border p-3">{TRANSFER_STOPS.map(s=><option key={s.code} value={s.code}>{he?s.he:s.en}</option>)}</select></label>
 <div className="rounded-xl bg-brand-cream p-4" aria-live="polite"><p>{label('מחיר כולל לרכב (עמלת לקוח כלולה)','Vehicle total (customer fee included)')}: <b dir="ltr">{usd(q.totalCents)}</b></p><p>{label('מקדמה לאתר מתוך המחיר','Advance included in total')}: <b dir="ltr">{usd(q.depositCents)}</b></p><p>{label('יתרה ישירות לנהג','Balance directly to driver')}: <b dir="ltr">{usd(q.driverBalanceCents)}</b></p></div>
 {[['full_name',label('שם מלא','Full name'),'text'],['contact',label('טלפון או אימייל','Phone or email'),'text'],['departure_date',label('תאריך נסיעה','Journey date'),'date'],['departure_time',label('שעת איסוף (שעון קישינב)','Pickup time (Chisinau local time)'),'time'],['pickup',label('נקודת איסוף בקישינב','Pickup location in Chisinau'),'text']].map(([name,text,type])=><label key={name}>{text}<input className="mt-1 block w-full rounded border p-3" name={name} type={type} maxLength={name==='pickup'?400:160} required /></label>)}
 <label>{label('מספר נוסעים','Passengers')}<input name="passengers" type="number" min={1} max={q.capacity} defaultValue={1} required className="mt-1 block w-full rounded border p-3"/></label>
 <label>{label('הערות: טיסה, כבודה, יעד באומן וצרכים נוספים','Notes: flight, luggage, Uman drop-off and additional needs')}<textarea name="notes" maxLength={1500} className="mt-1 block w-full rounded border p-3"/></label>
 <label className="flex gap-3"><input type="checkbox" name="consent" required/><span>{label('אני מאשר/ת את פרטי הבקשה ואת חלוקת התשלום, ומסכים/ה לשמירתם ולפניית הצוות לצורך ההזמנה. ידוע לי שנדרשים אישור ספק ואימות מקדמה; שליחת הטופס אינה הזמנה מאושרת ואינה תשלום.','I approve the request details and payment split, and agree to storing them and follow-up for this booking. Supplier approval and verified advance payment are required; submission is not a confirmed booking or payment.')}</span></label>
 {status==='error'&&<p role="alert">{label('הבקשה לא נשמרה. בדקו את הפרטים ונסו שוב.','Request not saved. Check the details and try again.')}</p>}
 <button disabled={status==='saving'} className="rounded-xl bg-brand-terracotta p-3 font-semibold text-white disabled:opacity-50">{status==='saving'?label('שומר…','Saving…'):label('אישור ושליחת בקשת הזמנה','Confirm and submit request')}</button>
 </form>;
}
