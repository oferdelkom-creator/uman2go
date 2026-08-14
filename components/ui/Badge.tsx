import type { ReactNode } from "react";

const tones = {
  gold: "bg-brand-gold/15 text-brand-terracotta-dark",
  teal: "bg-brand-teal/15 text-brand-teal",
  navy: "bg-brand-navy/10 text-brand-navy",
};

export function Badge({
  children,
  tone = "gold",
}: {
  children: ReactNode;
  tone?: keyof typeof tones;
}) {
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-semibold ${tones[tone]}`}
    >
      {children}
    </span>
  );
}
