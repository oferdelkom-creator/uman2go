"use client";

import { useState, type FormEvent } from "react";
import { useTranslations } from "next-intl";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/Button";
import { FormField, Input, Select } from "@/components/ui/FormField";

const VEHICLE_TYPES = ["private", "minivan", "bus"] as const;

export function HomeTransportQuickForm() {
  const t = useTranslations("home.transportQuick");
  const [status, setStatus] = useState<"idle" | "loading" | "done" | "error">("idle");

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setStatus("loading");
    const formData = new FormData(e.currentTarget);

    const payload = {
      full_name: String(formData.get("full_name")),
      phone: String(formData.get("phone")),
      origin: String(formData.get("origin")),
      destination: String(formData.get("destination")),
      departure_date: String(formData.get("departure_date")),
      departure_time: String(formData.get("departure_time") || "") || null,
      guests_count: Number(formData.get("guests_count") || 1),
      vehicle_type: String(formData.get("vehicle_type")),
      notes: "",
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
        <p className="font-display text-lg font-bold">{t("sentTitle")}</p>
        <p className="mt-1 text-sm">{t("sentDesc")}</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      <FormField label={t("fullName")} htmlFor="quick-full-name" required>
        <Input id="quick-full-name" name="full_name" required />
      </FormField>
      <FormField label={t("phone")} htmlFor="quick-phone" required>
        <Input id="quick-phone" name="phone" type="tel" dir="ltr" required />
      </FormField>
      <FormField label={t("passengers")} htmlFor="quick-guests" required>
        <Input id="quick-guests" name="guests_count" type="number" dir="ltr" min={1} defaultValue={1} required />
      </FormField>
      <FormField label={t("origin")} htmlFor="quick-origin" required>
        <Input id="quick-origin" name="origin" placeholder={t("originPlaceholder")} required />
      </FormField>
      <FormField label={t("destination")} htmlFor="quick-destination" required>
        <Input id="quick-destination" name="destination" placeholder={t("destinationPlaceholder")} required />
      </FormField>
      <FormField label={t("vehicleType")} htmlFor="quick-vehicle" required>
        <Select id="quick-vehicle" name="vehicle_type" defaultValue="private" required>
          {VEHICLE_TYPES.map((v) => (
            <option key={v} value={v}>
              {t(`vehicle.${v}`)}
            </option>
          ))}
        </Select>
      </FormField>
      <FormField label={t("departureDate")} htmlFor="quick-date" required>
        <Input id="quick-date" name="departure_date" type="date" dir="ltr" required />
      </FormField>
      <FormField label={t("departureTime")} htmlFor="quick-time">
        <Input id="quick-time" name="departure_time" type="time" dir="ltr" />
      </FormField>
      <div className="flex items-end">
        <Button type="submit" disabled={status === "loading"} className="w-full">
          {status === "loading" ? t("sending") : t("submit")}
        </Button>
      </div>
      {status === "error" && <p className="sm:col-span-2 lg:col-span-3 text-sm text-red-600">{t("genericError")}</p>}
    </form>
  );
}
