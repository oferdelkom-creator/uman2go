import { getLocale, getTranslations } from "next-intl/server";
import { createClient } from "@/lib/supabase/server";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/EmptyState";
import { formatDate } from "@/lib/format";
import { TourSignupStatusButton } from "@/app/[locale]/admin/tours/TourSignupStatusButton";

export default async function AdminToursPage() {
  const supabase = await createClient();
  const [t, locale] = await Promise.all([getTranslations("admin.tours"), getLocale()]);

  const { data: signups } = await supabase
    .from("tour_signups")
    .select("*, tour_date:tour_dates(title, tour_date), guide:tour_guides(name)")
    .order("created_at", { ascending: false });

  return (
    <div>
      <h2 className="font-display text-2xl font-bold text-brand-navy">{t("title")}</h2>

      {signups && signups.length > 0 ? (
        <div className="mt-6 flex flex-col gap-4">
          {signups.map((signup) => (
            <Card key={signup.id} className="flex flex-wrap items-center justify-between gap-4 p-5">
              <div>
                <p className="font-display font-bold text-brand-navy">
                  {signup.tour_date?.title} {signup.guide?.name && `· ${signup.guide.name}`}
                </p>
                <p className="text-sm text-foreground/70">
                  {signup.full_name} <span dir="ltr" className="text-brand-teal">· {signup.phone}</span>
                </p>
                <p dir="ltr" className="text-sm text-foreground/60">
                  {signup.tour_date?.tour_date && formatDate(signup.tour_date.tour_date, locale)} · {t("participantsCount", { count: signup.participants_count })}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Badge tone={signup.status === "cancelled" ? "navy" : "teal"}>
                  {signup.status === "cancelled" ? t("statusCancelled") : t("statusConfirmed")}
                </Badge>
                {signup.platform_fee_paid_at ? (
                  <Badge tone="teal">{t("feePaid")}</Badge>
                ) : (
                  <Badge tone="gold">{t("feeNotPaid")}</Badge>
                )}
                <TourSignupStatusButton signupId={signup.id} status={signup.status} />
              </div>
            </Card>
          ))}
        </div>
      ) : (
        <EmptyState title={t("noSignups")} className="mt-8" />
      )}
    </div>
  );
}
