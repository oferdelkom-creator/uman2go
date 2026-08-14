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
    .select("*, room:rooms(name), hotel:hotels(name, owner_id), guest:profiles(full_name, phone)")
    .eq("id", id)
    .maybeSingle();

  if (!booking) return NextResponse.json({ ok: false }, { status: 404 });

  const { data: owner } = await supabase.from("profiles").select("email").eq("id", booking.hotel.owner_id).maybeSingle();
  const to = owner?.email || ADMIN_EMAIL;

  try {
    await resend.emails.send({
      from: EMAIL_FROM,
      to,
      subject: `בקשת הזמנה חדשה - ${booking.hotel.name}`,
      html: renderEmail(`
        <h2 style="margin:0 0 12px;color:#a0522d;">בקשת הזמנה חדשה</h2>
        <p><strong>חדר:</strong> ${booking.room?.name ?? ""}</p>
        <p><strong>אורח:</strong> ${booking.guest?.full_name ?? ""} (${booking.guest?.phone ?? ""})</p>
        <p><strong>תאריכים:</strong> ${formatDate(booking.check_in)} - ${formatDate(booking.check_out)}</p>
        <p><strong>אורחים:</strong> ${booking.guests_count}</p>
        <p><strong>סה"כ:</strong> ${formatCurrency(booking.total_price ?? 0, booking.currency)}</p>
      `),
    });
  } catch {
    // best-effort
  }

  return NextResponse.json({ ok: true });
}
