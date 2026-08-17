import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { resend, EMAIL_FROM, ADMIN_EMAIL } from "@/lib/resend";
import { renderEmail } from "@/lib/emailTemplate";

const GUEST_EMAIL_SELECT = {
  bookings: "*, hotel:hotels(name), guest:profiles!bookings_guest_id_fkey(email, full_name)",
  transport_requests: "*",
  tour_signups: "*, tour_date:tour_dates(title)",
} as const;

type PaymentTable = keyof typeof GUEST_EMAIL_SELECT;

export async function POST(request: Request) {
  const { table, id } = (await request.json()) as { table: PaymentTable; id: string };
  if (!(table in GUEST_EMAIL_SELECT)) return NextResponse.json({ ok: false }, { status: 400 });

  const supabase = createAdminClient();
  // Row shape varies per table (only bookings joins a guest profile), so this
  // is read generically rather than typed per-table.
  const { data: row } = await supabase.from(table).select(GUEST_EMAIL_SELECT[table]).eq("id", id).maybeSingle<Record<string, never>>();
  if (!row) return NextResponse.json({ ok: false }, { status: 404 });

  const typedRow = row as { guest?: { email?: string }; guest_email?: string };
  const guestEmail = typedRow.guest?.email || typedRow.guest_email;
  const html = renderEmail(`
    <h2 style="margin:0 0 12px;color:#a0522d;">התשלום התקבל בהצלחה</h2>
    <p>תודה! העמלה עבור הבקשה שלכם שולמה ואושרה.</p>
  `);

  try {
    await resend.emails.send({
      from: EMAIL_FROM,
      to: guestEmail || ADMIN_EMAIL,
      subject: "אישור תשלום",
      html,
    });
  } catch {
    // best-effort
  }

  return NextResponse.json({ ok: true });
}
