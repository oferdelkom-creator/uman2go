import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { createPaymentLink, isGrowConfigured } from "@/lib/grow";
import { SITE_URL } from "@/lib/constants";

// Guests don't need to be logged in to book, so this route can't rely on
// RLS/auth.uid() to scope the request - the booking's own id (an unguessable
// UUID, only known to whoever just created it and to us) is what authorizes
// this one action, the same way a checkout session id works elsewhere.
export async function POST(request: Request) {
  const { bookingId, locale } = (await request.json()) as { bookingId: string; locale: string };

  const supabase = createAdminClient();
  const { data: booking } = await supabase
    .from("bookings")
    .select("id, status, platform_fee, platform_fee_currency, hotel:hotels(name, slug)")
    .eq("id", bookingId)
    .maybeSingle();

  if (!booking) return NextResponse.json({ ok: false }, { status: 404 });

  if (booking.status !== "pending_deposit") {
    return NextResponse.json({ ok: true, url: null, alreadyHandled: true });
  }

  if (!isGrowConfigured() || booking.platform_fee == null) {
    return NextResponse.json({ ok: true, url: null });
  }

  const localePrefix = locale === "he" ? "" : `/${locale}`;
  const successUrl = `${SITE_URL}${localePrefix}/hotels/${booking.hotel.slug}?bookingId=${booking.id}&payment=success`;
  const cancelUrl = `${SITE_URL}${localePrefix}/hotels/${booking.hotel.slug}?bookingId=${booking.id}&payment=cancelled`;

  const link = await createPaymentLink({
    amount: booking.platform_fee,
    currency: booking.platform_fee_currency === "USD" ? "USD" : "ILS",
    description: `מקדמה - ${booking.hotel.name}`,
    referenceId: `booking:${booking.id}`,
    successUrl,
    cancelUrl,
  });

  return NextResponse.json({ ok: true, url: link?.url ?? null });
}
