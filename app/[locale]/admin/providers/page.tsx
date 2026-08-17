import { getLocale, getTranslations } from "next-intl/server";
import { createClient } from "@/lib/supabase/server";
import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { formatDate } from "@/lib/format";
import { ProviderStatusButton } from "@/app/[locale]/admin/providers/ProviderStatusButton";
import type { ProviderApplication } from "@/lib/types";

const PROVIDER_TYPES = ["hotel", "apartment", "driver", "tour"] as const;

const DISPLAY_FIELDS: Record<(typeof PROVIDER_TYPES)[number], (keyof ProviderApplication)[]> = {
  hotel: ["location", "room_count", "bed_count", "max_guests", "price_estimate", "availability_notes"],
  apartment: ["location", "room_count", "bed_count", "max_guests", "price_estimate", "availability_notes"],
  driver: ["vehicle_type", "passenger_capacity", "routes", "languages_spoken"],
  tour: ["tour_description", "duration", "group_size", "languages_spoken"],
};

function ApplicationCard({ app, locale }: { app: ProviderApplication; locale: string }) {
  const fields = DISPLAY_FIELDS[app.provider_type as (typeof PROVIDER_TYPES)[number]] ?? [];
  return (
    <Card className="flex flex-wrap items-start justify-between gap-4 p-5">
      <div className="min-w-0 flex-1">
        <p className="font-display font-bold text-brand-navy">
          {app.full_name} <span dir="ltr" className="font-normal text-brand-teal">· {app.phone}</span>
        </p>
        {(app.whatsapp || app.telegram || app.preferred_language) && (
          <p className="mt-0.5 text-xs text-foreground/60">
            {[app.whatsapp && `WhatsApp: ${app.whatsapp}`, app.telegram && `Telegram: ${app.telegram}`, app.preferred_language]
              .filter(Boolean)
              .join(" · ")}
          </p>
        )}
        <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-sm text-foreground/80">
          {fields
            .filter((key) => app[key] !== null && app[key] !== "")
            .map((key) => (
              <span key={String(key)}>
                <span className="font-semibold text-brand-navy">{String(key)}:</span> {String(app[key])}
              </span>
            ))}
        </div>
        {app.notes && <p className="mt-2 text-sm text-foreground/60">{app.notes}</p>}
        {(app.photos?.length ?? 0) > 0 && <p className="mt-2 text-xs text-brand-teal">{app.photos!.length} photos</p>}
        {app.source && <p className="mt-1 text-xs text-foreground/40">source: {app.source}</p>}
        {app.created_at && <p className="mt-2 text-xs text-foreground/50">{formatDate(app.created_at, locale)}</p>}
      </div>
      <ProviderStatusButton id={app.id} status={app.status} />
    </Card>
  );
}

export default async function AdminProvidersPage() {
  const supabase = await createClient();
  const [t, locale] = await Promise.all([getTranslations("admin.providers"), getLocale()]);

  const { data: applications } = await supabase
    .from("provider_applications")
    .select("*")
    .order("created_at", { ascending: false });

  return (
    <div className="flex flex-col gap-10">
      {PROVIDER_TYPES.map((type) => {
        const rows = (applications ?? []).filter((a) => a.provider_type === type);
        return (
          <div key={type}>
            <h2 className="font-display text-xl font-bold text-brand-navy">
              {t(`types.${type}`)} <span className="text-sm font-normal text-foreground/50">({rows.length})</span>
            </h2>
            {rows.length > 0 ? (
              <div className="mt-4 flex flex-col gap-3">
                {rows.map((app) => (
                  <ApplicationCard key={app.id} app={app} locale={locale} />
                ))}
              </div>
            ) : (
              <EmptyState title={t("noApplications")} className="mt-4" />
            )}
          </div>
        );
      })}
    </div>
  );
}
