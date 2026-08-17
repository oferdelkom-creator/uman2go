import { getLocale, getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { CardImage } from "@/components/ui/CardImage";
import { DefaultCardImage } from "@/components/ui/DefaultCardImage";
import { tField } from "@/lib/i18n-content";
import type { TourGuide } from "@/lib/types";

export async function TourGuideCard({ guide }: { guide: TourGuide }) {
  const [t, locale] = await Promise.all([getTranslations(), getLocale()]);
  const photo = guide.photos[0];
  const description = tField(guide.description, guide.description_i18n, locale);

  return (
    <Link
      href={`/tours/${guide.slug}`}
      className="group flex h-full flex-col overflow-hidden rounded-3xl bg-white shadow-lg shadow-brand-teal/10 ring-1 ring-brand-teal/5 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl"
    >
      <div className="relative aspect-[4/3] overflow-hidden bg-brand-cream-deep">
        {photo ? <CardImage src={photo} alt={guide.name} /> : <DefaultCardImage kind="guide" />}
      </div>
      <div className="flex flex-1 flex-col p-4">
        <h3 className="font-display text-lg font-bold text-brand-navy">{guide.name}</h3>
        <p className="mt-1 line-clamp-2 text-sm text-foreground/60">{description}</p>
        <span className="mt-4 block rounded-full bg-brand-navy px-4 py-2.5 text-center text-sm font-semibold text-white transition-colors group-hover:bg-brand-terracotta">
          {t("tours.list.viewAndBook")}
        </span>
      </div>
    </Link>
  );
}
