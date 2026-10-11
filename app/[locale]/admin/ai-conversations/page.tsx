import { createClient } from "@/lib/supabase/server";
export const dynamic = "force-dynamic";
export default async function ConversationsPage() {
  const db = await createClient();
  // Column grants deliberately exclude the bearer-token hash.
  const { data, error } = await db
    .from("sales_conversations")
    .select(
      "id,full_name,contact,locale,created_at,updated_at,summary,status,completed_at,completion_summary,summary_email_status,summary_email_sent_at",
    )
    .gt("expires_at", new Date().toISOString())
    .order("updated_at", { ascending: false })
    .limit(100);
  if (error) return <p role="alert">לא ניתן לטעון את הפניות כרגע.</p>;
  const { data: messages, error: messagesError } = data?.length
    ? await db
        .from("sales_messages")
        .select("conversation_id,role,content,created_at")
        .in(
          "conversation_id",
          data.map((row) => row.id),
        )
        .order("id")
    : { data: [], error: null };
  return (
    <section>
      <h2 className="text-2xl font-bold">פניות מעוזר המכירות</h2>
      <p className="mt-2 text-sm">
        פרטי קשר נשמרים לפני תחילת השיחה. מוצגות עד 100 הפניות האחרונות; השיחות
        נשמרות עד 30 יום. אין כאן אישור הזמנה.
      </p>
      {messagesError && <p role="alert">תוכן השיחות לא נטען.</p>}
      {!data?.length && <p className="mt-6">עדיין אין פניות.</p>}
      <div className="mt-6 space-y-4">
        {data?.map((row) => (
          <article key={row.id} className="rounded-xl border bg-white p-5">
            <h3 className="font-bold">{row.full_name}</h3>
            <p dir="auto">{row.contact}</p>
            <p className="mt-2 text-xs">
              {new Date(row.updated_at).toLocaleString("he-IL")} · {row.locale}
            </p>
            <p className="mt-3 whitespace-pre-wrap">
              {row.completion_summary ||
                row.summary ||
                "השאיר/ה פרטי קשר; השיחה טרם התחילה."}
            </p>
            <p className="mt-3 text-sm">
              {row.completed_at ? "השיחה הסתיימה" : "השיחה פעילה"} ·{" "}
              {row.summary_email_status === "sent"
                ? "הסיכום נשלח במייל"
                : row.summary_email_status === "failed"
                  ? "שליחת המייל נכשלה; נדרש טיפול"
                  : "הסיכום טרם נשלח"}
            </p>
            <details className="mt-3">
              <summary className="cursor-pointer">תוכן השיחה</summary>
              <div className="mt-3 space-y-3">
                {messages
                  ?.filter((m) => m.conversation_id === row.id)
                  .map((m, i) => (
                    <p
                      key={i}
                      dir="auto"
                      className="whitespace-pre-wrap break-words rounded-lg bg-brand-cream p-3"
                    >
                      <strong>
                        {m.role === "user" ? "לקוח: " : "עוזר AI: "}
                      </strong>
                      {m.content}
                    </p>
                  ))}
              </div>
            </details>
          </article>
        ))}
      </div>
    </section>
  );
}
