import Image from "next/image";
import { Link } from "@/i18n/navigation";
import type { TourGuide } from "@/lib/types";

export function TourGuideCard({ guide }: { guide: TourGuide }) {
  const photo = guide.photos[0];

  return (
    <Link
      href={`/tours/${guide.slug}`}
      className="group block overflow-hidden rounded-3xl bg-white shadow-lg shadow-brand-teal/10 ring-1 ring-brand-teal/5 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl"
    >
      <div className="relative aspect-[4/3] overflow-hidden bg-brand-cream-deep">
        {photo ? (
          <Image
            src={photo}
            alt={guide.name}
            fill
            className="object-cover transition-transform duration-500 group-hover:scale-105"
            sizes="(min-width: 1024px) 25vw, (min-width: 640px) 50vw, 100vw"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-brand-navy/30">
            <span className="font-display text-sm">אין תמונה</span>
          </div>
        )}
      </div>
      <div className="p-4">
        <h3 className="font-display text-lg font-bold text-brand-navy">{guide.name}</h3>
        <p className="mt-1 line-clamp-2 text-sm text-foreground/60">{guide.description}</p>
      </div>
    </Link>
  );
}
