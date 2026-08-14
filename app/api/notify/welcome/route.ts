import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { resend, EMAIL_FROM } from "@/lib/resend";
import { renderEmail } from "@/lib/emailTemplate";

export async function POST(request: Request) {
  const { userId } = await request.json();
  const supabase = createAdminClient();

  const { data: profile } = await supabase.from("profiles").select("email, full_name, role").eq("id", userId).maybeSingle();
  if (!profile?.email) return NextResponse.json({ ok: false }, { status: 404 });

  const isOwner = profile.role === "hotel_owner";

  try {
    await resend.emails.send({
      from: EMAIL_FROM,
      to: profile.email,
      subject: "ברוכים הבאים ל-Uman2Go!",
      html: renderEmail(`
        <h2 style="margin:0 0 12px;color:#a0522d;">ברוכים הבאים, ${profile.full_name || ""}!</h2>
        <p>${
          isOwner
            ? "תודה שהצטרפתם כבעלי מלון. בכניסה לאזור האישי תוכלו להוסיף את פרטי המלון שלכם ולהתחיל לקבל הזמנות."
            : "תודה שנרשמתם! עכשיו תוכלו לחפש מלונות, להזמין הסעות ולהירשם לטיולים באומן."
        }</p>
      `),
    });
  } catch {
    // best-effort
  }

  return NextResponse.json({ ok: true });
}
