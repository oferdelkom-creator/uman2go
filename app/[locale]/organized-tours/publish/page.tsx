import {getLocale} from 'next-intl/server';
import {redirect} from '@/i18n/navigation';
import {createClient} from '@/lib/supabase/server';
import {organizedCopy} from '@/lib/organized-tours';
import {Section} from '@/components/ui/Section';
import {Card} from '@/components/ui/Card';
import {OrganizedTourForm} from '@/components/OrganizedTourForm';
export default async function PublishTourPage(){
 const locale=await getLocale(),c=organizedCopy(locale),db=await createClient();
 const {data:{user}}=await db.auth.getUser();
 if(!user){redirect({href:'/login?next=/organized-tours/publish',locale});return;}
 return <Section><div className="mx-auto max-w-3xl"><h1 className="text-3xl font-bold text-brand-navy">{c.publish}</h1><p className="mt-3">{c.intro}</p><Card className="mt-6 p-6"><OrganizedTourForm userId={user.id}/></Card></div></Section>;
}
