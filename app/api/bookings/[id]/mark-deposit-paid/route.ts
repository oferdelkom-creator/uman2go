import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { SITE_URL } from "@/lib/constants";

// Manual admin stand-in for the Grow webhook, for use until real Grow
// credentials/docs are available - without this, no booking could ever
// progress past pending_deposit in production.
export async function POST(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ ok: false }, { status: 401 });

  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).maybeSingle();
  if (profile?.role !== "admin") return NextResponse.json({ ok: false }, { status: 403 });

  const { data: booking } = await supabase.from("bookings").select("id, status").eq("id", id).maybeSingle();
  if (!booking) return NextResponse.json({ ok: false }, { status: 404 });
  if (booking.status !== "pending_deposit") {
    return NextResponse.json({ ok: false, error: "not_pending_deposit" }, { status: 409 });
  }

  const now = new Date().toISOString();
  const { error } = await supabase
    .from("bookings")
    .update({ status: "deposit_paid", payment_confirmed_at: now, platform_fee_paid_at: now })
    .eq("id", id);
  if (error) return NextResponse.json({ ok: false }, { status: 500 });

  fetch(`${SITE_URL}/api/notify/owner-review-needed`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ id }),
  }).catch(() => {});

  return NextResponse.json({ ok: true });
}
