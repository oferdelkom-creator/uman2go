import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { Section } from "@/components/ui/Section";

const TRACKS = ["hotel", "apartment", "driver", "tour"] as const;

const TRACK_GRADIENTS: Record<(typeof TRACKS)[number], string> = {
  hotel: "from-brand-terracotta to-brand-terracotta-dark",
  apartment: "from-brand-gold to-brand-terracotta",
  driver: "from-brand-navy to-brand-navy-dark",
  tour: "from-brand-teal to-brand-navy",
};

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "joinHub" });
  return { title: t("metaTitle") };
}

export default async function JoinHubPage() {
  const t = await getTranslations("joinHub");

  return (
    <Section>
      <div className="mx-auto max-w-2xl text-center">
        <h1 className="font-display text-4xl font-extrabold text-brand-navy">{t("title")}</h1>
        <p className="mt-3 text-foreground/70">{t("subtitle")}</p>
      </div>

      <div className="mt-10 grid gap-6 sm:grid-cols-2">
        {TRACKS.map((track) => (
          <div
            key={track}
            className={`flex flex-col gap-3 rounded-3xl bg-gradient-to-br ${TRACK_GRADIENTS[track]} p-8 text-white shadow-lg`}
          >
            <h2 className="font-display text-xl font-bold">{t(`tracks.${track}.title`)}</h2>
            <p className="text-sm text-white/80">{t(`tracks.${track}.audience`)}</p>
            <p className="text-sm text-white/85">{t(`tracks.${track}.benefits`)}</p>
            <Link
              href={`/join/apply?type=${track}`}
              className="mt-4 inline-flex items-center justify-center rounded-full bg-white px-5 py-2.5 text-sm font-semibold text-brand-navy transition-transform hover:-translate-y-0.5"
            >
              {t(`tracks.${track}.cta`)}
            </Link>
          </div>
        ))}
      </div>

      <p className="mt-10 text-center text-sm text-foreground/60">{t("multiLanguageNote")}</p>
    </Section>
  );
}
