import { getTranslations } from "next-intl/server";
import { createClient } from "@/lib/supabase/server";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/EmptyState";
import { formatDate } from "@/lib/format";

export default async function AdminTransportPage() {
  const supabase = await createClient();
  const t = await getTranslations("admin.transport");

  const { data: requests } = await supabase
    .from("transport_requests")
    .select("*, driver:drivers(name)")
    .order("created_at", { ascending: false });

  return (
    <div>
      <h2 className="font-display text-2xl font-bold text-brand-navy">{t("title")}</h2>

      {requests && requests.length > 0 ? (
        <div className="mt-6 flex flex-col gap-4">
          {requests.map((req) => (
            <Card key={req.id} className="flex flex-wrap items-center justify-between gap-4 p-5">
              <div>
                <p className="font-display font-bold text-brand-navy">
                  {req.origin} → {req.destination}
                  {req.round_trip && ` (${t("roundTrip")})`}
                </p>
                <p className="text-sm text-foreground/70">
                  {req.full_name} <span dir="ltr" className="text-brand-teal">· {req.phone}</span>
                </p>
                <p dir="ltr" className="text-sm text-foreground/60">
                  {formatDate(req.departure_date)} · {t("passengersCount", { count: req.guests_count })}
                  {req.driver?.name && ` · ${req.driver.name}`}
                </p>
                {req.notes && <p className="mt-1 text-sm text-foreground/60">{req.notes}</p>}
              </div>
              <div className="flex items-center gap-2">
                {req.platform_fee_paid_at ? (
                  <Badge tone="teal">{t("feePaid")}</Badge>
                ) : (
                  <Badge tone="gold">{t("feeNotPaid")}</Badge>
                )}
              </div>
            </Card>
          ))}
        </div>
      ) : (
        <EmptyState title={t("noRequests")} className="mt-8" />
      )}
    </div>
  );
}
