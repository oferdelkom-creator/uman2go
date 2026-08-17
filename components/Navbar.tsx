import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { createClient } from "@/lib/supabase/server";
import { Logo } from "@/components/Logo";
import { ButtonLink } from "@/components/ui/Button";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { NAV_LINKS, SITE_NAME } from "@/lib/constants";

export default async function Navbar() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const t = await getTranslations("nav");

  let isOwner = false;
  if (user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .maybeSingle();
    isOwner = profile?.role === "hotel_owner";
  }

  return (
    <header className="sticky top-0 z-30 border-b border-brand-navy/10 bg-background/90 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3 sm:px-6 lg:px-8">
        <Link href="/" className="flex items-center gap-2 font-display text-xl font-extrabold text-brand-navy">
          <Logo className="h-9 w-auto" />
          {SITE_NAME}
        </Link>

        <nav className="hidden items-center gap-6 md:flex">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="text-sm font-semibold text-brand-navy/80 transition-colors hover:text-brand-terracotta"
            >
              {t(link.key)}
            </Link>
          ))}
        </nav>

        <div className="hidden items-center gap-3 md:flex">
          <Link
            href="/join"
            className="rounded-full border border-brand-navy/20 px-3.5 py-1.5 text-sm font-semibold text-brand-navy/80 transition-colors hover:border-brand-terracotta hover:text-brand-terracotta"
          >
            {t("joinAsProvider")}
          </Link>
          <LanguageSwitcher />
          {user ? (
            <ButtonLink href={isOwner ? "/owner" : "/hotels"} variant="outline">
              {isOwner ? t("myArea") : t("searchHotels")}
            </ButtonLink>
          ) : (
            <>
              <Link href="/login" className="text-sm font-semibold text-brand-navy/80 hover:text-brand-terracotta">
                {t("login")}
              </Link>
              <ButtonLink href="/signup">{t("signup")}</ButtonLink>
            </>
          )}
        </div>

        <label htmlFor="mobile-menu-toggle" className="cursor-pointer md:hidden" aria-label={t("menu")}>
          <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-brand-navy">
            <path d="M3 6h18M3 12h18M3 18h18" strokeLinecap="round" />
          </svg>
        </label>
      </div>

      <input type="checkbox" id="mobile-menu-toggle" className="peer hidden" />
      <nav className="hidden flex-col gap-1 border-t border-brand-navy/10 bg-background px-4 py-3 peer-checked:flex md:hidden">
        {NAV_LINKS.map((link) => (
          <Link key={link.href} href={link.href} className="rounded-lg px-3 py-2 text-sm font-semibold text-brand-navy hover:bg-brand-cream-deep">
            {t(link.key)}
          </Link>
        ))}
        <Link href="/join" className="rounded-lg px-3 py-2 text-sm font-semibold text-brand-navy hover:bg-brand-cream-deep">
          {t("joinAsProvider")}
        </Link>
        <div className="mt-2 flex items-center gap-2">
          <LanguageSwitcher />
        </div>
        <div className="mt-2 flex gap-2">
          {user ? (
            <ButtonLink href={isOwner ? "/owner" : "/hotels"} variant="outline" className="flex-1">
              {isOwner ? t("myArea") : t("searchHotels")}
            </ButtonLink>
          ) : (
            <>
              <ButtonLink href="/login" variant="outline" className="flex-1">{t("login")}</ButtonLink>
              <ButtonLink href="/signup" className="flex-1">{t("signup")}</ButtonLink>
            </>
          )}
        </div>
      </nav>
    </header>
  );
}
