import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { resend, EMAIL_FROM } from "@/lib/resend";
import { renderEmail } from "@/lib/emailTemplate";

const STATUS_LABEL: Record<string, string> = {
  pending_deposit: "ממתין לתשלום",
  deposit_paid: "מקדמה שולמה",
  confirmed: "מאושר",
  cancelled: "מבוטל",
};

export async function POST(request: Request) {
  const { id, status } = await request.json();
  const supabase = createAdminClient();

  const { data: booking } = await supabase
    .from("bookings")
    .select("*, hotel:hotels(name), guest:profiles!bookings_guest_id_fkey(email, full_name)")
    .eq("id", id)
    .maybeSingle();

  const guestEmail = booking?.guest?.email || booking?.guest_email;
  const guestName = booking?.guest?.full_name || booking?.guest_full_name || "";
  if (!guestEmail) return NextResponse.json({ ok: false }, { status: 404 });

  try {
    await resend.emails.send({
      from: EMAIL_FROM,
      to: guestEmail,
      subject: `עדכון סטטוס הזמנה - ${booking.hotel?.name}`,
      html: renderEmail(`
        <h2 style="margin:0 0 12px;color:#a0522d;">עדכון להזמנה שלכם</h2>
        <p>שלום ${guestName},</p>
        <p>סטטוס ההזמנה שלכם ב${booking.hotel?.name} עודכן ל: <strong>${STATUS_LABEL[status] ?? status}</strong></p>
      `),
    });
  } catch {
    // best-effort
  }

  return NextResponse.json({ ok: true });
}
