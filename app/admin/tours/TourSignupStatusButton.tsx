"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/Button";

export function TourSignupStatusButton({ signupId, status }: { signupId: string; status: string }) {
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
      ביטול
    </Button>
  );
}
