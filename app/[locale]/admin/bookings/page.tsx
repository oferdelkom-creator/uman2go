import { createClient } from "@/lib/supabase/server";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/EmptyState";
import { formatCurrency, formatDate } from "@/lib/format";
import { BookingStatusButtons } from "@/app/[locale]/owner/bookings/BookingStatusButtons";

const STATUS_LABEL: Record<string, string> = {
  pending_deposit: "ממתין לתשלום",
  deposit_paid: "מקדמה שולמה",
  confirmed: "מאושר",
  cancelled: "מבוטל",
};

export default async function AdminBookingsPage() {
  const supabase = await createClient();

  const { data: bookings } = await supabase
    .from("bookings")
    .select("*, hotel:hotels(name), room:rooms(name), guest:profiles(full_name, phone, email)")
    .order("created_at", { ascending: false });

  return (
    <div>
      <h2 className="font-display text-2xl font-bold text-brand-navy">כל ההזמנות</h2>

      {bookings && bookings.length > 0 ? (
        <div className="mt-6 flex flex-col gap-4">
          {bookings.map((booking) => (
            <Card key={booking.id} className="flex flex-wrap items-center justify-between gap-4 p-5">
              <div>
                <p className="font-display font-bold text-brand-navy">
                  {booking.hotel?.name} · {booking.room?.name}
                </p>
                <p className="text-sm text-foreground/70">
                  {booking.guest?.full_name || "אורח"}
                  {booking.guest?.phone && (
                    <span dir="ltr" className="text-brand-teal"> · {booking.guest.phone}</span>
                  )}
                </p>
                <p dir="ltr" className="text-sm text-foreground/60">
                  {formatDate(booking.check_in)} - {formatDate(booking.check_out)} · {booking.guests_count} אורחים
                </p>
              </div>
              <div className="flex items-center gap-3">
                <Badge tone={booking.status === "confirmed" ? "teal" : booking.status === "cancelled" ? "navy" : "gold"}>
                  {STATUS_LABEL[booking.status]}
                </Badge>
                {booking.total_price != null && (
                  <span dir="ltr" className="font-display font-bold text-brand-terracotta">
                    {formatCurrency(booking.total_price, booking.currency)}
                  </span>
                )}
                {booking.platform_fee_paid_at ? (
                  <Badge tone="teal">עמלה שולמה</Badge>
                ) : (
                  <Badge tone="gold">עמלה לא שולמה</Badge>
                )}
                <BookingStatusButtons bookingId={booking.id} status={booking.status} />
              </div>
            </Card>
          ))}
        </div>
      ) : (
        <EmptyState title="עדיין אין הזמנות" className="mt-8" />
      )}
    </div>
  );
}
