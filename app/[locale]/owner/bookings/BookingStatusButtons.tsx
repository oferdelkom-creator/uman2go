"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { Button } from "@/components/ui/Button";
import type { Enums } from "@/lib/types";

export function BookingStatusButtons({ bookingId, status }: { bookingId: string; status: Enums<"booking_status"> }) {
  const t = useTranslations("owner.bookings");
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function act(action: "approve" | "reject") {
    setLoading(true);
    await fetch(`/api/bookings/${bookingId}/${action}`, { method: "POST" });
    setLoading(false);
    router.refresh();
  }

  if (status === "cancelled") return null;

  return (
    <div className="flex gap-2">
      {status === "deposit_paid" && (
        <Button variant="outline" disabled={loading} onClick={() => act("approve")}>
          {t("confirmAction")}
        </Button>
      )}
      {status !== "confirmed" && (
        <Button variant="ghost" disabled={loading} onClick={() => act("reject")}>
          {t("rejectAction")}
        </Button>
      )}
    </div>
  );
}
