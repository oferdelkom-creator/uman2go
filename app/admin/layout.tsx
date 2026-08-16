import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

const ADMIN_NAV = [
  { href: "/admin", label: "סקירה" },
  { href: "/admin/bookings", label: "הזמנות" },
  { href: "/admin/leads", label: "פניות" },
  { href: "/admin/transport", label: "הסעות" },
  { href: "/admin/tours", label: "טיולים" },
  { href: "/admin/team", label: "צוות" },
] as const;

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/admin");

  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).maybeSingle();
  if (profile?.role !== "admin") redirect("/");

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
      <h1 className="font-display text-2xl font-extrabold text-brand-navy">פאנל ניהול</h1>
      <nav className="mt-4 flex flex-wrap gap-2 border-b border-brand-navy/10 pb-4">
        {ADMIN_NAV.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="rounded-full px-4 py-1.5 text-sm font-semibold text-brand-navy/80 transition-colors hover:bg-brand-cream-deep hover:text-brand-terracotta"
          >
            {item.label}
          </Link>
        ))}
      </nav>
      <div className="mt-8">{children}</div>
    </div>
  );
}
