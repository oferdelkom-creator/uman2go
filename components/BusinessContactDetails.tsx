import { getLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";

const copy: Record<string, {title: string; company: string; registration: string; address: string; phone: string; email: string; terms: string; cancel: string}> = {
  he: {title:"פרטי העסק ויצירת קשר",company:"דלקום ע י קום בע״מ",registration:"ח״פ 515917516",address:"לוי אשכול 80, דירה 2, תל אביב, ישראל",phone:"טלפון",email:"דוא״ל",terms:"תקנון האתר וזכויות הצרכן",cancel:"ביטול עסקה / הזמנה"},
  en: {title:"Business details and contact",company:"דלקום ע י קום בע״מ",registration:"Israeli company no. 515917516",address:"80 Levi Eshkol St., Apt. 2, Tel Aviv, Israel",phone:"Phone",email:"Email",terms:"Terms and consumer rights",cancel:"Cancel a transaction / booking"},
  fr: {title:"Entreprise et coordonnées",company:"דלקום ע י קום בע״מ",registration:"Société israélienne n° 515917516",address:"80 rue Levi Eshkol, appartement 2, Tel Aviv, Israël",phone:"Téléphone",email:"E-mail",terms:"Conditions et droits des consommateurs",cancel:"Annuler une transaction / réservation"},
  uk: {title:"Компанія та контакти",company:"דלקום ע י קום בע״מ",registration:"Реєстраційний номер компанії в Ізраїлі: 515917516",address:"вул. Леві Ешколь, 80, кв. 2, Тель-Авів, Ізраїль",phone:"Телефон",email:"Електронна пошта",terms:"Умови та права споживачів",cancel:"Скасувати замовлення / бронювання"}
};

export async function BusinessContactDetails({ footer = false }: { footer?: boolean }) {
  const locale = await getLocale();
  const c = copy[locale] ?? copy.en;
  const linkClass = "underline underline-offset-4 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4";
  return (
    <section aria-label={c.title} className={footer ? "mt-8 border-t border-white/20 pt-6 text-sm text-white" : "mb-6 border-b border-brand-navy/10 pb-6 text-brand-navy"}>
      <h2 className="font-semibold">{c.title}</h2>
      <p className="mt-2">UMAN2GO · <bdi dir="rtl">{c.company}</bdi> · {c.registration}</p>
      <address className="mt-2 not-italic">{c.address}</address>
      <p className="mt-2">{c.phone}: <a className={linkClass} href="tel:+972523181877"><bdi dir="ltr">052-318-1877</bdi></a></p>
      <p className="mt-2">{c.email}: <a className={linkClass} href="mailto:ofer.delkom@gmail.com"><bdi dir="ltr">ofer.delkom@gmail.com</bdi></a></p>
      <div className="mt-4 flex flex-wrap gap-x-6 gap-y-3">
        <Link className={linkClass} href="/terms">{c.terms}</Link>
        <Link className={linkClass} href="/terms#cancellation">{c.cancel}</Link>
      </div>
    </section>
  );
}
