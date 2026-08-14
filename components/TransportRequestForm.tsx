"use client";

import { useState, type FormEvent } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/Button";
import { FormField, Input, Textarea } from "@/components/ui/FormField";

export function TransportRequestForm({ driverId }: { driverId?: string }) {
  const [status, setStatus] = useState<"idle" | "loading" | "done" | "error">("idle");

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setStatus("loading");
    const formData = new FormData(e.currentTarget);

    const payload = {
      full_name: String(formData.get("full_name")),
      phone: String(formData.get("phone")),
      destination: String(formData.get("destination")),
      departure_date: String(formData.get("departure_date")),
      round_trip: formData.get("round_trip") === "on",
      guests_count: Number(formData.get("guests_count") || 1),
      notes: String(formData.get("notes") ?? ""),
      driver_id: driverId ?? null,
    };

    const supabase = createClient();
    const { data, error } = await supabase.from("transport_requests").insert(payload).select("id").single();

    if (error) {
      setStatus("error");
      return;
    }

    setStatus("done");
    fetch("/api/notify/new-transport-request", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: data.id }),
    }).catch(() => {});
  }

  if (status === "done") {
    return (
      <div className="rounded-2xl bg-brand-teal/10 p-6 text-center text-brand-teal">
        <p className="font-display text-lg font-bold">הבקשה נשלחה!</p>
        <p className="mt-1 text-sm">ניצור איתכם קשר לתיאום ההסעה.</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="grid gap-4 sm:grid-cols-2">
      <FormField label="שם מלא" htmlFor="full_name" required>
        <Input id="full_name" name="full_name" required />
      </FormField>
      <FormField label="טלפון" htmlFor="phone" required>
        <Input id="phone" name="phone" type="tel" dir="ltr" required />
      </FormField>
      <FormField label="יעד" htmlFor="destination" required>
        <Input id="destination" name="destination" placeholder="קייב, בורדיצ'ב..." required />
      </FormField>
      <FormField label="תאריך יציאה" htmlFor="departure_date" required>
        <Input id="departure_date" name="departure_date" type="date" dir="ltr" required />
      </FormField>
      <FormField label="מספר נוסעים" htmlFor="guests_count" required>
        <Input id="guests_count" name="guests_count" type="number" dir="ltr" min={1} defaultValue={1} required />
      </FormField>
      <label className="flex items-center gap-2 self-end pb-2 text-sm font-medium text-brand-navy">
        <input type="checkbox" name="round_trip" className="h-4 w-4 rounded border-brand-navy/30 text-brand-terracotta" />
        הלוך ושוב
      </label>
      <div className="sm:col-span-2">
        <FormField label="הערות" htmlFor="notes">
          <Textarea id="notes" name="notes" />
        </FormField>
      </div>
      {status === "error" && <p className="sm:col-span-2 text-sm text-red-600">אירעה שגיאה, נסו שוב.</p>}
      <div className="sm:col-span-2">
        <Button type="submit" disabled={status === "loading"}>
          {status === "loading" ? "שולח..." : "שליחת בקשה"}
        </Button>
      </div>
    </form>
  );
}
