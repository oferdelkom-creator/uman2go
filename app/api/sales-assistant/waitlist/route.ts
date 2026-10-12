import { NextResponse } from 'next/server';
import { currentConversation, hashToken, quota, validOrigin } from '@/lib/sales-assistant';
import { createAdminClient } from '@/lib/supabase/admin';
import { validateWaitlist, WAITLIST_CAMPAIGN, WAITLIST_CLOSE } from '@/lib/rosh-hashanah-waitlist';
export async function POST(request: Request) {
  if (!validOrigin(request)) return NextResponse.json({error:'בקשה לא מורשית.'},{status:403});
  if (Date.now() >= Date.parse(WAITLIST_CLOSE)) return NextResponse.json({error:'ההרשמה לקמפיין הסתיימה.'},{status:410});
  try {
    const session = await currentConversation();
    if (!session) return NextResponse.json({error:'יש להתחיל שיחה עם העוזר ולשמור פרטי קשר.'},{status:401});
    const raw = await request.text();
    if (raw.length > 2000) return NextResponse.json({error:'בקשה ארוכה מדי.'},{status:413});
    const input = validateWaitlist(JSON.parse(raw));
    if (!input) return NextResponse.json({error:'יש לבחור יעד, מספר נוסעים ולאשר הצטרפות.'},{status:400});
    if (!(await quota(request,'start'))) return NextResponse.json({error:'נא לנסות מאוחר יותר.'},{status:429});
    const {error} = await createAdminClient().from('rosh_hashanah_waitlist').upsert({
      campaign:WAITLIST_CAMPAIGN,contact_key:hashToken(session.contact.trim().toLowerCase().replace(/[\s()-]/g,'')),
      full_name:session.full_name,contact:session.contact,...input,
    },{onConflict:'campaign,contact_key',ignoreDuplicates:true});
    if (error) throw new Error('Waitlist unavailable');
    return NextResponse.json({registered:true});
  } catch {
    return NextResponse.json({error:'הרישום לא הושלם. אפשר לנסות שוב או לפנות לנציג.'},{status:503});
  }
}
