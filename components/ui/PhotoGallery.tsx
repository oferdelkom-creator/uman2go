"use client";

import { useState } from "react";
import Image from "next/image";
import { DefaultCardImage } from "@/components/ui/DefaultCardImage";

export function PhotoGallery({ photos, alt, kind = "hotel" }: { photos: string[]; alt: string; kind?: "hotel" | "car" | "guide" }) {
  const [failed, setFailed] = useState<Set<number>>(new Set());
  const [loaded, setLoaded] = useState<Set<string>>(new Set());
  const valid = photos.filter((_, i) => !failed.has(i));

  if (photos.length === 0 || valid.length === 0) {
    return (
      <div className="aspect-video overflow-hidden rounded-3xl">
        <DefaultCardImage kind={kind} />
      </div>
    );
  }

  const [main, ...rest] = valid;

  return (
    <div className="grid grid-cols-4 grid-rows-2 gap-2 overflow-hidden rounded-3xl">
      <div className="relative col-span-4 row-span-2 aspect-video overflow-hidden bg-brand-cream-deep sm:col-span-2 sm:row-span-2">
        {!loaded.has(main) && <div className="absolute inset-0 animate-pulse bg-brand-cream-deep" />}
        <Image
          src={main}
          alt={alt}
          fill
          className={`object-cover transition-opacity duration-500 ${loaded.has(main) ? "opacity-100" : "opacity-0"}`}
          onLoad={() => setLoaded((s) => new Set(s).add(main))}
          onError={() => setFailed((s) => new Set(s).add(photos.indexOf(main)))}
          sizes="(min-width: 640px) 50vw, 100vw"
          priority
        />
      </div>
      {rest.slice(0, 4).map((src) => (
        <div key={src} className="relative hidden aspect-square overflow-hidden bg-brand-cream-deep sm:block">
          {!loaded.has(src) && <div className="absolute inset-0 animate-pulse bg-brand-cream-deep" />}
          <Image
            src={src}
            alt={alt}
            fill
            className={`object-cover transition-opacity duration-500 ${loaded.has(src) ? "opacity-100" : "opacity-0"}`}
            onLoad={() => setLoaded((s) => new Set(s).add(src))}
            onError={() => setFailed((s) => new Set(s).add(photos.indexOf(src)))}
            sizes="25vw"
          />
        </div>
      ))}
    </div>
  );
}
