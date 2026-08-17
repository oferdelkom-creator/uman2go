import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createPaymentLink, isGrowConfigured } from "@/lib/grow";
import { SITE_URL } from "@/lib/constants";

export async function POST(request: Request) {
  const { bookingId, locale } = (await request.json()) as { bookingId: string; locale: string };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ ok: false }, { status: 401 });

  const { data: booking } = await supabase
    .from("bookings")
    .select("id, status, platform_fee, platform_fee_currency, hotel:hotels(name, slug)")
    .eq("id", bookingId)
    .eq("guest_id", user.id)
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
