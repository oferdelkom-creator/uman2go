import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { refundPayment } from "@/lib/grow";
import { SITE_URL } from "@/lib/constants";

export async function POST(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ ok: false }, { status: 401 });

  const { data: booking } = await supabase
    .from("bookings")
    .select("id, status, platform_fee, platform_fee_currency, platform_fee_paid_at, grow_transaction_id, hotel:hotels(owner_id)")
    .eq("id", id)
    .maybeSingle();
  if (!booking) return NextResponse.json({ ok: false }, { status: 404 });

  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).maybeSingle();
  const isOwner = booking.hotel?.owner_id === user.id;
  const isAdmin = profile?.role === "admin";
  if (!isOwner && !isAdmin) return NextResponse.json({ ok: false }, { status: 403 });

  if (booking.status !== "pending_deposit" && booking.status !== "deposit_paid") {
    return NextResponse.json({ ok: false, error: "not_actionable" }, { status: 409 });
  }

  const depositWasPaid = booking.platform_fee_paid_at != null;

  const { error } = await supabase
    .from("bookings")
    .update({
      status: "cancelled",
      cancelled_at: new Date().toISOString(),
      cancelled_by: user.id,
      cancellation_reason: "owner_rejected",
    })
    .eq("id", id);
  if (error) return NextResponse.json({ ok: false }, { status: 500 });

  let refunded = false;
  if (depositWasPaid && booking.platform_fee != null) {
    const refund = await refundPayment({
      amount: booking.platform_fee,
      currency: booking.platform_fee_currency === "USD" ? "USD" : "ILS",
      referenceId: `booking:${id}`,
      transactionId: booking.grow_transaction_id,
      reason: "owner_rejected",
    });
    refunded = Boolean(refund?.ok);
  }

  fetch(`${SITE_URL}/api/notify/booking-rejected`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ id, refunded: depositWasPaid && refunded }),
  }).catch(() => {});

  return NextResponse.json({ ok: true });
}
