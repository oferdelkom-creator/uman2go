import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
export async function POST(request:Request,{params}:{params:Promise<{id:string}>}){
 if(request.headers.get('origin')!==new URL(request.url).origin)return NextResponse.json({error:'Unauthorized'},{status:403});
 const client=await createClient();const {data:{user}}=await client.auth.getUser();
 if(!user)return NextResponse.json({error:'Unauthorized'},{status:401});
 const {data:profile}=await client.from('profiles').select('role').eq('id',user.id).single();if(profile?.role!=='admin')return NextResponse.json({error:'Unauthorized'},{status:403});
 try{
 const input=await request.json(); const {id}=await params;
 const db=createAdminClient();const {data:row}=await db.from('transfer_reservations').select('*').eq('id',id).single();if(!row)return NextResponse.json({error:'Not found'},{status:404});
 const reference=typeof input.reference==='string'?input.reference.trim():'';if(reference.length<3||reference.length>300)return NextResponse.json({error:'Evidence reference required'},{status:400});
 let update;
 if(input.action==='approve_supplier'&&row.status==='pending_supplier'&&typeof input.supplier_name==='string'&&input.supplier_name.trim().length>=2&&input.supplier_name.length<=200){update={status:'awaiting_deposit',supplier_name:input.supplier_name.trim(),supplier_reference:reference,supplier_approved_at:new Date().toISOString()};}
 else if(input.action==='verify_deposit'&&row.status==='awaiting_deposit'&&input.amount_cents===row.deposit_cents){update={status:'confirmed',payment_reference:reference,payment_verified_at:new Date().toISOString()};}
 else return NextResponse.json({error:'Invalid transition or deposit amount'},{status:409});
 const {data,error}=await db.from('transfer_reservations').update(update).eq('id',id).eq('status',row.status).select('id,status');if(error||!data?.length)return NextResponse.json({error:'Update failed'},{status:409});return NextResponse.json({ok:true,status:data[0].status});
 }catch{return NextResponse.json({error:'Invalid request'},{status:400});}
}
