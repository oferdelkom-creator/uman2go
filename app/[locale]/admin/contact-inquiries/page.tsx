import { createClient } from "@/lib/supabase/server";
import { ContactInquiryStatus } from "@/components/ContactInquiryStatus";

export const dynamic = "force-dynamic";
export default async function ContactInquiriesPage() {
  const db = await createClient();
  const { data, error } = await db.from("contact_inquiries")
    .select("id,full_name,email,message,status,created_at,email_status")
    .order("created_at", { ascending: false }).limit(200);
  if (error) return <p role="alert">לא ניתן לטעון את הפניות. נסו שוב.</p>;
  return <section dir="rtl">
    <h2 className="text-2xl font-bold">פניות מטופס יצירת קשר</h2>
    <p className="mt-2">הפניות נשמרות לפני שליחת מייל. מוצגות עד 200 הפניות האחרונות.</p>
    {!data?.length && <p className="mt-6">עדיין אין פניות.</p>}
    <div className="mt-6 space-y-4">{data?.map(row => <article key={row.id} className="rounded-xl border bg-white p-5">
      <h3 className="font-bold">{row.full_name}</h3>
      <a href={`mailto:${row.email}`} dir="ltr" className="underline">{row.email}</a>
      <p className="mt-2 text-sm">{new Date(row.created_at).toLocaleString("he-IL")}</p>
      <p dir="auto" className="my-4 whitespace-pre-wrap break-words">{row.message}</p>
      <p className="mb-3">{row.email_status === "sent" ? "התראה נשלחה במייל" : "נדרש טיפול: התראת המייל נכשלה או טרם נשלחה"}</p>
      <ContactInquiryStatus id={row.id} initialStatus={row.status} />
    </article>)}</div>
  </section>;
}
