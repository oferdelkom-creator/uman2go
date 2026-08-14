import type { ReactNode } from "react";

export function Card({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`rounded-3xl bg-white shadow-lg shadow-brand-terracotta/10 ring-1 ring-brand-terracotta/5 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-brand-terracotta/20 ${className}`}
    >
      {children}
    </div>
  );
}
