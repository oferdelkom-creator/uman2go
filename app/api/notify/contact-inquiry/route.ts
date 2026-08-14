import { NextResponse } from "next/server";
import { resend, EMAIL_FROM, ADMIN_EMAIL } from "@/lib/resend";
import { renderEmail } from "@/lib/emailTemplate";

export async function POST(request: Request) {
  const { full_name, email, message } = await request.json();

  try {
    await resend.emails.send({
      from: EMAIL_FROM,
      to: ADMIN_EMAIL,
      replyTo: String(email || ""),
      subject: "פנייה חדשה מטופס יצירת קשר",
      html: renderEmail(`
        <h2 style="margin:0 0 12px;color:#a0522d;">פנייה חדשה</h2>
        <p><strong>שם:</strong> ${full_name}</p>
        <p><strong>אימייל:</strong> ${email}</p>
        <p>${message}</p>
      `),
    });
  } catch {
    return NextResponse.json({ ok: false }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
