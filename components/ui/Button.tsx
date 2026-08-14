import Link from "next/link";
import type { ButtonHTMLAttributes, ReactNode } from "react";

type Variant = "primary" | "outline" | "ghost";

const base =
  "inline-flex items-center justify-center gap-2 rounded-full font-display font-semibold text-sm px-5 py-2.5 transition-all duration-200 disabled:opacity-50 disabled:pointer-events-none";

const variants: Record<Variant, string> = {
  primary:
    "text-white bg-gradient-to-l from-brand-terracotta to-brand-gold shadow-lg shadow-brand-terracotta/25 hover:shadow-xl hover:shadow-brand-terracotta/30 hover:-translate-y-0.5",
  outline:
    "border-2 border-brand-navy text-brand-navy hover:bg-brand-navy hover:text-white",
  ghost: "text-brand-navy hover:bg-brand-cream-deep",
};

type CommonProps = {
  variant?: Variant;
  children: ReactNode;
  className?: string;
};

export function Button({
  variant = "primary",
  children,
  className = "",
  ...props
}: CommonProps & ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button className={`${base} ${variants[variant]} ${className}`} {...props}>
      {children}
    </button>
  );
}

export function ButtonLink({
  href,
  variant = "primary",
  children,
  className = "",
}: CommonProps & { href: string }) {
  return (
    <Link href={href} className={`${base} ${variants[variant]} ${className}`}>
      {children}
    </Link>
  );
}
