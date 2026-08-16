import { getLocale, getTranslations } from "next-intl/server";
import { createClient } from "@/lib/supabase/server";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/EmptyState";
import { formatCurrency, formatDate } from "@/lib/format";
import { BookingStatusButtons } from "@/app/[locale]/owner/bookings/BookingStatusButtons";

export default async function AdminBookingsPage() {
  const supabase = await createClient();
  const [t, tStatus, locale] = await Promise.all([
    getTranslations("admin.bookings"),
    getTranslations("owner.bookings.status"),
    getLocale(),
  ]);

  const { data: bookings } = await supabase
    .from("bookings")
    .select("*, hotel:hotels(name), room:rooms(name), guest:profiles(full_name, phone, email)")
    .order("created_at", { ascending: false });

  return (
    <div>
      <h2 className="font-display text-2xl font-bold text-brand-navy">{t("title")}</h2>

      {bookings && bookings.length > 0 ? (
        <div className="mt-6 flex flex-col gap-4">
          {bookings.map((booking) => (
            <Card key={booking.id} className="flex flex-wrap items-center justify-between gap-4 p-5">
              <div>
                <p className="font-display font-bold text-brand-navy">
                  {booking.hotel?.name} · {booking.room?.name}
                </p>
                <p className="text-sm text-foreground/70">
                  {booking.guest?.full_name || t("guestFallback")}
                  {booking.guest?.phone && (
                    <span dir="ltr" className="text-brand-teal"> · {booking.guest.phone}</span>
                  )}
                </p>
                <p dir="ltr" className="text-sm text-foreground/60">
                  {formatDate(booking.check_in, locale)} - {formatDate(booking.check_out, locale)} · {t("guestsCount", { count: booking.guests_count })}
                </p>
              </div>
              <div className="flex items-center gap-3">
                <Badge tone={booking.status === "confirmed" ? "teal" : booking.status === "cancelled" ? "navy" : "gold"}>
                  {tStatus(booking.status === "pending_deposit" ? "pendingDeposit" : booking.status === "deposit_paid" ? "depositPaid" : booking.status)}
                </Badge>
                {booking.total_price != null && (
                  <span dir="ltr" className="font-display font-bold text-brand-terracotta">
                    {formatCurrency(booking.total_price, booking.currency, locale)}
                  </span>
                )}
                {booking.platform_fee_paid_at ? (
                  <Badge tone="teal">{t("feePaid")}</Badge>
                ) : (
                  <Badge tone="gold">{t("feeNotPaid")}</Badge>
                )}
                <BookingStatusButtons bookingId={booking.id} status={booking.status} />
              </div>
            </Card>
          ))}
        </div>
      ) : (
        <EmptyState title={t("noBookings")} className="mt-8" />
      )}
    </div>
  );
}
