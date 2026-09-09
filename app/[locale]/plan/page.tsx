import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { Section } from "@/components/ui/Section";
import { Card } from "@/components/ui/Card";
import { TripPlannerForm } from "@/components/TripPlannerForm";
import { localizedAlternates } from "@/lib/seo";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "tripPlanner" });
  return { title: t("metaTitle"), description: t("subtitle"), alternates: localizedAlternates("/plan", locale) };
}

export default async function PlanPage() {
  const t = await getTranslations("tripPlanner");
  return (
    <>
      <section className="bg-gradient-to-br from-brand-navy to-brand-navy-dark py-16 text-white">
        <div className="mx-auto max-w-4xl px-4 text-center sm:px-6">
          <p className="font-display text-sm font-bold uppercase tracking-widest text-brand-gold">Uman2Go One Trip</p>
          <h1 className="mt-3 font-display text-4xl font-extrabold sm:text-5xl">{t("title")}</h1>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-white/75">{t("subtitle")}</p>
          <div className="mx-auto mt-8 grid max-w-2xl grid-cols-3 gap-2 text-sm font-semibold">
            <span className="rounded-full bg-white/10 px-3 py-2">🏨 {t("hotelChip")}</span>
            <span className="rounded-full bg-white/10 px-3 py-2">🚕 {t("driverChip")}</span>
            <span className="rounded-full bg-white/10 px-3 py-2">🗺️ {t("tourChip")}</span>
          </div>
        </div>
      </section>
      <Section>
        <Card className="mx-auto max-w-4xl p-6 sm:p-10">
          <TripPlannerForm />
        </Card>
      </Section>
    </>
  );
}

