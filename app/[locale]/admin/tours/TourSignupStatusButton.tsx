"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/Button";

export function TourSignupStatusButton({ signupId, status }: { signupId: string; status: string }) {
  const t = useTranslations("admin.tours");
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function cancel() {
    setLoading(true);
    const supabase = createClient();
    await supabase.from("tour_signups").update({ status: "cancelled" }).eq("id", signupId);
    setLoading(false);
    router.refresh();
  }

  if (status === "cancelled") return null;

  return (
    <Button variant="ghost" disabled={loading} onClick={cancel}>
      {t("cancelAction")}
    </Button>
  );
}
