"use client";
import { useLocale } from "next-intl";
import { Link } from "@/i18n/navigation";
const notices: Record<string, { text: string; link: string }> = {
 he: {text:"מסירת הפרטים לבחירתכם; ללא הפרטים הנחוצים לא נוכל לטפל בבקשה. דלקום ע י קום בע״מ (ח״פ 515917516) תשתמש בהם לטיפול, תיאום ותמיכה ותעביר את הדרוש לצוות, לספק השירות ולספקי התשתית; בשיחת הבוט גם לשירות AI ולסיכום בדוא״ל. ניתן לבקש עיון ותיקון ב־ofer.delkom@gmail.com. פרטים על המטרות, הנמענים וזכויותיכם:",link:"מדיניות פרטיות"},
 en: {text:"Providing details is your choice; without necessary details we may be unable to handle your request. דלקום ע י קום בע״מ (company no. 515917516) uses them for handling, coordination and support and shares what is needed with its team, relevant providers and infrastructure services; bot messages also reach an AI service and email summaries. Request access or correction at ofer.delkom@gmail.com. Purposes, recipients and rights:",link:"Privacy policy"},
 fr: {text:"Fournir vos données est facultatif ; sans les informations nécessaires, votre demande peut ne pas être traitée. דלקום ע י קום בע״מ (n° 515917516) les utilise pour le suivi et les partage selon les besoins avec son équipe, le prestataire concerné et les services techniques ; le chat utilise aussi une IA et des résumés par e-mail. Accès et rectification : ofer.delkom@gmail.com. Finalités, destinataires et droits :",link:"Politique de confidentialité"},
 uk: {text:"Надання даних добровільне; без необхідних відомостей ми можемо не опрацювати запит. דלקום ע י קום בע״מ (№ 515917516) використовує їх для підтримки й координації та передає необхідне команді, відповідному постачальнику й технічним сервісам; чат також використовує ШІ та підсумки електронною поштою. Доступ і виправлення: ofer.delkom@gmail.com. Цілі, одержувачі та права:",link:"Політика конфіденційності"}
};
export function PrivacyNotice() {
 const locale = useLocale();
 const c = notices[locale] ?? notices.en;
 return <p className="rounded-xl bg-brand-navy/5 p-3 text-sm leading-6 text-brand-navy">{c.text}{" "}<Link href="/privacy" className="font-semibold underline underline-offset-4 focus-visible:outline focus-visible:outline-2">{c.link}</Link>.</p>;
}
