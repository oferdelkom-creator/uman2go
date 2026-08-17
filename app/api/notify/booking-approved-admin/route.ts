import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { resend, EMAIL_FROM, ADMIN_EMAIL } from "@/lib/resend";
import { renderEmail } from "@/lib/emailTemplate";
import { formatCurrency, formatDate } from "@/lib/format";

export async function POST(request: Request) {
  const { id } = await request.json();
  const supabase = createAdminClient();

  const { data: booking } = await supabase
    .from("bookings")
    .select("*, room:rooms(name), hotel:hotels(name), guest:profiles!bookings_guest_id_fkey(full_name, phone)")
    .eq("id", id)
    .maybeSingle();

  if (!booking) return NextResponse.json({ ok: false }, { status: 404 });

  try {
    await resend.emails.send({
      from: EMAIL_FROM,
      to: ADMIN_EMAIL,
      subject: `הזמנה אושרה - ${booking.hotel?.name}`,
      html: renderEmail(`
        <h2 style="margin:0 0 12px;color:#a0522d;">בעל המלון אישר הזמנה</h2>
        <p><strong>מלון:</strong> ${booking.hotel?.name ?? ""}</p>
        <p><strong>חדר:</strong> ${booking.room?.name ?? ""}</p>
        <p><strong>אורח:</strong> ${booking.guest?.full_name ?? ""} (${booking.guest?.phone ?? ""})</p>
        <p><strong>תאריכים:</strong> ${formatDate(booking.check_in)} - ${formatDate(booking.check_out)}</p>
        <p><strong>עמלת פלטפורמה שנגבתה:</strong> ${formatCurrency(booking.platform_fee ?? 0, booking.platform_fee_currency)}</p>
      `),
    });
  } catch {
    // best-effort
  }

  return NextResponse.json({ ok: true });
}
