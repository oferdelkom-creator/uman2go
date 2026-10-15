import { NextResponse } from "next/server";
import { resend, EMAIL_FROM, ADMIN_EMAIL } from "@/lib/resend";
import { renderEmail } from "@/lib/emailTemplate";
import { createAdminClient } from "@/lib/supabase/admin";
import { parseContactInquiry, escapeContactHtml } from "@/lib/contact-inquiry";

export async function POST(request: Request) {
  let inquiry;
  try {
    const raw = await request.text();
    if (raw.length > 16000) return NextResponse.json({ ok: false }, { status: 413 });
    inquiry = parseContactInquiry(JSON.parse(raw));
  } catch {
    return NextResponse.json({ ok: false }, { status: 400 });
  }
  try {
    const db = createAdminClient();
    // A retry must not overwrite the original enquiry or send duplicate mail.
    const { data, error } = await db.from("contact_inquiries")
      .upsert(inquiry, { onConflict: "id", ignoreDuplicates: true }).select("id");
    if (error) {
      console.error("Contact inquiry persistence failed", error.code);
      return NextResponse.json({ ok: false }, { status: 503 });
    }
    if (!data?.length) return NextResponse.json({ ok: true });
    let sent = false;
    try {
      const result = await resend.emails.send({
        from: EMAIL_FROM, to: ADMIN_EMAIL, replyTo: inquiry.email,
        subject: "פנייה חדשה מטופס יצירת קשר",
        html: renderEmail(`<h2>פנייה חדשה</h2><p>${escapeContactHtml(inquiry.full_name)}</p><p>${escapeContactHtml(inquiry.email)}</p><p style="white-space:pre-wrap">${escapeContactHtml(inquiry.message)}</p><p>מספר פנייה: ${inquiry.id}</p>`),
      }, { idempotencyKey: `contact-inquiry/${inquiry.id}` });
      sent = !result.error;
    } catch { /* Saved enquiries remain visible even when email fails. */ }
    const { error: notificationError } = await db.from("contact_inquiries").update({
      email_status: sent ? "sent" : "failed",
      email_sent_at: sent ? new Date().toISOString() : null,
    }).eq("id", inquiry.id);
    if (notificationError) console.error("Contact notification status update failed", notificationError.code);
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ ok: false }, { status: 503 });
  }
}
