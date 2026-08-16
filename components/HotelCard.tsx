import Image from "next/image";
import { getLocale, getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { Badge } from "@/components/ui/Badge";
import { formatCurrency } from "@/lib/format";
import { tField } from "@/lib/i18n-content";
import type { Hotel } from "@/lib/types";

export async function HotelCard({
  hotel,
  fromPrice,
  currency = "USD",
}: {
  hotel: Hotel;
  fromPrice?: number | null;
  currency?: string;
}) {
  const [t, locale] = await Promise.all([getTranslations(), getLocale()]);
  const photo = hotel.photos[0];
  const area = tField(hotel.area, hotel.area_i18n, locale);

  return (
    <Link
      href={`/hotels/${hotel.slug}`}
      className="group block overflow-hidden rounded-3xl bg-white shadow-lg shadow-brand-terracotta/10 ring-1 ring-brand-terracotta/5 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-brand-terracotta/20"
    >
      <div className="relative aspect-[4/3] overflow-hidden bg-brand-cream-deep">
        {photo ? (
          <Image
            src={photo}
            alt={hotel.name}
            fill
            className="object-cover transition-transform duration-500 group-hover:scale-105"
            sizes="(min-width: 1024px) 25vw, (min-width: 640px) 50vw, 100vw"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-brand-navy/30">
            <span className="font-display text-sm">{t("common.noPhoto")}</span>
          </div>
        )}
        {hotel.featured && (
          <span className="absolute top-3 right-3 rounded-full bg-gradient-to-l from-brand-terracotta to-brand-gold px-3 py-1 text-xs font-bold text-white shadow">
            {t("hotels.list.featured")}
          </span>
        )}
      </div>
      <div className="p-4">
        <h3 className="font-display text-lg font-bold text-brand-navy">{hotel.name}</h3>
        <p className="mt-1 text-sm text-foreground/60">{area}</p>
        <div className="mt-3 flex items-center justify-between">
          {hotel.distance_to_kever_meters != null && (
            <Badge tone="teal">{t("hotels.detail.distanceFromSite", { meters: hotel.distance_to_kever_meters })}</Badge>
          )}
          {fromPrice != null && (
            <span dir="ltr" className="font-display text-sm font-bold text-brand-terracotta">
              {formatCurrency(fromPrice, currency, locale)}{t("hotels.list.perNight")}
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}
