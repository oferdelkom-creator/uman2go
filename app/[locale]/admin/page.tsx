import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { createClient } from "@/lib/supabase/server";
import { Card } from "@/components/ui/Card";

export default async function AdminDashboardPage() {
  const supabase = await createClient();
  const t = await getTranslations("admin.dashboard");

  const [
    { count: bookingsCount },
    { count: transportCount },
    { count: tourSignupsCount },
    { count: vipCount },
    { count: investmentCount },
    { count: flightCount },
    { count: homeRentalCount },
    { count: newProvidersCount },
    { count: tripRequestsCount },
  ] = await Promise.all([
    supabase.from("bookings").select("id", { count: "exact", head: true }),
    supabase.from("transport_requests").select("id", { count: "exact", head: true }),
    supabase.from("tour_signups").select("id", { count: "exact", head: true }),
    supabase.from("vip_requests").select("id", { count: "exact", head: true }),
    supabase.from("investment_requests").select("id", { count: "exact", head: true }),
    supabase.from("flight_requests").select("id", { count: "exact", head: true }),
    supabase.from("home_rental_leads").select("id", { count: "exact", head: true }),
    supabase.from("provider_applications").select("id", { count: "exact", head: true }).eq("status", "new"),
    supabase.from("trip_requests").select("id", { count: "exact", head: true }),
  ]);

  const leadsCount = (vipCount ?? 0) + (investmentCount ?? 0) + (flightCount ?? 0) + (homeRentalCount ?? 0);

  const cards = [
    { href: "/admin/trips", title: t("tripRequests"), count: tripRequestsCount ?? 0 },
    { href: "/admin/bookings", title: t("hotelBookings"), count: bookingsCount ?? 0 },
    { href: "/admin/transport", title: t("transportRequests"), count: transportCount ?? 0 },
    { href: "/admin/tours", title: t("tourSignups"), count: tourSignupsCount ?? 0 },
    { href: "/admin/leads", title: t("leads"), count: leadsCount },
    { href: "/admin/providers", title: t("newProviders"), count: newProvidersCount ?? 0 },
  ];

  return (
    <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
      {cards.map((card) => (
        <Link key={card.href} href={card.href} className="block">
          <Card className="p-6">
            <p className="font-display text-3xl font-extrabold text-brand-terracotta">{card.count}</p>
            <p className="mt-1 text-sm font-semibold text-brand-navy">{card.title}</p>
          </Card>
        </Link>
      ))}
    </div>
  );
}
