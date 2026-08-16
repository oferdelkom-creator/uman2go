import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { createClient } from "@/lib/supabase/server";
import { Section } from "@/components/ui/Section";
import { TourGuideCard } from "@/components/TourGuideCard";
import { EmptyState } from "@/components/ui/EmptyState";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "tours.list" });
  return { title: t("metaTitle") };
}

export default async function ToursPage() {
  const supabase = await createClient();
  const t = await getTranslations("tours.list");
  const { data: guides } = await supabase.from("tour_guides").select("*").eq("status", "active");

  return (
    <Section>
      <h1 className="font-display text-4xl font-extrabold text-brand-navy">{t("title")}</h1>
      <p className="mt-2 max-w-2xl text-foreground/70">{t("subtitle")}</p>

      {guides && guides.length > 0 ? (
        <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {guides.map((guide) => (
            <TourGuideCard key={guide.id} guide={guide} />
          ))}
        </div>
      ) : (
        <EmptyState title={t("emptyTitle")} description={t("emptyDesc")} className="mt-10" />
      )}
    </Section>
  );
}
