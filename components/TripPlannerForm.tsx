"use client";

import { useState, type FormEvent } from "react";
import { useTranslations } from "next-intl";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/Button";
import { FormField, Input, Select, Textarea } from "@/components/ui/FormField";

const serviceOptions = ["hotel", "transport", "tours"] as const;

export function TripPlannerForm() {
  const t = useTranslations("tripPlanner");
  const [status, setStatus] = useState<"idle" | "loading" | "done" | "error">("idle");
  const [selected, setSelected] = useState<Record<(typeof serviceOptions)[number], boolean>>({
    hotel: true,
    transport: true,
    tours: false,
  });

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!Object.values(selected).some(Boolean)) {
      setStatus("error");
      return;
    }

    setStatus("loading");
    const form = event.currentTarget;
    const data = new FormData(form);
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    const payload = {
      user_id: user?.id ?? null,
      full_name: String(data.get("full_name") ?? "").trim(),
      phone: String(data.get("phone") ?? "").trim(),
      email: String(data.get("email") ?? "").trim() || null,
      passengers: Number(data.get("passengers") || 1),
      preferred_currency: String(data.get("preferred_currency") || "USD"),
      arrival_date: String(data.get("arrival_date")),
      departure_date: String(data.get("departure_date")),
      needs_hotel: selected.hotel,
      needs_transport: selected.transport,
      needs_tours: selected.tours,
      rooms_count: selected.hotel ? Number(data.get("rooms_count") || 1) : null,
      hotel_budget: selected.hotel && data.get("hotel_budget") ? Number(data.get("hotel_budget")) : null,
      pickup_location: selected.transport ? String(data.get("pickup_location") ?? "").trim() || null : null,
      destination: "Uman",
      trip_type: selected.transport ? String(data.get("trip_type") || "one_way") : "one_way",
      pickup_time: selected.transport ? String(data.get("pickup_time") ?? "") || null : null,
      vehicle_class: selected.transport ? String(data.get("vehicle_class") || "standard") : "standard",
      luggage_count: selected.transport ? Number(data.get("luggage_count") || 0) : null,
      child_seats: selected.transport ? Number(data.get("child_seats") || 0) : 0,
      extra_stops: selected.transport ? Number(data.get("extra_stops") || 0) : 0,
      tour_interests: selected.tours
        ? String(data.get("tour_interests") ?? "").split(",").map((value) => value.trim()).filter(Boolean)
        : [],
      notes: String(data.get("notes") ?? "").trim() || null,
    };

    const { error } = await supabase.from("trip_requests").insert(payload);
    if (error) {
      setStatus("error");
      return;
    }

    form.reset();
    setStatus("done");
  }

  if (status === "done") {
    return (
      <div className="rounded-3xl border border-brand-teal/20 bg-brand-teal/10 p-8 text-center">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-brand-teal text-2xl text-white">✓</div>
        <h2 className="mt-4 font-display text-2xl font-bold text-brand-navy">{t("successTitle")}</h2>
        <p className="mt-2 text-foreground/70">{t("successDescription")}</p>
        <Button className="mt-6" onClick={() => setStatus("idle")}>{t("newRequest")}</Button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      <fieldset>
        <legend className="font-display text-lg font-bold text-brand-navy">{t("servicesTitle")}</legend>
        <div className="mt-3 grid gap-3 sm:grid-cols-3">
          {serviceOptions.map((service) => (
            <label key={service} className={`cursor-pointer rounded-2xl border-2 p-4 transition-colors ${selected[service] ? "border-brand-terracotta bg-brand-terracotta/5" : "border-brand-navy/10 bg-white"}`}>
              <input
                type="checkbox"
                checked={selected[service]}
                onChange={(event) => setSelected((current) => ({ ...current, [service]: event.target.checked }))}
                className="sr-only"
              />
              <span className="font-display font-bold text-brand-navy">{t(`services.${service}.title`)}</span>
              <span className="mt-1 block text-sm text-foreground/65">{t(`services.${service}.description`)}</span>
            </label>
          ))}
        </div>
      </fieldset>

      <div className="grid gap-4 sm:grid-cols-2">
        <FormField label={t("fullName")} htmlFor="full_name" required><Input id="full_name" name="full_name" required /></FormField>
        <FormField label={t("phone")} htmlFor="phone" required><Input id="phone" name="phone" type="tel" dir="ltr" required /></FormField>
        <FormField label={t("email")} htmlFor="email"><Input id="email" name="email" type="email" dir="ltr" /></FormField>
        <FormField label={t("passengers")} htmlFor="passengers" required><Input id="passengers" name="passengers" type="number" min={1} defaultValue={1} dir="ltr" required /></FormField>
        <FormField label={t("preferredCurrency")} htmlFor="preferred_currency"><Select id="preferred_currency" name="preferred_currency" dir="ltr"><option value="USD">USD ($)</option><option value="EUR">EUR (€)</option><option value="UAH">UAH (₴)</option></Select></FormField>
        <FormField label={t("arrivalDate")} htmlFor="arrival_date" required><Input id="arrival_date" name="arrival_date" type="date" dir="ltr" required /></FormField>
        <FormField label={t("departureDate")} htmlFor="departure_date" required><Input id="departure_date" name="departure_date" type="date" dir="ltr" required /></FormField>
      </div>

      {selected.hotel && (
        <section className="rounded-2xl bg-brand-cream-deep/60 p-5">
          <h3 className="font-display font-bold text-brand-navy">{t("hotelDetails")}</h3>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <FormField label={t("roomsCount")} htmlFor="rooms_count"><Input id="rooms_count" name="rooms_count" type="number" min={1} defaultValue={1} dir="ltr" /></FormField>
            <FormField label={t("hotelBudget")} htmlFor="hotel_budget"><Input id="hotel_budget" name="hotel_budget" type="number" min={0} dir="ltr" placeholder={t("optional")} /></FormField>
          </div>
        </section>
      )}

      {selected.transport && (
        <section className="rounded-2xl bg-brand-cream-deep/60 p-5">
          <h3 className="font-display font-bold text-brand-navy">{t("transportDetails")}</h3>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <FormField label={t("pickupLocation")} htmlFor="pickup_location"><Input id="pickup_location" name="pickup_location" placeholder={t("pickupPlaceholder")} /></FormField>
            <FormField label={t("pickupTime")} htmlFor="pickup_time"><Input id="pickup_time" name="pickup_time" type="time" dir="ltr" /></FormField>
            <FormField label={t("tripType")} htmlFor="trip_type"><Select id="trip_type" name="trip_type"><option value="one_way">{t("oneWay")}</option><option value="round_trip">{t("roundTrip")}</option></Select></FormField>
            <FormField label={t("vehicleClass")} htmlFor="vehicle_class"><Select id="vehicle_class" name="vehicle_class"><option value="standard">{t("vehicleClasses.standard")}</option><option value="comfort">{t("vehicleClasses.comfort")}</option><option value="minivan">{t("vehicleClasses.minivan")}</option><option value="van">{t("vehicleClasses.van")}</option></Select></FormField>
            <FormField label={t("luggageCount")} htmlFor="luggage_count"><Input id="luggage_count" name="luggage_count" type="number" min={0} defaultValue={0} dir="ltr" /></FormField>
            <FormField label={t("childSeats")} htmlFor="child_seats"><Input id="child_seats" name="child_seats" type="number" min={0} defaultValue={0} dir="ltr" /></FormField>
            <FormField label={t("extraStops")} htmlFor="extra_stops"><Input id="extra_stops" name="extra_stops" type="number" min={0} defaultValue={0} dir="ltr" /></FormField>
          </div>
          <p className="mt-4 text-xs text-foreground/60">{t("priceNote")}</p>
        </section>
      )}

      {selected.tours && (
        <section className="rounded-2xl bg-brand-cream-deep/60 p-5">
          <FormField label={t("tourInterests")} htmlFor="tour_interests"><Input id="tour_interests" name="tour_interests" placeholder={t("tourPlaceholder")} /></FormField>
        </section>
      )}

      <FormField label={t("notes")} htmlFor="notes"><Textarea id="notes" name="notes" placeholder={t("notesPlaceholder")} /></FormField>
      {status === "error" && <p className="text-sm font-medium text-red-600">{t("error")}</p>}
      <Button type="submit" disabled={status === "loading"} className="w-full sm:w-auto">
        {status === "loading" ? t("sending") : t("submit")}
      </Button>
    </form>
  );
}
