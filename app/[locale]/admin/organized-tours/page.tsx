import {getLocale} from 'next-intl/server';
import {createClient} from '@/lib/supabase/server';
import {organizedCopy} from '@/lib/organized-tours';
import {Card} from '@/components/ui/Card';
import {OrganizedTourStatusButton} from '@/components/OrganizedTourStatusButton';
import {PhotoGallery} from '@/components/ui/PhotoGallery';
export default async function ReviewToursPage(){
 const c=organizedCopy(await getLocale()),db=await createClient();
 const {data:tours,error}=await db.from('organized_tours').select('*').order('created_at',{ascending:false});
 return <div><h2 className="text-2xl font-bold text-brand-navy">{c.admin}</h2><p className="mt-3">{c.review}</p>{error&&<p role="alert">{c.failed}</p>}{tours?.map(t=><Card key={t.id} className="mt-6 p-6"><h3 className="text-xl font-bold">{t.title}</h3><p>{t.organizer_name} · <bdi>{t.contact_phone}</bdi></p><p>{t.start_date} — {t.end_date} · {t.price} {t.currency} · {c.capacity}: {t.capacity}</p><p className="mt-2">{{pending:c.pending,active:c.active,rejected:c.rejected,closed:c.closed}[t.status]??t.status}</p>{t.photos.length>0&&<div className="mt-4"><PhotoGallery photos={t.photos} alt={t.title} kind="guide"/></div>}{[[c.description,t.description],[c.included,t.included],[c.cancellation,t.cancellation_terms],[c.payment,t.payment_terms]].map(([label,value])=><div key={label} className="mt-4"><h4 className="font-bold">{label}</h4><p className="whitespace-pre-line">{value}</p></div>)}<div className="mt-5 flex gap-3">{(t.status==='pending'||t.status==='rejected')&&<OrganizedTourStatusButton table="organized_tours" id={t.id} status="active" label={c.approve}/ >}{t.status!=='rejected'&&<OrganizedTourStatusButton table="organized_tours" id={t.id} status="rejected" label={c.reject}/ >}{t.status==='active'&&<OrganizedTourStatusButton table="organized_tours" id={t.id} status="closed" label={c.closed}/ >}</div></Card>)}</div>;
}
