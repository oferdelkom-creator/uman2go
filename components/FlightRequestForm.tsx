"use client";

import { useState, type FormEvent } from "react";
import { useTranslations } from "next-intl";
import { createClient } from "@/lib/supabase/client";
import { WHATSAPP_NUMBER } from "@/lib/constants";
import { Button } from "@/components/ui/Button";
import { FormField, Input, Select, Textarea } from "@/components/ui/FormField";

const UPSELLS = ["wants_hotel", "wants_transport", "wants_tour", "wants_vip"] as const;

export function FlightRequestForm() {
  const t = useTranslations("flights.form");
  const [status, setStatus] = useState<"idle" | "loading" | "upsell" | "done" | "error">("idle");
  const [requestId, setRequestId] = useState<string | null>(null);
  const [upsells, setUpsells] = useState<Record<(typeof UPSELLS)[number], boolean>>({
    wants_hotel: false,
    wants_transport: false,
    wants_tour: false,
    wants_vip: false,
  });

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setStatus("loading");
    const formData = new FormData(e.currentTarget);

    const adultsCount = Number(formData.get("adults_count") || 1);
    const childrenCount = Number(formData.get("children_count") || 0);

    const payload = {
      full_name: String(formData.get("full_name")),
      phone: String(formData.get("phone")),
      whatsapp: String(formData.get("whatsapp") || "") || null,
      origin_city: String(formData.get("origin_city") || "") || null,
      preferred_destination: String(formData.get("preferred_destination") || "") || null,
      departure_date: String(formData.get("departure_date")),
      return_date: String(formData.get("return_date") || "") || null,
      adults_count: adultsCount,
      children_count: childrenCount,
      passengers_count: adultsCount + childrenCount,
      luggage_type: String(formData.get("luggage_type") || "") || null,
      flight_preference: String(formData.get("flight_preference") || "") || null,
      budget_estimate: String(formData.get("budget_estimate") || "") || null,
      notes: String(formData.get("notes") || ""),
    };

    const supabase = createClient();
    const { data, error } = await supabase.from("flight_requests").insert(payload).select("id").single();

    if (error) {
      setStatus("error");
      return;
    }

    setRequestId(data.id);
    setStatus("upsell");
    fetch("/api/notify/new-lead", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type: "flight", id: data.id }),
    }).catch(() => {});
  }

  async function handleUpsellSubmit() {
    if (requestId) {
      const supabase = createClient();
      await supabase.from("flight_requests").update(upsells).eq("id", requestId);
    }
    setStatus("done");
  }

  if (status === "done") {
    return (
      <div className="rounded-2xl bg-brand-teal/10 p-8 text-center text-brand-teal">
        <p className="font-display text-lg font-bold">{t("sentTitle")}</p>
        <p className="mt-2 text-sm">{t("sentDesc")}</p>
        <a
          href={`https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(t("whatsappPrefill"))}`}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-5 inline-flex items-center justify-center gap-2 rounded-full bg-[#25D366] px-6 py-2.5 text-sm font-semibold text-white transition-transform hover:-translate-y-0.5"
        >
          {t("whatsappFollowUp")}
        </a>
      </div>
    );
  }

  if (status === "upsell") {
    return (
      <div>
        <p className="font-display text-lg font-bold text-brand-navy">{t("upsell.title")}</p>
        <div className="mt-4 grid gap-2 sm:grid-cols-2">
          {UPSELLS.map((key) => (
            <label key={key} className="flex items-center gap-2 rounded-xl border border-brand-navy/10 p-3 text-sm font-medium text-brand-navy">
              <input
                type="checkbox"
                checked={upsells[key]}
                onChange={(e) => setUpsells((u) => ({ ...u, [key]: e.target.checked }))}
                className="h-4 w-4 rounded border-brand-navy/30 text-brand-terracotta"
              />
              {t(`upsell.${key}`)}
            </label>
          ))}
        </div>
        <Button type="button" className="mt-5" onClick={handleUpsellSubmit}>
          {t("upsell.submit")}
        </Button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="grid gap-4 sm:grid-cols-2">
      <FormField label={t("fullName")} htmlFor="full_name" required>
        <Input id="full_name" name="full_name" required />
      </FormField>
      <FormField label={t("phone")} htmlFor="phone" required>
        <Input id="phone" name="phone" type="tel" dir="ltr" required />
      </FormField>
      <FormField label={t("whatsapp")} htmlFor="whatsapp">
        <Input id="whatsapp" name="whatsapp" type="tel" dir="ltr" />
      </FormField>
      <FormField label={t("originCity")} htmlFor="origin_city" required>
        <Input id="origin_city" name="origin_city" required />
      </FormField>
      <FormField label={t("preferredDestination")} htmlFor="preferred_destination">
        <Input id="preferred_destination" name="preferred_destination" />
      </FormField>
      <FormField label={t("departureDate")} htmlFor="departure_date" required>
        <Input id="departure_date" name="departure_date" type="date" dir="ltr" required />
      </FormField>
      <FormField label={t("returnDate")} htmlFor="return_date">
        <Input id="return_date" name="return_date" type="date" dir="ltr" />
      </FormField>
      <FormField label={t("adultsCount")} htmlFor="adults_count" required>
        <Input id="adults_count" name="adults_count" type="number" dir="ltr" min={1} defaultValue={1} required />
      </FormField>
      <FormField label={t("childrenCount")} htmlFor="children_count">
        <Input id="children_count" name="children_count" type="number" dir="ltr" min={0} defaultValue={0} />
      </FormField>
      <FormField label={t("luggageType")} htmlFor="luggage_type">
        <Select id="luggage_type" name="luggage_type" defaultValue="">
          <option value="">—</option>
          <option value="carry_on">{t("luggage.carryOn")}</option>
          <option value="checked">{t("luggage.checked")}</option>
          <option value="both">{t("luggage.both")}</option>
        </Select>
      </FormField>
      <FormField label={t("flightPreference")} htmlFor="flight_preference">
        <Select id="flight_preference" name="flight_preference" defaultValue="">
          <option value="">—</option>
          <option value="direct">{t("preference.direct")}</option>
          <option value="connection">{t("preference.connection")}</option>
          <option value="no_preference">{t("preference.noPreference")}</option>
        </Select>
      </FormField>
      <FormField label={t("budgetEstimate")} htmlFor="budget_estimate">
        <Input id="budget_estimate" name="budget_estimate" placeholder={t("budgetEstimatePlaceholder")} />
      </FormField>
      <div className="sm:col-span-2">
        <FormField label={t("notes")} htmlFor="notes">
          <Textarea id="notes" name="notes" />
        </FormField>
      </div>
      {status === "error" && <p className="sm:col-span-2 text-sm text-red-600">{t("genericError")}</p>}
      <div className="sm:col-span-2">
        <Button type="submit" disabled={status === "loading"}>
          {status === "loading" ? t("sending") : t("submit")}
        </Button>
      </div>
    </form>
  );
}
