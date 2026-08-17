import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getLocale, getTranslations } from "next-intl/server";
import { createClient } from "@/lib/supabase/server";
import { Section } from "@/components/ui/Section";
import { Card } from "@/components/ui/Card";
import { PhotoGallery } from "@/components/ui/PhotoGallery";
import { EmptyState } from "@/components/ui/EmptyState";
import { formatCurrency, formatDate } from "@/lib/format";
import { tField } from "@/lib/i18n-content";
import { TourSignupForm } from "@/components/TourSignupForm";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string; locale: string }>;
}): Promise<Metadata> {
  const { slug, locale } = await params;
  const supabase = await createClient();
  const t = await getTranslations({ locale, namespace: "tours.detail" });
  const { data: guide } = await supabase.from("tour_guides").select("name, description").eq("slug", slug).maybeSingle();
  return { title: guide?.name ?? t("fallbackTitle"), description: guide?.description };
}

export default async function TourGuideDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const supabase = await createClient();
  const [t, locale] = await Promise.all([getTranslations("tours.detail"), getLocale()]);

  const { data: guide } = await supabase.from("tour_guides").select("*").eq("slug", slug).eq("status", "active").maybeSingle();
  if (!guide) notFound();

  const { data: tourDates } = await supabase
    .from("tour_dates")
    .select("*")
    .eq("guide_id", guide.id)
    .eq("status", "active")
    .gte("tour_date", new Date(0).toISOString().slice(0, 10))
    .order("tour_date");

  const description = tField(guide.description, guide.description_i18n, locale);

  return (
    <Section>
      <PhotoGallery photos={guide.photos} alt={guide.name} kind="guide" />

      <div className="mt-8 grid gap-10 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <h1 className="font-display text-3xl font-extrabold text-brand-navy">{guide.name}</h1>
          <p className="mt-4 whitespace-pre-line leading-relaxed text-foreground/80">{description}</p>
        </div>

        <div>
          <h2 className="font-display text-2xl font-bold text-brand-navy">{t("tourDates")}</h2>
          {tourDates && tourDates.length > 0 ? (
            <div className="mt-4 flex flex-col gap-4">
              {tourDates.map((date) => (
                <Card key={date.id} className="overflow-hidden">
                  <details>
                    <summary className="cursor-pointer list-none p-5">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-display font-bold text-brand-navy">{tField(date.title, date.title_i18n, locale)}</p>
                          <p dir="ltr" className="text-xs text-foreground/60">{formatDate(date.tour_date, locale)}</p>
                        </div>
                        <span dir="ltr" className="font-display font-bold text-brand-terracotta">
                          {formatCurrency(date.price, date.currency, locale)}
                        </span>
                      </div>
                    </summary>
                    <div className="border-t border-brand-navy/10 p-5 pt-4">
                      {date.description && (
                        <p className="mb-4 text-sm text-foreground/70">{tField(date.description, date.description_i18n, locale)}</p>
                      )}
                      <TourSignupForm tourDateId={date.id} guideId={guide.id} />
                    </div>
                  </details>
                </Card>
              ))}
            </div>
          ) : (
            <EmptyState title={t("noDates")} className="mt-4" />
          )}
        </div>
      </div>
    </Section>
  );
}
