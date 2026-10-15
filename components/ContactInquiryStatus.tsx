"use client";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

export function ContactInquiryStatus({ id, initialStatus }: { id: string; initialStatus: string }) {
  const [status, setStatus] = useState(initialStatus);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(false);
  async function update(value: string) {
    setBusy(true); setError(false);
    try {
      const result = await createClient().from("contact_inquiries").update({ status: value }).eq("id", id).select("id");
      if (result.error || !result.data?.length) throw new Error();
      setStatus(value);
    } catch { setError(true); }
    finally { setBusy(false); }
  }
  return <div>
    <label>סטטוס טיפול <select value={status} disabled={busy} onChange={event => void update(event.target.value)} className="rounded border p-2">
      <option value="new">חדש</option><option value="follow_up">בטיפול</option><option value="closed">סגור</option>
    </select></label>
    {error && <p role="alert">הסטטוס לא נשמר. נסו שוב.</p>}
  </div>;
}
