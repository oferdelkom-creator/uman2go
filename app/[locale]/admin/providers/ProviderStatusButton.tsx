"use client";

import { useState, type ChangeEvent } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { createClient } from "@/lib/supabase/client";
import { Select } from "@/components/ui/FormField";

const STATUSES = ["new", "in_review", "contacted", "approved", "rejected"] as const;

export function ProviderStatusButton({ id, status }: { id: string; status: string }) {
  const t = useTranslations("admin.providers");
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleChange(e: ChangeEvent<HTMLSelectElement>) {
    const newStatus = e.target.value;
    setLoading(true);
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    await supabase
      .from("provider_applications")
      .update({ status: newStatus, reviewed_at: new Date().toISOString(), reviewed_by: user?.id ?? null })
      .eq("id", id);
    setLoading(false);
    router.refresh();
  }

  return (
    <Select value={status} onChange={handleChange} disabled={loading} className="w-auto text-sm">
      {STATUSES.map((s) => (
        <option key={s} value={s}>
          {t(`status.${s}`)}
        </option>
      ))}
    </Select>
  );
}
