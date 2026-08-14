import type { ReactNode } from "react";

export function Section({
  children,
  tinted = false,
  className = "",
}: {
  children: ReactNode;
  tinted?: boolean;
  className?: string;
}) {
  return (
    <section className={`${tinted ? "bg-brand-cream-deep" : ""} ${className}`}>
      <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 lg:px-8">{children}</div>
    </section>
  );
}
