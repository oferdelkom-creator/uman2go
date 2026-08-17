import { getLocale, getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { Badge } from "@/components/ui/Badge";
import { CardImage } from "@/components/ui/CardImage";
import { DefaultCardImage } from "@/components/ui/DefaultCardImage";
import { formatCurrency } from "@/lib/format";
import { tField } from "@/lib/i18n-content";
import type { Hotel } from "@/lib/types";

export async function HotelCard({
  hotel,
  fromPrice,
  currency = "USD",
  searchQuery = "",
}: {
  hotel: Hotel;
  fromPrice?: number | null;
  currency?: string;
  /** Already-built "?checkIn=...&checkOut=..." string, carried over from a hotels-list search so the detail page can pre-fill the same dates. */
  searchQuery?: string;
}) {
  const [t, locale] = await Promise.all([getTranslations(), getLocale()]);
  const photo = hotel.photos[0];
  const area = tField(hotel.area, hotel.area_i18n, locale);

  return (
    <Link
      href={`/hotels/${hotel.slug}${searchQuery}`}
      className="group flex h-full flex-col overflow-hidden rounded-3xl bg-white shadow-lg shadow-brand-terracotta/10 ring-1 ring-brand-terracotta/5 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-brand-terracotta/20"
    >
      <div className="relative aspect-[4/3] overflow-hidden bg-brand-cream-deep">
        {photo ? <CardImage src={photo} alt={hotel.name} /> : <DefaultCardImage kind="hotel" />}
        {hotel.featured && (
          <span className="absolute top-3 right-3 rounded-full bg-gradient-to-l from-brand-terracotta to-brand-gold px-3 py-1 text-xs font-bold text-white shadow">
            {t("hotels.list.featured")}
          </span>
        )}
      </div>
      <div className="flex flex-1 flex-col p-4">
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
        <span className="mt-4 block rounded-full bg-brand-navy px-4 py-2.5 text-center text-sm font-semibold text-white transition-colors group-hover:bg-brand-terracotta">
          {t("hotels.list.viewAndBook")}
        </span>
      </div>
    </Link>
  );
}
