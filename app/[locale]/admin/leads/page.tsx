import { getTranslations } from "next-intl/server";
import { createClient } from "@/lib/supabase/server";
import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { formatDate } from "@/lib/format";

const LEAD_SOURCES = [
  { table: "vip_requests" as const, titleKey: "vipTitle" as const },
  { table: "investment_requests" as const, titleKey: "investmentTitle" as const },
  { table: "flight_requests" as const, titleKey: "flightTitle" as const },
  { table: "home_rental_leads" as const, titleKey: "homeRentalTitle" as const },
];

function LeadRow({ row }: { row: Record<string, unknown> }) {
  const entries = Object.entries(row).filter(
    ([key, value]) => !["id", "created_at"].includes(key) && value !== null && value !== ""
  );
  return (
    <Card className="p-4">
      <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm">
        {entries.map(([key, value]) => (
          <span key={key} className="text-foreground/80">
            <span className="font-semibold text-brand-navy">{key}:</span> {String(value)}
          </span>
        ))}
      </div>
      {typeof row.created_at === "string" && (
        <p className="mt-2 text-xs text-foreground/50">{formatDate(row.created_at)}</p>
      )}
    </Card>
  );
}

export default async function AdminLeadsPage() {
  const supabase = await createClient();
  const t = await getTranslations("admin.leads");

  const results = await Promise.all(
    LEAD_SOURCES.map((source) =>
      supabase.from(source.table).select("*").order("created_at", { ascending: false })
    )
  );

  return (
    <div className="flex flex-col gap-10">
      {LEAD_SOURCES.map((source, i) => {
        const rows = results[i].data ?? [];
        return (
          <div key={source.table}>
            <h2 className="font-display text-xl font-bold text-brand-navy">
              {t(source.titleKey)} <span className="text-sm font-normal text-foreground/50">({rows.length})</span>
            </h2>
            {rows.length > 0 ? (
              <div className="mt-4 flex flex-col gap-3">
                {rows.map((row) => (
                  <LeadRow key={row.id as string} row={row} />
                ))}
              </div>
            ) : (
              <EmptyState title={t("noLeads")} className="mt-4" />
            )}
          </div>
        );
      })}
    </div>
  );
}
