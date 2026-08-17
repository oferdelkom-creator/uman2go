"use client";

import { useState } from "react";
import Image from "next/image";

const SIZES = "(min-width: 1024px) 25vw, (min-width: 640px) 50vw, 100vw";

export function CardImage({ src, alt }: { src: string; alt: string }) {
  const [loaded, setLoaded] = useState(false);

  return (
    <>
      {!loaded && <div className="absolute inset-0 animate-pulse bg-brand-cream-deep" />}
      <Image
        src={src}
        alt={alt}
        fill
        onLoad={() => setLoaded(true)}
        className={`object-cover transition-all duration-500 group-hover:scale-105 ${loaded ? "opacity-100" : "opacity-0"}`}
        sizes={SIZES}
      />
    </>
  );
}
