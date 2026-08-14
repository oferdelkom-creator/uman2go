import Link from "next/link";
import { Logo } from "@/components/Logo";
import { SITE_NAME, SITE_TAGLINE } from "@/lib/constants";

const columns = [
  {
    title: "שירותים",
    links: [
      { href: "/hotels", label: "מלונות" },
      { href: "/transport", label: "הסעות" },
      { href: "/tours", label: "טיולים" },
    ],
  },
  {
    title: "עוד",
    links: [
      { href: "/vip", label: "VIP" },
      { href: "/investments", label: "השקעות" },
      { href: "/flights", label: "טיסות" },
      { href: "/home-rentals", label: "השכרת נכסים" },
    ],
  },
  {
    title: "מידע",
    links: [
      { href: "/about", label: "אודות" },
      { href: "/contact", label: "צור קשר" },
      { href: "/terms", label: "תקנון" },
    ],
  },
];

export default function Footer() {
  return (
    <footer className="border-t border-brand-navy/10 bg-brand-navy text-white">
      <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid gap-10 sm:grid-cols-2 md:grid-cols-4">
          <div>
            <div className="flex items-center gap-2 font-display text-lg font-extrabold">
              <Logo className="h-9 w-auto" />
              {SITE_NAME}
            </div>
            <p className="mt-3 text-sm text-white/70">{SITE_TAGLINE}</p>
          </div>
          {columns.map((col) => (
            <div key={col.title}>
              <p className="font-display text-sm font-bold text-brand-gold">{col.title}</p>
              <ul className="mt-3 space-y-2">
                {col.links.map((link) => (
                  <li key={link.href}>
                    <Link href={link.href} className="text-sm text-white/70 hover:text-white">
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <p className="mt-10 border-t border-white/10 pt-6 text-center text-xs text-white/50">
          © {new Date().getFullYear()} {SITE_NAME}
        </p>
      </div>
    </footer>
  );
}
