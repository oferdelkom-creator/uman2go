import { createClient } from '@/lib/supabase/server';
import { CITY_LABELS, WAITLIST_CAMPAIGN } from '@/lib/rosh-hashanah-waitlist';
export const dynamic='force-dynamic';
export default async function Page(){
 const db=await createClient();
 const {data,error,count}=await db.from('rosh_hashanah_waitlist').select('id,full_name,contact,departure_city,passengers,installments,created_at,consent_at',{count:'exact'}).eq('campaign',WAITLIST_CAMPAIGN).gt('expires_at',new Date().toISOString()).order('created_at',{ascending:false}).limit(500);
 if(error)return <p role="alert">לא ניתן לטעון את רשימת ההמתנה.</p>;
 return <section><h2 className="text-2xl font-bold">רשימת המתנה לטיסות ראש השנה 2027</h2><p className="mt-3">{count??0} נרשמים ייחודיים לפי פרטי קשר. מוצגות עד 500 הרשומות האחרונות. זו התעניינות, ללא הזמנה או אישור תשלומים. הנתונים נשמרים עד 1.11.2027.</p><div className="mt-4 flex flex-wrap gap-4">{Object.entries(CITY_LABELS).map(([city,label])=><p key={city}>{label}: {data?.filter(r=>r.departure_city===city).reduce((n,r)=>n+r.passengers,0)??0} נוסעים ברשומות המוצגות</p>)}</div><div className="mt-6 overflow-x-auto"><table className="w-full text-start"><thead><tr>{['שם','פרטי קשר','עיר יציאה','נוסעים','תשלומים מועדפים','מועד הסכמה'].map(x=><th key={x} className="p-3 text-start">{x}</th>)}</tr></thead><tbody>{data?.map(r=><tr key={r.id} className="border-t"><td className="p-3">{r.full_name}</td><td className="p-3" dir="auto">{r.contact}</td><td className="p-3">{CITY_LABELS[r.departure_city]}</td><td className="p-3">{r.passengers}</td><td className="p-3">{r.installments??'לא נמסר'}</td><td className="p-3">{new Date(r.consent_at).toLocaleString('he-IL',{timeZone:'Asia/Jerusalem'})}</td></tr>)}</tbody></table></div></section>;
}
