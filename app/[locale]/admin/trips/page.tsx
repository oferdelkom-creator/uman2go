import { getLocale, getTranslations } from "next-intl/server";
import { createClient } from "@/lib/supabase/server";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/EmptyState";
import { formatDate } from "@/lib/format";

export default async function AdminTripsPage() {
  const supabase = await createClient();
  const [t, locale] = await Promise.all([getTranslations("admin.trips"), getLocale()]);
  const { data: requests } = await supabase.from("trip_requests").select("*").order("created_at", { ascending: false });

  return (
    <div>
      <h2 className="font-display text-2xl font-bold text-brand-navy">{t("title")}</h2>
      {requests && requests.length > 0 ? (
        <div className="mt-6 flex flex-col gap-4">
          {requests.map((request) => {
            const services = [request.needs_hotel && t("hotel"), request.needs_transport && t("transport"), request.needs_tours && t("tours")].filter(Boolean);
            return (
              <Card key={request.id} className="p-5">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <p className="font-display text-lg font-bold text-brand-navy">{request.full_name}</p>
                    <p className="text-sm text-foreground/70"><span dir="ltr">{request.phone}</span>{request.email && <> · <span dir="ltr">{request.email}</span></>}</p>
                    <p className="mt-1 text-sm text-foreground/60">{formatDate(request.arrival_date, locale)} – {formatDate(request.departure_date, locale)} · {t("passengers", { count: request.passengers })}</p>
                  </div>
                  <Badge tone={request.status === "confirmed" || request.status === "completed" ? "teal" : "gold"}>{t(`statuses.${request.status}`)}</Badge>
                </div>
                <div className="mt-4 flex flex-wrap gap-2">{services.map((service) => <span key={service as string} className="rounded-full bg-brand-cream-deep px-3 py-1 text-xs font-semibold text-brand-navy">{service}</span>)}</div>
                {request.pickup_location && <p className="mt-3 text-sm text-foreground/65">{t("pickup")}: {request.pickup_location} → {request.destination}</p>}
                {request.needs_transport && <p className="mt-1 text-sm text-foreground/65">{t("pricingInputs", { tripType: t(`tripTypes.${request.trip_type}`), vehicleClass: t(`vehicleClasses.${request.vehicle_class}`), luggage: request.luggage_count ?? 0, childSeats: request.child_seats, stops: request.extra_stops })}</p>}
                {request.notes && <p className="mt-2 text-sm text-foreground/65">{request.notes}</p>}
              </Card>
            );
          })}
        </div>
      ) : <EmptyState title={t("empty")} className="mt-8" />}
    </div>
  );
}
