"use client";
import { useState } from "react";
import { useRouter } from "@/i18n/navigation";
export function TransferReservationActions({id,status,depositCents}:{id:string;status:string;depositCents:number}){
 const router=useRouter();const [busy,setBusy]=useState(false);const [error,setError]=useState('');
 async function submit(e:React.FormEvent<HTMLFormElement>){e.preventDefault();setBusy(true);setError('');const f=new FormData(e.currentTarget);try{const r=await fetch(`/api/admin/transfer-reservations/${id}`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({action:status==='pending_supplier'?'approve_supplier':'verify_deposit',supplier_name:f.get('supplier_name'),reference:f.get('reference'),amount_cents:Math.round(Number(f.get('amount'))*100)})});if(!r.ok)throw Error();router.refresh();}catch{setError('לא נשמר. בדקו את האסמכתה, הסכום והסטטוס.');}finally{setBusy(false);}}
 if(status!=='pending_supplier'&&status!=='awaiting_deposit')return null;
 return <form onSubmit={submit} className="mt-4 grid gap-3 rounded-lg border p-3">
 {status==='pending_supplier'?<label>שם הספק המאשר<input name="supplier_name" required minLength={2} maxLength={200} className="ms-2 rounded border p-2"/></label>:<label>סכום מקדמה שהתקבל בדולר<input name="amount" type="number" min={0.01} step={0.01} required placeholder={(depositCents/100).toFixed(2)} className="ms-2 rounded border p-2"/></label>}
 <label>{status==='pending_supplier'?'אסמכתה לאישור הספק בכתב':'מספר עסקה / אסמכתה לתשלום שנבדק'}<input name="reference" required minLength={3} maxLength={300} className="ms-2 rounded border p-2"/></label>
 <label><input type="checkbox" required/> {status==='pending_supplier'?'בדקתי אישור ספק לפרטי הנסיעה ולמחיר':'אימתתי בפועל שהמקדמה שולמה; זו אינה יצירת חיוב'}</label>
 <button disabled={busy} className="rounded border p-2">{busy?'שומר…':status==='pending_supplier'?'תיעוד אישור ספק':'אימות מקדמה ואישור הזמנה'}</button>{error&&<p role="alert">{error}</p>}
 </form>;
}
