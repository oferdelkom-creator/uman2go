"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/Button";

export function RemoveAdminButton({ profileId, disabled }: { profileId: string; disabled?: boolean }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function remove() {
    setLoading(true);
    const supabase = createClient();
    await supabase.from("profiles").update({ role: "guest" }).eq("id", profileId);
    setLoading(false);
    router.refresh();
  }

  return (
    <Button variant="ghost" disabled={loading || disabled} onClick={remove}>
      הסרת הרשאה
    </Button>
  );
}
