"use client";

import { useState } from "react";
import Image from "next/image";
import { useTranslations } from "next-intl";
import { EmptyState } from "@/components/ui/EmptyState";

export function PhotoGallery({ photos, alt }: { photos: string[]; alt: string }) {
  const t = useTranslations("common");
  const [failed, setFailed] = useState<Set<number>>(new Set());
  const valid = photos.filter((_, i) => !failed.has(i));

  if (photos.length === 0 || valid.length === 0) {
    return <EmptyState title={t("noPhotosTitle")} description={t("noPhotosDesc")} className="aspect-video" />;
  }

  const [main, ...rest] = valid;

  return (
    <div className="grid grid-cols-4 grid-rows-2 gap-2 overflow-hidden rounded-3xl">
      <div className="relative col-span-4 row-span-2 aspect-video sm:col-span-2 sm:row-span-2">
        <Image
          src={main}
          alt={alt}
          fill
          className="object-cover"
          onError={() => setFailed((s) => new Set(s).add(photos.indexOf(main)))}
          sizes="(min-width: 640px) 50vw, 100vw"
          priority
        />
      </div>
      {rest.slice(0, 4).map((src) => (
        <div key={src} className="relative hidden aspect-square sm:block">
          <Image
            src={src}
            alt={alt}
            fill
            className="object-cover"
            onError={() => setFailed((s) => new Set(s).add(photos.indexOf(src)))}
            sizes="25vw"
          />
        </div>
      ))}
    </div>
  );
}
