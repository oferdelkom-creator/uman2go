import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { resend, EMAIL_FROM, ADMIN_EMAIL } from "@/lib/resend";
import { renderEmail } from "@/lib/emailTemplate";

export async function POST(request: Request) {
  const { id } = await request.json();
  const supabase = createAdminClient();

  const { data: signup } = await supabase
    .from("tour_signups")
    .select("*, tour_date:tour_dates(title, tour_date), guide:tour_guides(name, owner_id)")
    .eq("id", id)
    .maybeSingle();

  if (!signup) return NextResponse.json({ ok: false }, { status: 404 });

  const recipients = [ADMIN_EMAIL];
  if (signup.guide?.owner_id) {
    const { data: owner } = await supabase.from("profiles").select("email").eq("id", signup.guide.owner_id).maybeSingle();
    if (owner?.email) recipients.push(owner.email);
  }

  const html = renderEmail(`
    <h2 style="margin:0 0 12px;color:#a0522d;">נרשם חדש לטיול</h2>
    <p><strong>טיול:</strong> ${signup.tour_date?.title ?? ""}</p>
    <p><strong>נרשם:</strong> ${signup.full_name} (${signup.phone})</p>
    <p><strong>משתתפים:</strong> ${signup.participants_count}</p>
    ${signup.notes ? `<p><strong>הערות:</strong> ${signup.notes}</p>` : ""}
  `);

  try {
    await resend.emails.send({ from: EMAIL_FROM, to: recipients, subject: "נרשם חדש לטיול", html });
  } catch {
    // best-effort
  }

  return NextResponse.json({ ok: true });
}
