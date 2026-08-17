import { redirect } from "@/i18n/navigation";
import { getLocale, getTranslations } from "next-intl/server";
import { createClient } from "@/lib/supabase/server";
import { Section } from "@/components/ui/Section";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/EmptyState";
import { formatCurrency, formatDate } from "@/lib/format";
import { BookingStatusButtons } from "@/app/[locale]/owner/bookings/BookingStatusButtons";

export default async function OwnerBookingsPage() {
  const supabase = await createClient();
  const locale = await getLocale();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    redirect({ href: "/login?next=/owner/bookings", locale });
    return;
  }

  const { data: hotel } = await supabase.from("hotels").select("id").eq("owner_id", user.id).maybeSingle();
  if (!hotel) {
    redirect({ href: "/owner/hotel/new", locale });
    return;
  }

  const { data: bookings } = await supabase
    .from("bookings")
    .select("*, room:rooms(name), guest:profiles!bookings_guest_id_fkey(full_name, phone, email)")
    .eq("hotel_id", hotel.id)
    .order("created_at", { ascending: false });

  const t = await getTranslations("owner.bookings");
  const statusLabel: Record<string, string> = {
    pending_deposit: t("status.pendingDeposit"),
    deposit_paid: t("status.depositPaid"),
    confirmed: t("status.confirmed"),
    cancelled: t("status.cancelled"),
  };

  return (
    <Section>
      <h1 className="font-display text-3xl font-extrabold text-brand-navy">{t("title")}</h1>

      {bookings && bookings.length > 0 ? (
        <div className="mt-8 flex flex-col gap-4">
          {bookings.map((booking) => (
            <Card key={booking.id} className="flex flex-wrap items-center justify-between gap-4 p-5">
              <div>
                <p className="font-display font-bold text-brand-navy">
                  {booking.guest?.full_name || booking.guest_full_name || t("guest")} · {booking.room?.name}
                </p>
                <p dir="ltr" className="text-sm text-foreground/60">
                  {formatDate(booking.check_in, locale)} - {formatDate(booking.check_out, locale)} · {t("guestsCount", { count: booking.guests_count })}
                </p>
                {(booking.guest?.phone || booking.guest_phone) && (
                  <p dir="ltr" className="text-sm text-brand-teal">{booking.guest?.phone || booking.guest_phone}</p>
                )}
              </div>
              <div className="flex items-center gap-3">
                <Badge tone={booking.status === "confirmed" ? "teal" : booking.status === "cancelled" ? "navy" : "gold"}>
                  {statusLabel[booking.status]}
                </Badge>
                {booking.total_price != null && (
                  <span dir="ltr" className="font-display font-bold text-brand-terracotta">
                    {formatCurrency(booking.total_price, booking.currency, locale)}
                  </span>
                )}
                <BookingStatusButtons bookingId={booking.id} status={booking.status} />
              </div>
            </Card>
          ))}
        </div>
      ) : (
        <EmptyState title={t("noBookings")} className="mt-8" />
      )}
    </Section>
  );
}
