"use client";

import { useState, type FormEvent } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/Button";
import { FormField, Input, Textarea } from "@/components/ui/FormField";
import type { LeadType } from "@/lib/notifyLead";

export type LeadField = {
  name: string;
  label: string;
  type: "text" | "tel" | "email" | "date" | "number" | "checkbox";
  required?: boolean;
};

export type LeadTable = "vip_requests" | "investment_requests" | "flight_requests" | "home_rental_leads";

export function LeadForm({
  table,
  leadType,
  extraFields = [],
  submitLabel = "שליחת בקשה",
}: {
  table: LeadTable;
  leadType: LeadType;
  extraFields?: LeadField[];
  submitLabel?: string;
}) {
  const [status, setStatus] = useState<"idle" | "loading" | "done" | "error">("idle");

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setStatus("loading");

    const formData = new FormData(e.currentTarget);
    const payload: Record<string, string | number | boolean> = {
      full_name: String(formData.get("full_name") ?? ""),
      phone: String(formData.get("phone") ?? ""),
      notes: String(formData.get("notes") ?? ""),
    };
    for (const field of extraFields) {
      if (field.type === "checkbox") {
        payload[field.name] = formData.get(field.name) === "on";
      } else if (field.type === "number") {
        payload[field.name] = Number(formData.get(field.name) ?? 0);
      } else {
        const value = formData.get(field.name);
        if (value) payload[field.name] = String(value);
      }
    }

    const supabase = createClient();
    // Fields are assembled dynamically from each lead page's field config,
    // so their shape can't be checked against a single table's Insert type.
    const { data, error } = await supabase
      .from(table)
      .insert(payload as never)
      .select("id")
      .single();

    if (error) {
      setStatus("error");
      return;
    }

    setStatus("done");
    fetch("/api/notify/new-lead", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type: leadType, id: data.id }),
    }).catch(() => {});
  }

  if (status === "done") {
    return (
      <div className="rounded-2xl bg-brand-teal/10 p-6 text-center text-brand-teal">
        <p className="font-display text-lg font-bold">הבקשה נשלחה בהצלחה!</p>
        <p className="mt-1 text-sm">ניצור איתכם קשר בהקדם.</p>
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

      {extraFields.map((field) =>
        field.type === "checkbox" ? (
          <label key={field.name} className="flex items-center gap-2 self-end pb-2 text-sm font-medium text-brand-navy">
            <input type="checkbox" name={field.name} className="h-4 w-4 rounded border-brand-navy/30 text-brand-terracotta" />
            {field.label}
          </label>
        ) : (
          <FormField key={field.name} label={field.label} htmlFor={field.name} required={field.required}>
            <Input id={field.name} name={field.name} type={field.type} required={field.required} dir={field.type === "date" || field.type === "number" ? "ltr" : undefined} />
          </FormField>
        )
      )}

      <div className="sm:col-span-2">
        <FormField label="הערות" htmlFor="notes">
          <Textarea id="notes" name="notes" />
        </FormField>
      </div>

      {status === "error" && (
        <p className="sm:col-span-2 text-sm text-red-600">אירעה שגיאה בשליחה, נסו שוב.</p>
      )}

      <div className="sm:col-span-2">
        <Button type="submit" disabled={status === "loading"}>
          {status === "loading" ? "שולח..." : submitLabel}
        </Button>
      </div>
    </form>
  );
}
