import { getLocale, getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { createClient } from "@/lib/supabase/server";
import { Section } from "@/components/ui/Section";
import { ButtonLink } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { RatingStars } from "@/components/ui/RatingStars";
import { HotelCard } from "@/components/HotelCard";
import { DriverCard } from "@/components/DriverCard";
import { HotelSearchBar } from "@/components/HotelSearchBar";
import { HomeTransportQuickForm } from "@/components/HomeTransportQuickForm";
import { Reveal } from "@/components/Reveal";
import { WHATSAPP_NUMBER } from "@/lib/constants";
import { formatDate } from "@/lib/format";

const VERTICAL_ICONS: Record<string, React.ReactNode> = {
  hotels: (
    <path d="M6 20V8a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v12M2 20h20M9 20v-4h6v4M9 10h.01M9 14h.01M15 10h.01M15 14h.01" />
  ),
  transport: <path d="M5 17h14M5 17a2 2 0 1 0 4 0M5 17a2 2 0 1 1 4 0M15 17a2 2 0 1 0 4 0M15 17a2 2 0 1 1 4 0M3 17V9a1 1 0 0 1 1-1h14l3 5v4M3 9h18" />,
  tours: <path d="M12 2 9.5 7 4 8l4 4-1 6 5-3 5 3-1-6 4-4-5.5-1L12 2Z" />,
  flights: <path d="M22 16.5v-2l-8.5-5V4c0-1.1-.9-2-1.5-2s-1.5.9-1.5 2v5.5L2 14.5v2l8.5-2.5v5l-2.5 2v1.5l4-1 4 1v-1.5l-2.5-2v-5L22 16.5Z" />,
};

const VERTICAL_GRADIENTS: Record<string, string> = {
  hotels: "from-brand-terracotta to-brand-terracotta-dark",
  transport: "from-brand-navy to-brand-navy-dark",
  tours: "from-brand-teal to-brand-navy",
  flights: "from-brand-gold to-brand-terracotta-dark",
};

export default async function HomePage() {
  const supabase = await createClient();
  const [t, tCommon, locale] = await Promise.all([getTranslations("home"), getTranslations("common"), getLocale()]);

  const [
    { data: hotels },
    { data: drivers },
    { data: featuredRooms },
    { data: hotelReviews },
    { data: driverReviews },
    { count: hotelsCount },
    { count: driversCount },
  ] = await Promise.all([
    supabase.from("hotels").select("*").eq("status", "active").eq("property_type", "hotel").order("featured", { ascending: false }).limit(3),
    supabase.from("drivers").select("*").eq("status", "active").order("featured", { ascending: false }).limit(3),
    supabase.from("rooms").select("hotel_id, price_per_night, currency").eq("status", "active"),
    supabase.from("hotel_reviews").select("reviewer_name, host_rating, property_rating, comment, created_at").order("created_at", { ascending: false }).limit(3),
    supabase.from("driver_reviews").select("reviewer_name, driver_rating, vehicle_rating, comment, created_at").order("created_at", { ascending: false }).limit(3),
    supabase.from("hotels").select("id", { count: "exact", head: true }).eq("status", "active").eq("property_type", "hotel"),
    supabase.from("drivers").select("id", { count: "exact", head: true }).eq("status", "active"),
  ]);

  const minPriceByHotel = new Map<string, { price: number; currency: string }>();
  for (const room of featuredRooms ?? []) {
    const current = minPriceByHotel.get(room.hotel_id);
    if (!current || room.price_per_night < current.price) {
      minPriceByHotel.set(room.hotel_id, { price: room.price_per_night, currency: room.currency });
    }
  }

  const realReviews = [
    ...(hotelReviews ?? []).map((r) => ({
      name: r.reviewer_name,
      rating: (r.host_rating + r.property_rating) / 2,
      comment: r.comment,
      createdAt: r.created_at,
    })),
    ...(driverReviews ?? []).map((r) => ({
      name: r.reviewer_name,
      rating: (r.driver_rating + r.vehicle_rating) / 2,
      comment: r.comment,
      createdAt: r.created_at,
    })),
  ]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 3);

  const realPhotos = (hotels ?? [])
    .map((h) => (Array.isArray(h.photos) ? h.photos[0] : null))
    .filter((url): url is string => Boolean(url))
    .slice(0, 4);

  const verticals = (["hotels", "transport", "tours", "flights"] as const).map((key) => ({
    key,
    href: `/${key}`,
    title: t(`verticals.${key}.title`),
    description: t(`verticals.${key}.description`),
    gradient: VERTICAL_GRADIENTS[key],
    icon: VERTICAL_ICONS[key],
  }));

  return (
    <>
      <section className="relative overflow-hidden bg-gradient-to-br from-brand-navy via-brand-navy to-brand-terracotta-dark text-white">
        <div className="absolute inset-0 opacity-20" aria-hidden>
          <div className="absolute -top-24 -right-24 h-72 w-72 rounded-full bg-brand-gold blur-3xl" />
          <div className="absolute -bottom-24 -left-24 h-72 w-72 rounded-full bg-brand-teal blur-3xl" />
        </div>
        <div className="relative mx-auto max-w-6xl px-4 py-24 text-center sm:px-6 lg:px-8">
          <p className="font-display text-sm font-bold tracking-widest text-brand-gold uppercase">Uman2Go</p>
          <h1 className="mt-4 font-display text-4xl font-extrabold sm:text-6xl">{t("heroTitle")}</h1>
          <p className="mx-auto mt-5 max-w-2xl text-lg text-white/80">{t("heroSubtitle")}</p>
          <ul className="mx-auto mt-6 flex max-w-3xl flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm font-medium text-white/85">
            {["verified", "whatsapp", "secure", "languages"].map((key) => (
              <li key={key} className="flex items-center gap-1.5">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0 text-brand-gold">
                  <path d="M20 6 9 17l-5-5" />
                </svg>
                {t(`trustBar.${key}`)}
              </li>
            ))}
          </ul>
          <div className="mx-auto mt-8 max-w-3xl text-foreground">
            <HotelSearchBar />
          </div>
          <div className="mt-6 flex flex-wrap items-center justify-center gap-4">
            <ButtonLink href="/transport" variant="outline" className="border-white text-white hover:bg-white hover:text-brand-navy text-base px-7 py-3">
              {t("requestTransport")}
            </ButtonLink>
            <a
              href={`https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(tCommon("whatsappGenericPrefill"))}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-2 rounded-full border-2 border-[#25D366] bg-[#25D366]/10 px-7 py-3 text-base font-display font-semibold text-white transition-colors hover:bg-[#25D366] hover:text-white"
            >
              {tCommon("whatsappHelp")}
            </a>
          </div>
        </div>
      </section>

      <Section>
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {verticals.map((v) => (
            <Reveal key={v.href}>
              <Link
                href={v.href}
                className={`group flex h-full flex-col gap-4 rounded-3xl bg-gradient-to-br ${v.gradient} p-8 text-white shadow-lg transition-transform hover:-translate-y-1 hover:shadow-xl`}
              >
                <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  {v.icon}
                </svg>
                <h2 className="font-display text-2xl font-bold">{v.title}</h2>
                <p className="text-white/85">{v.description}</p>
                <span className="mt-auto inline-flex items-center gap-1 font-semibold">
                  {t("viewMore")}
                  <span className="transition-transform group-hover:-translate-x-1 rtl:group-hover:translate-x-1">←</span>
                </span>
              </Link>
            </Reveal>
          ))}
        </div>
      </Section>

      {hotels && hotels.length > 0 && (
        <Section tinted>
          <Reveal>
            <div className="flex items-end justify-between">
              <h2 className="font-display text-3xl font-extrabold text-brand-navy">{t("featuredHotels")}</h2>
              <Link href="/hotels" className="text-sm font-semibold text-brand-terracotta hover:underline">
                {t("allHotels")}
              </Link>
            </div>
          </Reveal>
          <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {hotels.map((hotel) => {
              const price = minPriceByHotel.get(hotel.id);
              return (
                <Reveal key={hotel.id}>
                  <HotelCard hotel={hotel} fromPrice={price?.price} currency={price?.currency} />
                </Reveal>
              );
            })}
          </div>
        </Section>
      )}

      {drivers && drivers.length > 0 && (
        <Section>
          <Reveal>
            <div className="flex items-end justify-between">
              <h2 className="font-display text-3xl font-extrabold text-brand-navy">{t("featuredDrivers")}</h2>
              <Link href="/transport" className="text-sm font-semibold text-brand-terracotta hover:underline">
                {t("allDrivers")}
              </Link>
            </div>
          </Reveal>
          <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {drivers.map((driver) => (
              <Reveal key={driver.id}>
                <DriverCard driver={driver} />
              </Reveal>
            ))}
          </div>
        </Section>
      )}

      <Section tinted>
        <Reveal>
          <div className="mx-auto max-w-3xl text-center">
            <h2 className="font-display text-3xl font-extrabold text-brand-navy">{t("transportQuick.title")}</h2>
            <p className="mt-2 text-foreground/70">{t("transportQuick.subtitle")}</p>
          </div>
          <div className="mx-auto mt-8 max-w-4xl">
            <HomeTransportQuickForm />
          </div>
        </Reveal>
      </Section>

      <Section className="text-center">
        <Reveal>
          <h2 className="font-display text-3xl font-extrabold text-brand-navy">{t("vipTitle")}</h2>
          <p className="mx-auto mt-3 max-w-xl text-foreground/70">{t("vipDescription")}</p>
          <ButtonLink href="/vip" className="mt-6">
            {t("vipButton")}
          </ButtonLink>
        </Reveal>
      </Section>

      <Section tinted>
        <Reveal>
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="font-display text-3xl font-extrabold text-brand-navy">{t("socialProof.title")}</h2>
            <p className="mt-2 text-foreground/70">{t("socialProof.subtitle")}</p>
          </div>

          <div className="mt-10 grid gap-6 lg:grid-cols-3">
            <div className="flex flex-col gap-4">
              {realReviews.length > 0 ? (
                realReviews.map((review, i) => (
                  <Card key={i} className="p-5">
                    <div className="flex items-center justify-between">
                      <p className="font-semibold text-brand-navy">{review.name.split(" ")[0]}</p>
                      <RatingStars rating={review.rating} />
                    </div>
                    {review.comment && <p className="mt-2 text-sm text-foreground/70">{review.comment}</p>}
                    <p className="mt-2 text-xs text-foreground/50">{formatDate(review.createdAt, locale)}</p>
                  </Card>
                ))
              ) : (
                <Card className="flex h-full flex-col items-center justify-center p-6 text-center">
                  <p className="text-sm text-foreground/70">{t("socialProof.noReviewsYet")}</p>
                </Card>
              )}
            </div>

            <Card className="flex flex-col items-center justify-center gap-4 p-6 text-center">
              <div>
                <p className="font-display text-4xl font-extrabold text-brand-terracotta">{hotelsCount ?? 0}</p>
                <p className="mt-1 text-sm text-foreground/70">{t("socialProof.hotelsCount")}</p>
              </div>
              <div>
                <p className="font-display text-4xl font-extrabold text-brand-terracotta">{driversCount ?? 0}</p>
                <p className="mt-1 text-sm text-foreground/70">{t("socialProof.driversCount")}</p>
              </div>
              <p className="mt-2 text-xs text-foreground/60">{t("socialProof.checkedByTeam")}</p>
            </Card>

            {realPhotos.length > 0 ? (
              <div className="grid grid-cols-2 gap-2">
                {realPhotos.map((url, i) => (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    key={i}
                    src={url}
                    alt=""
                    className={`h-full w-full rounded-2xl object-cover ${realPhotos.length === 3 && i === 0 ? "row-span-2" : ""}`}
                  />
                ))}
              </div>
            ) : null}
          </div>
        </Reveal>
      </Section>
    </>
  );
}
