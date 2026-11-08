'use client';

import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import { Analytics, type BeforeSendEvent } from '@vercel/analytics/next';
import { CONSENT_KEY, filterPageview, readConsent, PUBLIC_HOSTS, PUBLIC_PATHS } from '@/lib/vercel-pageviews';

const COPY: Record<string, {title: string; text: string; decline: string; allow: string}> = {
  "he": {
    "title": "העדפות מדידה",
    "text": "רק באישורכם, Vercel Analytics יספור צפיות בדפי הבית הציבוריים. נתוני לקוחות, הזמנות, תשלומים, חשבון, ניהול ותוכן טפסים אינם נשלחים; פרמטרים ומקטעים בכתובת מוסרים. הבחירה נשמרת מקומית ל־180 יום ואפשר לסרב או לבטל בכל עת בהעדפות המדידה.",
    "decline": "ללא מדידה",
    "allow": "אישור מדידה"
  },
  "en": {
    "title": "Analytics preferences",
    "text": "Only with your permission, Vercel Analytics counts views of public home pages. Customer, booking, payment, account, admin and form content is excluded; URL queries and fragments are removed. Your choice is stored locally for 180 days. You can decline or withdraw at any time in Analytics preferences.",
    "decline": "Decline",
    "allow": "Allow analytics"
  },
  "fr": {
    "title": "Préférences de mesure",
    "text": "Uniquement avec votre accord, Vercel Analytics compte les visites des pages d’accueil publiques. Les données clients, réservations, paiements, comptes, administration et formulaires sont exclues ; les paramètres et fragments des URL sont supprimés. Votre choix est conservé localement pendant 180 jours. Vous pouvez refuser ou retirer votre accord dans les préférences de mesure.",
    "decline": "Refuser",
    "allow": "Autoriser la mesure"
  },
  "uk": {
    "title": "Налаштування аналітики",
    "text": "Лише за вашою згодою Vercel Analytics рахує перегляди загальнодоступних головних сторінок. Дані клієнтів, бронювань, платежів, облікового запису, адміністрації та форм виключені; параметри й фрагменти URL видаляються. Вибір зберігається локально 180 днів. Ви можете відмовитися або відкликати згоду в налаштуваннях аналітики.",
    "decline": "Відмовитися",
    "allow": "Дозволити аналітику"
  }
};

function beforeSend(event: BeforeSendEvent) {
  try { return filterPageview(event, window); } catch { return null; }
}

export default function VercelPageviews({locale}: {locale: string}) {
  usePathname(); // Re-render on navigation, while the filter checks the actual browser URL.
  const c = COPY[locale] ?? COPY.he;
  const [choice, setChoice] = useState<'granted' | 'denied' | null>(null);
  const [ready, setReady] = useState(false);
  const [open, setOpen] = useState(false);
  useEffect(() => {
    const refresh = () => {
      try { setChoice(readConsent(window.localStorage)); } catch { setChoice(null); }
      setReady(true);
    };
    refresh();
    window.addEventListener('storage', refresh);
    const timer = window.setInterval(refresh, 60000);
    return () => { window.removeEventListener('storage', refresh); window.clearInterval(timer); };
  }, []);
  function choose(value: 'granted' | 'denied') {
    try {
      localStorage.setItem(CONSENT_KEY, JSON.stringify({value, at: Date.now()}));
      setChoice(value);
    } catch { setChoice(null); }
    setOpen(false);
  }
  const publicPage = ready && PUBLIC_HOSTS.includes(window.location.hostname) && PUBLIC_PATHS.has(window.location.pathname);
  if (!publicPage) return null;
  return <>
    {choice === 'granted' && <Analytics beforeSend={beforeSend} debug={false} />}
    {(choice === null || open) ? <aside aria-label={c.title} lang={locale} dir={locale === 'he' ? 'rtl' : 'ltr'}
      style={{position:'fixed',bottom:12,left:12,right:12,zIndex:1000,background:'#fff',color:'#172c28',border:'1px solid #b9c9c2',borderRadius:12,padding:16,boxShadow:'0 4px 20px #0002',maxWidth:600,margin:'0 auto',fontSize:14}}>
      <p style={{margin:'0 0 12px'}}>{c.text}</p>
      <div style={{display:'flex',gap:12,flexWrap:'wrap'}}>
        <button type="button" onClick={() => choose('denied')}>{c.decline}</button>
        <button type="button" onClick={() => choose('granted')}>{c.allow}</button>
      </div>
    </aside> : <button type="button" onClick={() => setOpen(true)}
      style={{position:'fixed',bottom:8,left:8,zIndex:999,fontSize:12,background:'#fff',color:'#172c28',border:'1px solid #b9c9c2',borderRadius:8,padding:'4px 8px'}}>{c.title}</button>}
  </>;
}
