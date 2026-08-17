import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
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
    .select("id, status, hotel:hotels(owner_id)")
    .eq("id", id)
    .maybeSingle();
  if (!booking) return NextResponse.json({ ok: false }, { status: 404 });

  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).maybeSingle();
  const isOwner = booking.hotel?.owner_id === user.id;
  const isAdmin = profile?.role === "admin";
  if (!isOwner && !isAdmin) return NextResponse.json({ ok: false }, { status: 403 });

  if (booking.status !== "deposit_paid") {
    return NextResponse.json({ ok: false, error: "not_deposit_paid" }, { status: 409 });
  }

  const { error } = await supabase.from("bookings").update({ status: "confirmed" }).eq("id", id);
  if (error) return NextResponse.json({ ok: false }, { status: 500 });

  fetch(`${SITE_URL}/api/notify/booking-status-changed`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ id, status: "confirmed" }),
  }).catch(() => {});

  fetch(`${SITE_URL}/api/notify/booking-approved-admin`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ id }),
  }).catch(() => {});

  return NextResponse.json({ ok: true });
}
