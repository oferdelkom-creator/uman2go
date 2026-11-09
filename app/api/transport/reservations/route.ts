import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { quota, validOrigin } from "@/lib/sales-assistant";
import { validateTransferDetails } from "@/lib/transfer-pricing";
import { notifyTransferReservation, transferReservationPayload } from "@/lib/transfer-reservations";
export async function POST(request:Request){
 if(!validOrigin(request))return NextResponse.json({error:'Unauthorized'},{status:403});
 try {
 const raw=await request.text();if(raw.length>10000)return NextResponse.json({error:'Request too large'},{status:413});
 const input=JSON.parse(raw);
 if(!input||input.consent!==true||typeof input.id!=='string'||!/^[\da-f]{8}-[\da-f]{4}-4[\da-f]{3}-[89ab][\da-f]{3}-[\da-f]{12}$/i.test(input.id)||typeof input.full_name!=='string'||input.full_name.trim().length<2||input.full_name.length>100||typeof input.contact!=='string'||!(/^\+?[\d ()-]{7,24}$/.test(input.contact)||/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input.contact))||input.contact.length>160) return NextResponse.json({error:'Invalid contact or consent'},{status:400});
 const details=validateTransferDetails(input);
 if(!(await quota(request,'start')))return NextResponse.json({error:'Too many requests'},{status:429});
 const {data,error}=await createAdminClient().from('transfer_reservations').upsert({id:input.id,...transferReservationPayload(details),source:'website',full_name:input.full_name.trim(),contact:input.contact.trim(),status:'pending_supplier',submitted_at:new Date().toISOString()},{onConflict:'id',ignoreDuplicates:true}).select('id');
 if(error)return NextResponse.json({error:'Request was not saved'},{status:503});
 if(data?.length)await notifyTransferReservation(input.id);
 return NextResponse.json({saved:true,status:'pending_supplier',quote:details.quote});
 }catch{return NextResponse.json({error:'Check the journey details'},{status:400});}
}
