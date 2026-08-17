import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { resend, EMAIL_FROM } from "@/lib/resend";
import { renderEmail } from "@/lib/emailTemplate";

export async function POST(request: Request) {
  const { id, refunded } = (await request.json()) as { id: string; refunded: boolean };
  const supabase = createAdminClient();

  const { data: booking } = await supabase
    .from("bookings")
    .select("*, hotel:hotels(name), guest:profiles!bookings_guest_id_fkey(email, full_name)")
    .eq("id", id)
    .maybeSingle();

  const guestEmail = booking?.guest?.email || booking?.guest_email;
  const guestName = booking?.guest?.full_name || booking?.guest_full_name || "";
  if (!guestEmail) return NextResponse.json({ ok: false }, { status: 404 });

  const refundLine = refunded
    ? "<p>המקדמה ששילמתם הוחזרה במלואה.</p>"
    : "<p>אנו מטפלים בהחזר המקדמה ששילמתם ותקבלו עדכון בהקדם.</p>";

  try {
    await resend.emails.send({
      from: EMAIL_FROM,
      to: guestEmail,
      subject: `הבקשה לא אושרה - ${booking.hotel?.name}`,
      html: renderEmail(`
        <h2 style="margin:0 0 12px;color:#a0522d;">הבקשה שלכם לא אושרה</h2>
        <p>שלום ${guestName},</p>
        <p>לצערנו בעל המלון ${booking.hotel?.name ?? ""} לא אישר את בקשת ההזמנה שלכם.</p>
        ${refundLine}
      `),
    });
  } catch {
    // best-effort
  }

  return NextResponse.json({ ok: true });
}
