import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Section } from "@/components/ui/Section";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/EmptyState";
import { formatCurrency, formatDate } from "@/lib/format";
import { BookingStatusButtons } from "@/app/owner/bookings/BookingStatusButtons";

const STATUS_LABEL: Record<string, string> = {
  pending_deposit: "ממתין לתשלום",
  deposit_paid: "מקדמה שולמה",
  confirmed: "מאושר",
  cancelled: "מבוטל",
};

export default async function OwnerBookingsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/owner/bookings");

  const { data: hotel } = await supabase.from("hotels").select("id").eq("owner_id", user.id).maybeSingle();
  if (!hotel) redirect("/owner/hotel/new");

  const { data: bookings } = await supabase
    .from("bookings")
    .select("*, room:rooms(name), guest:profiles(full_name, phone, email)")
    .eq("hotel_id", hotel.id)
    .order("created_at", { ascending: false });

  return (
    <Section>
      <h1 className="font-display text-3xl font-extrabold text-brand-navy">הזמנות</h1>

      {bookings && bookings.length > 0 ? (
        <div className="mt-8 flex flex-col gap-4">
          {bookings.map((booking) => (
            <Card key={booking.id} className="flex flex-wrap items-center justify-between gap-4 p-5">
              <div>
                <p className="font-display font-bold text-brand-navy">
                  {booking.guest?.full_name || "אורח"} · {booking.room?.name}
                </p>
                <p dir="ltr" className="text-sm text-foreground/60">
                  {formatDate(booking.check_in)} - {formatDate(booking.check_out)} · {booking.guests_count} אורחים
                </p>
                {booking.guest?.phone && (
                  <p dir="ltr" className="text-sm text-brand-teal">{booking.guest.phone}</p>
                )}
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
                <BookingStatusButtons bookingId={booking.id} status={booking.status} />
              </div>
            </Card>
          ))}
        </div>
      ) : (
        <EmptyState title="עדיין אין הזמנות" className="mt-8" />
      )}
    </Section>
  );
}
