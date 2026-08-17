import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { createClient } from "@/lib/supabase/server";
import { Section } from "@/components/ui/Section";
import { ButtonLink } from "@/components/ui/Button";
import { HotelCard } from "@/components/HotelCard";
import { DriverCard } from "@/components/DriverCard";
import { HotelSearchBar } from "@/components/HotelSearchBar";
import { Reveal } from "@/components/Reveal";

const VERTICAL_ICONS: Record<string, React.ReactNode> = {
  hotels: (
    <path d="M6 20V8a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v12M2 20h20M9 20v-4h6v4M9 10h.01M9 14h.01M15 10h.01M15 14h.01" />
  ),
  transport: <path d="M5 17h14M5 17a2 2 0 1 0 4 0M5 17a2 2 0 1 1 4 0M15 17a2 2 0 1 0 4 0M15 17a2 2 0 1 1 4 0M3 17V9a1 1 0 0 1 1-1h14l3 5v4M3 9h18" />,
  tours: <path d="M12 2 9.5 7 4 8l4 4-1 6 5-3 5 3-1-6 4-4-5.5-1L12 2Z" />,
};

const VERTICAL_GRADIENTS: Record<string, string> = {
  hotels: "from-brand-terracotta to-brand-terracotta-dark",
  transport: "from-brand-navy to-brand-navy-dark",
  tours: "from-brand-teal to-brand-navy",
};

export default async function HomePage() {
  const supabase = await createClient();
  const t = await getTranslations("home");

  const [{ data: hotels }, { data: drivers }] = await Promise.all([
    supabase.from("hotels").select("*").eq("status", "active").order("featured", { ascending: false }).limit(3),
    supabase.from("drivers").select("*").eq("status", "active").order("featured", { ascending: false }).limit(3),
  ]);

  const verticals = (["hotels", "transport", "tours"] as const).map((key) => ({
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
          <div className="mx-auto mt-8 max-w-3xl text-foreground">
            <HotelSearchBar />
          </div>
          <div className="mt-6 flex flex-wrap items-center justify-center gap-4">
            <ButtonLink href="/transport" variant="outline" className="border-white text-white hover:bg-white hover:text-brand-navy text-base px-7 py-3">
              {t("requestTransport")}
            </ButtonLink>
          </div>
        </div>
      </section>

      <Section>
        <div className="grid gap-6 sm:grid-cols-3">
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
            {hotels.map((hotel) => (
              <Reveal key={hotel.id}>
                <HotelCard hotel={hotel} />
              </Reveal>
            ))}
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

      <Section tinted className="text-center">
        <Reveal>
          <h2 className="font-display text-3xl font-extrabold text-brand-navy">{t("vipTitle")}</h2>
          <p className="mx-auto mt-3 max-w-xl text-foreground/70">{t("vipDescription")}</p>
          <ButtonLink href="/vip" className="mt-6">
            {t("vipButton")}
          </ButtonLink>
        </Reveal>
      </Section>
    </>
  );
}
