import {getLocale} from 'next-intl/server';
import {redirect} from '@/i18n/navigation';
import {createClient} from '@/lib/supabase/server';
import {organizedCopy} from '@/lib/organized-tours';
import {Section} from '@/components/ui/Section';
import {Card} from '@/components/ui/Card';
import {ButtonLink} from '@/components/ui/Button';
import {OrganizedTourStatusButton} from '@/components/OrganizedTourStatusButton';
export default async function ManageToursPage(){
 const locale=await getLocale(),c=organizedCopy(locale),db=await createClient();
 const {data:{user}}=await db.auth.getUser();if(!user){redirect({href:'/login?next=/organized-tours/manage',locale});return;}
 const {data:tours,error}=await db.from('organized_tours').select('*').eq('organizer_id',user.id).order('created_at',{ascending:false});
 const ids=tours?.map(t=>t.id)??[];
 const {data:bookings,error:bookingError}=ids.length?await db.from('organized_tour_bookings').select('*').in('tour_id',ids).order('created_at',{ascending:false}):{data:[],error:null};
 return <Section><h1 className="text-3xl font-bold text-brand-navy">{c.manage}</h1><div className="my-5"><ButtonLink href="/organized-tours/publish">{c.publish}</ButtonLink></div>{(error||bookingError)&&<p role="alert">{c.failed}</p>}
 {tours?.map(t=><Card key={t.id} className="mb-6 p-6"><h2 className="text-2xl font-bold">{t.title}</h2><p className="mt-2">{{pending:c.pending,active:c.active,rejected:c.rejected,closed:c.closed}[t.status]??t.status}</p><h3 className="mt-5 font-bold">{c.bookings}</h3>
 {(bookings?.filter(b=>b.tour_id===t.id)??[]).map(b=><div key={b.id} className="mt-4 flex flex-wrap items-center justify-between gap-4 rounded-xl border p-4"><div><p className="font-bold">{b.full_name}</p><p><bdi>{b.phone}</bdi> · {c.participants}: {b.participants}</p><p className="whitespace-pre-line">{b.notes}</p><p>{{pending:c.pending,confirmed:c.confirmed,cancelled:c.cancelled}[b.status]??b.status}</p></div><div className="flex gap-2">{b.status==='pending'&&<OrganizedTourStatusButton table="organized_tour_bookings" id={b.id} status="confirmed" label={c.confirm}/ >}{b.status!=='cancelled'&&<OrganizedTourStatusButton table="organized_tour_bookings" id={b.id} status="cancelled" label={c.cancel}/>}</div></div>)}
 {!bookings?.some(b=>b.tour_id===t.id)&&<p className="mt-3">{c.noBookings}</p>}</Card>)}
 </Section>;
}
