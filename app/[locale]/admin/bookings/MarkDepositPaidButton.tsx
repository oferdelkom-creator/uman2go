"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { Button } from "@/components/ui/Button";

export function MarkDepositPaidButton({ bookingId }: { bookingId: string }) {
  const t = useTranslations("admin.bookings");
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function markPaid() {
    setLoading(true);
    await fetch(`/api/bookings/${bookingId}/mark-deposit-paid`, { method: "POST" });
    setLoading(false);
    router.refresh();
  }

  return (
    <Button variant="outline" disabled={loading} onClick={markPaid}>
      {t("markDepositPaid")}
    </Button>
  );
}
