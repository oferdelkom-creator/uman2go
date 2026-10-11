import {getLocale} from 'next-intl/server';
import {createClient} from '@/lib/supabase/server';
import {organizedCopy,todayInUkraine} from '@/lib/organized-tours';
import {formatCurrency,formatDate} from '@/lib/format';
import {Section} from '@/components/ui/Section';
import {Card} from '@/components/ui/Card';
import {ButtonLink} from '@/components/ui/Button';
export const metadata={title:'טיולים מאורגנים לאומן ולאוקראינה'};
export default async function OrganizedToursPage(){
 const locale=await getLocale(),c=organizedCopy(locale),db=await createClient();
 const {data:tours,error}=await db.from('organized_tours').select('*').eq('status','active').gte('start_date',todayInUkraine()).order('start_date');
 return <Section><h1 className="font-display text-4xl font-extrabold text-brand-navy">{c.title}</h1><p className="mt-3 max-w-2xl text-foreground/70">{c.intro}</p>
  <div className="my-6 flex flex-wrap gap-3"><ButtonLink href="/organized-tours/publish">{c.publish}</ButtonLink><ButtonLink href="/organized-tours/manage" variant="outline">{c.manage}</ButtonLink></div>
  {error?<p role="alert">{c.failed}</p>:tours?.length?<div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">{tours.map(t=><Card key={t.id} className="flex flex-col gap-4 p-6"><p className="text-sm text-brand-teal">{t.destination==='uman'?c.uman:c.ukraine}</p><h2 className="text-2xl font-bold text-brand-navy">{t.title}</h2><p>{t.organizer_name}</p><p>{formatDate(t.start_date,locale)} — {formatDate(t.end_date,locale)}</p><p className="line-clamp-3 text-foreground/70">{t.description}</p><p className="text-xl font-bold text-brand-terracotta">{formatCurrency(t.price,t.currency,locale)} <span className="text-sm">/ {c.price}</span></p><p className="text-sm">{c.direct}</p><ButtonLink href={`/organized-tours/${t.id}`}>{c.details}</ButtonLink></Card>)}</div>:<Card className="p-8"><p>{c.empty}</p></Card>}
 </Section>;
}
