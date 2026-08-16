"use client";

import { useState } from "react";
import { useRouter } from "@/i18n/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/Button";
import type { Enums } from "@/lib/types";

export function BookingStatusButtons({ bookingId, status }: { bookingId: string; status: Enums<"booking_status"> }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function updateStatus(next: Enums<"booking_status">) {
    setLoading(true);
    const supabase = createClient();
    await supabase.from("bookings").update({ status: next }).eq("id", bookingId);
    fetch("/api/notify/booking-status-changed", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: bookingId, status: next }),
    }).catch(() => {});
    setLoading(false);
    router.refresh();
  }

  if (status === "cancelled") return null;

  return (
    <div className="flex gap-2">
      {status !== "confirmed" && (
        <Button variant="outline" disabled={loading} onClick={() => updateStatus("confirmed")}>
          אישור הזמנה
        </Button>
      )}
      <Button variant="ghost" disabled={loading} onClick={() => updateStatus("cancelled")}>
        ביטול
      </Button>
    </div>
  );
}
