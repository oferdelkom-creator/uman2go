import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { createClient } from "@/lib/supabase/server";
import { Section } from "@/components/ui/Section";
import { DriverCard } from "@/components/DriverCard";
import { EmptyState } from "@/components/ui/EmptyState";
import { ButtonLink } from "@/components/ui/Button";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "transport.list" });
  return { title: t("metaTitle") };
}

export default async function TransportPage() {
  const supabase = await createClient();
  const t = await getTranslations("transport.list");
  const { data: drivers } = await supabase.from("drivers").select("*").eq("status", "active").order("featured", { ascending: false });

  return (
    <Section>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-4xl font-extrabold text-brand-navy">{t("title")}</h1>
          <p className="mt-2 max-w-2xl text-foreground/70">{t("subtitle")}</p>
        </div>
        <ButtonLink href="/transport/request" variant="outline">{t("generalRequest")}</ButtonLink>
      </div>

      {drivers && drivers.length > 0 ? (
        <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {drivers.map((driver) => (
            <DriverCard key={driver.id} driver={driver} />
          ))}
        </div>
      ) : (
        <EmptyState title={t("emptyTitle")} description={t("emptyDesc")} className="mt-10" />
      )}
    </Section>
  );
}
