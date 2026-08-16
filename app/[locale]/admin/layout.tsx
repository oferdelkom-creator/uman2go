import { Link, redirect } from "@/i18n/navigation";
import { getLocale, getTranslations } from "next-intl/server";
import { createClient } from "@/lib/supabase/server";

const ADMIN_NAV = [
  { href: "/admin", key: "overview" },
  { href: "/admin/bookings", key: "bookings" },
  { href: "/admin/leads", key: "leads" },
  { href: "/admin/transport", key: "transport" },
  { href: "/admin/tours", key: "tours" },
  { href: "/admin/team", key: "team" },
] as const;

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const locale = await getLocale();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    redirect({ href: "/login?next=/admin", locale });
    return;
  }

  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).maybeSingle();
  if (profile?.role !== "admin") redirect({ href: "/", locale });

  const t = await getTranslations("admin.nav");

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
      <h1 className="font-display text-2xl font-extrabold text-brand-navy">{t("panelTitle")}</h1>
      <nav className="mt-4 flex flex-wrap gap-2 border-b border-brand-navy/10 pb-4">
        {ADMIN_NAV.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="rounded-full px-4 py-1.5 text-sm font-semibold text-brand-navy/80 transition-colors hover:bg-brand-cream-deep hover:text-brand-terracotta"
          >
            {t(item.key)}
          </Link>
        ))}
      </nav>
      <div className="mt-8">{children}</div>
    </div>
  );
}
