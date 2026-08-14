import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { resend, EMAIL_FROM, ADMIN_EMAIL } from "@/lib/resend";
import { renderEmail } from "@/lib/emailTemplate";
import { formatDate } from "@/lib/format";

export async function POST(request: Request) {
  const { id } = await request.json();
  const supabase = createAdminClient();

  const { data: reqRow } = await supabase
    .from("transport_requests")
    .select("*, driver:drivers(name, owner_id)")
    .eq("id", id)
    .maybeSingle();

  if (!reqRow) return NextResponse.json({ ok: false }, { status: 404 });

  const recipients = [ADMIN_EMAIL];
  if (reqRow.driver?.owner_id) {
    const { data: owner } = await supabase.from("profiles").select("email").eq("id", reqRow.driver.owner_id).maybeSingle();
    if (owner?.email) recipients.push(owner.email);
  }

  const html = renderEmail(`
    <h2 style="margin:0 0 12px;color:#a0522d;">בקשת הסעה חדשה</h2>
    <p><strong>שם:</strong> ${reqRow.full_name} (${reqRow.phone})</p>
    <p><strong>מסלול:</strong> ${reqRow.origin} → ${reqRow.destination}${reqRow.round_trip ? " (הלוך ושוב)" : ""}</p>
    <p><strong>תאריך:</strong> ${formatDate(reqRow.departure_date)}</p>
    <p><strong>נוסעים:</strong> ${reqRow.guests_count}</p>
    ${reqRow.driver?.name ? `<p><strong>נהג מבוקש:</strong> ${reqRow.driver.name}</p>` : ""}
    ${reqRow.notes ? `<p><strong>הערות:</strong> ${reqRow.notes}</p>` : ""}
  `);

  try {
    await resend.emails.send({ from: EMAIL_FROM, to: recipients, subject: "בקשת הסעה חדשה", html });
  } catch {
    // best-effort
  }

  return NextResponse.json({ ok: true });
}
