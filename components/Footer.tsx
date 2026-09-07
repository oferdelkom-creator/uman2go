import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { Logo } from "@/components/Logo";
import { SITE_NAME } from "@/lib/constants";

export default async function Footer() {
  const t = await getTranslations();

  const columns = [
    {
      title: t("footer.services"),
      links: [
        { href: "/hotels", label: t("nav.hotels") },
        { href: "/apartments", label: t("footer.apartments") },
        { href: "/transport", label: t("nav.transport") },
        { href: "/tours", label: t("nav.tours") },
      ],
    },
    {
      title: t("footer.more"),
      links: [
        { href: "/vip", label: t("nav.vip") },
        { href: "/investments", label: t("footer.investments") },
        { href: "/flights", label: t("footer.flights") },
        { href: "/join", label: t("footer.joinAsProvider") },
      ],
    },
    {
      title: t("footer.info"),
      links: [
        { href: "/about", label: t("footer.about") },
        { href: "/contact", label: t("footer.contact") },
        { href: "/terms", label: t("footer.terms") },
      ],
    },
  ];

  return (
    <footer className="border-t border-brand-navy/10 bg-brand-navy text-white">
      <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid gap-10 sm:grid-cols-2 md:grid-cols-4">
          <div>
            <div className="flex items-center gap-2 font-display text-lg font-extrabold">
              <Logo className="h-9 w-auto" />
              {SITE_NAME}
            </div>
            <p className="mt-3 text-sm text-white/70">{t("meta.tagline")}</p>
            <a href="https://www.facebook.com/profile.php?id=61594441581119" target="_blank" rel="noopener noreferrer" className="mt-4 inline-block text-sm text-white underline underline-offset-4">Uman2Go · Facebook</a>
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

