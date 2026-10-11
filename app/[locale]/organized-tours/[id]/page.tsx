import {getLocale} from 'next-intl/server';
import {notFound} from 'next/navigation';
import {Link} from '@/i18n/navigation';
import {createClient} from '@/lib/supabase/server';
import {organizedCopy,todayInUkraine} from '@/lib/organized-tours';
import {formatCurrency,formatDate} from '@/lib/format';
import {Section} from '@/components/ui/Section';
import {Card} from '@/components/ui/Card';
import {OrganizedTourBookingForm} from '@/components/OrganizedTourBookingForm';
import {PhotoGallery} from '@/components/ui/PhotoGallery';
export default async function TourPage({params}:{params:Promise<{id:string}>}){
 const {id}=await params;if(!/^[0-9a-f-]{36}$/i.test(id))notFound();
 const locale=await getLocale(),c=organizedCopy(locale),db=await createClient();
 const {data:t}=await db.from('organized_tours').select('*').eq('id',id).eq('status','active').gte('start_date',todayInUkraine()).maybeSingle();
 if(!t)notFound();
 return <Section><Link href="/organized-tours" className="text-brand-teal underline">{c.back}</Link><div className="mt-5"><PhotoGallery photos={t.photos} alt={t.title} kind="guide"/></div><h1 className="mt-5 text-4xl font-bold text-brand-navy">{t.title}</h1><p className="mt-3">{t.organizer_name} · {t.destination==='uman'?c.uman:c.ukraine}</p><p className="mt-2">{formatDate(t.start_date,locale)} — {formatDate(t.end_date,locale)}</p>
  <div className="mt-8 grid gap-8 lg:grid-cols-3"><div className="lg:col-span-2">{[[c.description,t.description],[c.included,t.included],[c.cancellation,t.cancellation_terms],[c.payment,t.payment_terms]].map(([label,value])=><Card key={label} className="mb-5 p-6"><h2 className="text-xl font-bold text-brand-navy">{label}</h2><p className="mt-3 whitespace-pre-line">{value}</p></Card>)}<a href={`tel:${t.contact_phone.replace(/[^+0-9]/g,'')}`} className="text-brand-teal underline">{c.contact}: <bdi>{t.contact_phone}</bdi></a></div>
  <Card className="h-fit p-6"><h2 className="mb-5 text-2xl font-bold">{formatCurrency(t.price,t.currency,locale)} <span className="text-sm">/ {c.price}</span></h2><OrganizedTourBookingForm tourId={t.id} price={t.price} currency={t.currency} capacity={t.capacity}/></Card></div>
 </Section>;
}
