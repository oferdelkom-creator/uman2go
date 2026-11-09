import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";
import { transferQuoteText, validateTransferDetails, isTransferConfirmation } from "@/lib/transfer-pricing";
import { escapeContactHtml } from "@/lib/contact-inquiry";
import { resend, EMAIL_FROM, ADMIN_EMAIL } from "@/lib/resend";
import type { Json } from "@/lib/types";

export type TransferDetails = ReturnType<typeof validateTransferDetails>;
export function transferReservationPayload(details: TransferDetails) {
 const q=details.quote;
 return {vehicle_code:q.vehicleCode,stops_code:q.stopsCode,departure_date:details.departure_date,departure_time:details.departure_time,passengers:details.passengers,pickup:details.pickup,notes:details.notes,pricing_version:q.version,currency:q.currency,quote:q as unknown as Json,total_cents:q.totalCents,deposit_cents:q.depositCents,driver_balance_cents:q.driverBalanceCents};
}
export async function notifyTransferReservation(id: string) {
 const db=createAdminClient();
 const {data:row,error}=await db.from('transfer_reservations').select('*').eq('id',id).neq('status','draft').single();
 if(error||!row)return;
 let sent=false;
 try {
 const result=await resend.emails.send({from:EMAIL_FROM,to:ADMIN_EMAIL,subject:'UMAN2GO — בקשת הזמנת הסעה לפי מחירון',html:`<div dir="rtl"><h2>בקשת הזמנת הסעה - ממתינה לאישור ספק</h2><p>${escapeContactHtml(row.full_name)} | ${escapeContactHtml(row.contact)}</p><p>${escapeContactHtml(row.departure_date!)} ${escapeContactHtml(row.departure_time!)} (שעון קישינב)</p><p>${escapeContactHtml(row.pickup!)} | ${row.passengers} נוסעים</p><p>מחיר כולל: $${(row.total_cents/100).toFixed(2)}; מקדמה לאתר: $${(row.deposit_cents/100).toFixed(2)}; יתרה לנהג: $${(row.driver_balance_cents/100).toFixed(2)}</p><p>${escapeContactHtml(row.notes)}</p><p>הפנייה נשמרה במערכת. אין אישור ספק ואין אישור תשלום בשלב זה.</p><a href="https://www.uman2go.com/admin/transport">ניהול הפנייה</a></div>`},{idempotencyKey:`transfer-reservation/${id}`});
 sent=!result.error;
 }catch { /* The request is durable even if the notification fails. */ }
 await db.from('transfer_reservations').update({notification_status:sent?'sent':'failed'}).eq('id',id);
}
export async function prepareSalesTransferDraft(session:{id:string;full_name:string;contact:string;locale:string},input:Record<string,unknown>) {
 const details=validateTransferDetails(input);
 const {data,error}=await createAdminClient().from('transfer_reservations').insert({...transferReservationPayload(details),source:'bot',conversation_id:session.id,full_name:session.full_name,contact:session.contact,status:'draft'}).select('id').single();
 if(error)throw new Error('Transfer draft could not be saved');
 const description=`${details.departure_date} ${details.departure_time} (Europe/Chisinau), ${details.pickup}; ${details.passengers} ${session.locale==='he'?'נוסעים':'passengers'}`;
 return {id:data.id,reply:transferQuoteText(details.quote,session.locale)+'\n'+description+'\n'+(session.locale==='he'?'לאשר שמירת בקשת ההזמנה עם הפרטים והמחיר האלה? האישור שומר בקשה לצוות; הוא אינו אישור ספק ואינו תשלום.':'Confirm saving the booking request with these details and price? This submits a request to the team; it is not supplier approval or payment.')};
}
export async function submitSalesTransferDraft(conversationId:string,message:string,locale:string,turnStartedAt:string) {
 // Require the visitor's own explicit confirmation, not merely a model-supplied flag.
 if(!isTransferConfirmation(message))throw new Error('Explicit customer confirmation required');
 const db=createAdminClient();
 const {data:row,error}=await db.from('transfer_reservations').select('*').eq('conversation_id',conversationId).eq('source','bot').order('created_at',{ascending:false}).limit(1).maybeSingle();
 if(error||!row)throw new Error('Prepare a booking summary first');
 if(Date.parse(row.created_at)>=Date.parse(turnStartedAt))throw new Error('Confirm the summary in a subsequent customer message');
 if(row.status!=='draft')return {id:row.id,reply:locale==='he'?'בקשת ההזמנה כבר נשמרה לצוות. היא עדיין כפופה לאישור ספק ולאימות מקדמה.':'Your request has already been saved. Supplier approval and verified advance payment are still required.'};
 if(Date.parse(row.expires_at)<=Date.now())throw new Error('Quote expired; prepare a new summary');
 const {data:updated,error:updateError}=await db.from('transfer_reservations').update({status:'pending_supplier',submitted_at:new Date().toISOString()}).eq('id',row.id).eq('status','draft').select('id');
 if(updateError||!updated?.length)throw new Error('Could not submit booking request');
 await notifyTransferReservation(row.id);
 return {id:row.id,reply:locale==='he'?`בקשת ההזמנה נשמרה ונשלחה לטיפול הצוות. מחיר כולל: $${(row.total_cents/100).toFixed(2)}; מקדמה לאתר: $${(row.deposit_cents/100).toFixed(2)}; יתרה לנהג: $${(row.driver_balance_cents/100).toFixed(2)}. טרם אושרה זמינות וטרם אומת תשלום. הצוות יתאם אישור ספק ותשלום מקדמה; רק לאחר שניהם ההזמנה תהיה מאושרת.`:`Your booking request was saved for the team. Total: $${(row.total_cents/100).toFixed(2)}; platform advance: $${(row.deposit_cents/100).toFixed(2)}; driver balance: $${(row.driver_balance_cents/100).toFixed(2)}. Supplier approval and verified advance payment are still required before final confirmation.`};
}
