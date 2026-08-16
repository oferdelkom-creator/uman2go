import { createClient } from "@/lib/supabase/server";
import { Card } from "@/components/ui/Card";
import { PromoteAdminForm } from "@/app/[locale]/admin/team/PromoteAdminForm";
import { RemoveAdminButton } from "@/app/[locale]/admin/team/RemoveAdminButton";

export default async function AdminTeamPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: admins } = await supabase
    .from("profiles")
    .select("id, full_name, email, phone")
    .eq("role", "admin")
    .order("full_name");

  return (
    <div>
      <h2 className="font-display text-2xl font-bold text-brand-navy">צוות ניהול</h2>
      <p className="mt-1 text-sm text-foreground/60">
        רק משתמשים שכבר נרשמו באתר (בעמוד ההרשמה הרגיל) ניתן להפוך למנהלים.
      </p>

      <Card className="mt-6 p-5">
        <PromoteAdminForm />
      </Card>

      <div className="mt-6 flex flex-col gap-3">
        {(admins ?? []).map((admin) => (
          <Card key={admin.id} className="flex flex-wrap items-center justify-between gap-3 p-4">
            <div>
              <p className="font-semibold text-brand-navy">
                {admin.full_name || "ללא שם"} {admin.id === user?.id && <span className="text-xs text-foreground/50">(את/ה)</span>}
              </p>
              <p dir="ltr" className="text-sm text-foreground/60">
                {admin.email} {admin.phone && `· ${admin.phone}`}
              </p>
            </div>
            <RemoveAdminButton profileId={admin.id} disabled={admin.id === user?.id} />
          </Card>
        ))}
      </div>
    </div>
  );
}
