import Image from "next/image";
import { getLocale, getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { tField } from "@/lib/i18n-content";
import type { Driver } from "@/lib/types";

export async function DriverCard({ driver }: { driver: Driver }) {
  const [t, locale] = await Promise.all([getTranslations(), getLocale()]);
  const photo = driver.photos[0];
  const vehicleType = tField(driver.vehicle_type, driver.vehicle_type_i18n, locale);

  return (
    <Link
      href={`/transport/${driver.slug}`}
      className="group block overflow-hidden rounded-3xl bg-white shadow-lg shadow-brand-navy/10 ring-1 ring-brand-navy/5 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl"
    >
      <div className="relative aspect-[4/3] overflow-hidden bg-brand-cream-deep">
        {photo ? (
          <Image
            src={photo}
            alt={driver.name}
            fill
            className="object-cover transition-transform duration-500 group-hover:scale-105"
            sizes="(min-width: 1024px) 25vw, (min-width: 640px) 50vw, 100vw"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-brand-navy/30">
            <span className="font-display text-sm">{t("common.noPhoto")}</span>
          </div>
        )}
      </div>
      <div className="p-4">
        <h3 className="font-display text-lg font-bold text-brand-navy">{driver.name}</h3>
        <p className="mt-1 text-sm text-foreground/60">{vehicleType || t("transport.list.defaultVehicleType")}</p>
      </div>
    </Link>
  );
}
