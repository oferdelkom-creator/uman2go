import { Link, redirect } from "@/i18n/navigation";
import { getLocale, getTranslations } from "next-intl/server";
import { createClient } from "@/lib/supabase/server";
import { Section } from "@/components/ui/Section";
import { Card } from "@/components/ui/Card";
import { ButtonLink } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";

export default async function OwnerDashboardPage() {
  const supabase = await createClient();
  const locale = await getLocale();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    redirect({ href: "/login?next=/owner", locale });
    return;
  }

  const t = await getTranslations("owner.dashboard");
  const { data: hotel } = await supabase.from("hotels").select("*").eq("owner_id", user.id).maybeSingle();

  if (!hotel) {
    return (
      <Section>
        <Card className="mx-auto max-w-lg p-8 text-center">
          <h1 className="font-display text-2xl font-bold text-brand-navy">{t("noHotelTitle")}</h1>
          <p className="mt-2 text-foreground/70">{t("noHotelDesc")}</p>
          <ButtonLink href="/owner/hotel/new" className="mt-6">{t("addHotel")}</ButtonLink>
        </Card>
      </Section>
    );
  }

  const { count: bookingsCount } = await supabase
    .from("bookings")
    .select("id", { count: "exact", head: true })
    .eq("hotel_id", hotel.id);

  const navCards = [
    { href: "/owner/hotel/edit", title: t("hotelDetails"), desc: t("hotelDetailsDesc") },
    { href: "/owner/rooms", title: t("rooms"), desc: t("roomsDesc") },
    { href: "/owner/bookings", title: t("bookings"), desc: t("bookingsCount", { count: bookingsCount ?? 0 }) },
  ];

  return (
    <Section>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-extrabold text-brand-navy">{hotel.name}</h1>
          <Badge tone={hotel.status === "active" ? "teal" : "navy"}>{hotel.status === "active" ? t("active") : t("hidden")}</Badge>
        </div>
        <ButtonLink href={`/hotels/${hotel.slug}`} variant="outline">{t("viewHotelPage")}</ButtonLink>
      </div>

      <div className="mt-8 grid gap-5 sm:grid-cols-3">
        {navCards.map((card) => (
          <Link key={card.href} href={card.href} className="block">
            <Card className="p-6">
              <p className="font-display text-lg font-bold text-brand-navy">{card.title}</p>
              <p className="mt-1 text-sm text-foreground/60">{card.desc}</p>
            </Card>
          </Link>
        ))}
      </div>
    </Section>
  );
}
