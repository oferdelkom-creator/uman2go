import { TransferReservationActions } from "@/components/TransferReservationActions";
import { usd } from "@/lib/transfer-pricing";
import { getLocale, getTranslations } from "next-intl/server";
import { createClient } from "@/lib/supabase/server";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/EmptyState";
import { formatDate } from "@/lib/format";

export default async function AdminTransportPage() {
  const supabase = await createClient();
  const [t, locale] = await Promise.all([getTranslations("admin.transport"), getLocale()]);

  const { data: requests } = await supabase
    .from("transport_requests")
    .select("*, driver:drivers(name)")
    .order("created_at", { ascending: false });

  const {data:reservations,error:reservationError}=await supabase.from("transfer_reservations").select("*").neq("status","draft").order("created_at",{ascending:false}).limit(200);
  return (
    <div>
      <h2 className="font-display text-2xl font-bold text-brand-navy">{t("title")}</h2>

      <section className="mt-6"><h3 className="text-xl font-bold">הזמנות לפי מחירון קישינב → אומן</h3>
      {reservationError&&<p role="alert">לא ניתן לטעון את ההזמנות.</p>}
      {reservations?.map(row=><Card key={row.id} className="mt-4 p-5"><h4 className="font-bold">{row.full_name} · {row.contact}</h4><p>{row.departure_date} {row.departure_time} (שעון קישינב) · {row.passengers} נוסעים · {row.pickup}</p><p>{row.vehicle_code} · {row.stops_code}</p><p>כולל ללקוח: {usd(row.total_cents)} · מקדמה לאתר: {usd(row.deposit_cents)} · יתרה לנהג: {usd(row.driver_balance_cents)}</p><p className="mt-2 font-semibold">{row.status==='confirmed'?'הזמנה מאושרת - ספק ומקדמה אומתו':row.status==='awaiting_deposit'?'הספק אישר - ממתין למקדמה':'בקשה ממתינה לאישור ספק'}</p>{row.supplier_name&&<p>ספק: {row.supplier_name} · אסמכתה: {row.supplier_reference}</p>}{row.payment_reference&&<p>אסמכתת תשלום: {row.payment_reference}</p>}{row.notes&&<p className="whitespace-pre-wrap">{row.notes}</p>}{row.notification_status!=='sent'&&<p>התראת המייל נכשלה או ממתינה; הבקשה שמורה.</p>}<TransferReservationActions id={row.id} status={row.status} depositCents={row.deposit_cents}/></Card>)}
      </section>
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
                  {formatDate(req.departure_date, locale)} · {t("passengersCount", { count: req.guests_count })}
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
