"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { FormField, Input, Select, Textarea } from "@/components/ui/FormField";
import { ProviderPhotoUpload } from "@/components/ProviderPhotoUpload";

const PROVIDER_TYPES = ["hotel", "apartment", "driver", "tour"] as const;
type ProviderType = (typeof PROVIDER_TYPES)[number];

type FormState = {
  provider_type: ProviderType;
  full_name: string;
  phone: string;
  whatsapp: string;
  telegram: string;
  preferred_language: string;
  location: string;
  room_count: string;
  bed_count: string;
  max_guests: string;
  price_estimate: string;
  availability_notes: string;
  vehicle_type: string;
  passenger_capacity: string;
  routes: string;
  tour_description: string;
  duration: string;
  group_size: string;
  languages_spoken: string;
  notes: string;
  photos: string[];
};

function isProviderType(value: string | undefined): value is ProviderType {
  return PROVIDER_TYPES.includes(value as ProviderType);
}

const emptyForm = (type: ProviderType): FormState => ({
  provider_type: type,
  full_name: "",
  phone: "",
  whatsapp: "",
  telegram: "",
  preferred_language: "",
  location: "",
  room_count: "",
  bed_count: "",
  max_guests: "",
  price_estimate: "",
  availability_notes: "",
  vehicle_type: "",
  passenger_capacity: "",
  routes: "",
  tour_description: "",
  duration: "",
  group_size: "",
  languages_spoken: "",
  notes: "",
  photos: [],
});

export function ProviderSignupForm({ initialType }: { initialType?: string }) {
  const t = useTranslations("providerSignup");
  const [step, setStep] = useState(1);
  const [form, setForm] = useState<FormState>(emptyForm(isProviderType(initialType) ? initialType : "hotel"));
  const [status, setStatus] = useState<"idle" | "loading" | "done" | "error">("idle");

  function update<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  const isProperty = form.provider_type === "hotel" || form.provider_type === "apartment";
  const isDriver = form.provider_type === "driver";
  const isTour = form.provider_type === "tour";

  async function handleSubmit() {
    setStatus("loading");
    const payload = {
      provider_type: form.provider_type,
      source: "join_hub",
      full_name: form.full_name,
      phone: form.phone,
      whatsapp: form.whatsapp || null,
      telegram: form.telegram || null,
      preferred_language: form.preferred_language || null,
      location: isProperty ? form.location || null : null,
      room_count: isProperty && form.room_count ? Number(form.room_count) : null,
      bed_count: isProperty && form.bed_count ? Number(form.bed_count) : null,
      max_guests: isProperty && form.max_guests ? Number(form.max_guests) : null,
      price_estimate: isProperty ? form.price_estimate || null : isTour ? form.price_estimate || null : null,
      availability_notes: isProperty ? form.availability_notes || null : null,
      vehicle_type: isDriver ? form.vehicle_type || null : null,
      passenger_capacity: isDriver && form.passenger_capacity ? Number(form.passenger_capacity) : null,
      routes: isDriver ? form.routes || null : null,
      tour_description: isTour ? form.tour_description || null : null,
      duration: isTour ? form.duration || null : null,
      group_size: isTour && form.group_size ? Number(form.group_size) : null,
      languages_spoken: isDriver || isTour ? form.languages_spoken || null : null,
      notes: form.notes,
      photos: form.photos,
    };

    const supabase = createClient();
    const { data, error } = await supabase.from("provider_applications").insert(payload).select("id").single();

    if (error) {
      setStatus("error");
      return;
    }

    setStatus("done");
    fetch("/api/notify/new-lead", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type: "provider", id: data.id }),
    }).catch(() => {});
  }

  if (status === "done") {
    return (
      <div className="rounded-2xl bg-brand-teal/10 p-8 text-center text-brand-teal">
        <p className="font-display text-lg font-bold">{t("confirmation.title")}</p>
        <p className="mt-2 text-sm">{t("confirmation.desc")}</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-center gap-2">
        {[1, 2, 3, 4, 5].map((n) => (
          <span
            key={n}
            className={`h-2 w-8 rounded-full ${n <= step ? "bg-brand-terracotta" : "bg-brand-navy/10"}`}
            aria-hidden
          />
        ))}
      </div>

      {step === 1 && (
        <div>
          <h2 className="font-display text-lg font-bold text-brand-navy">{t("step1.title")}</h2>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            {PROVIDER_TYPES.map((type) => (
              <button
                key={type}
                type="button"
                onClick={() => update("provider_type", type)}
                className={`rounded-2xl border-2 p-4 text-start transition-colors ${
                  form.provider_type === type ? "border-brand-terracotta bg-brand-terracotta/5" : "border-brand-navy/10 hover:border-brand-navy/30"
                }`}
              >
                <p className="font-display font-bold text-brand-navy">{t(`types.${type}.title`)}</p>
                <p className="mt-1 text-sm text-foreground/60">{t(`types.${type}.desc`)}</p>
              </button>
            ))}
          </div>
        </div>
      )}

      {step === 2 && (
        <div>
          <h2 className="font-display text-lg font-bold text-brand-navy">{t("step2.title")}</h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <FormField label={t("fullName")} htmlFor="full_name" required>
              <Input id="full_name" value={form.full_name} onChange={(e) => update("full_name", e.target.value)} required />
            </FormField>
            <FormField label={t("phone")} htmlFor="phone" required>
              <Input id="phone" type="tel" dir="ltr" value={form.phone} onChange={(e) => update("phone", e.target.value)} required />
            </FormField>
            <FormField label={t("whatsapp")} htmlFor="whatsapp">
              <Input id="whatsapp" type="tel" dir="ltr" value={form.whatsapp} onChange={(e) => update("whatsapp", e.target.value)} />
            </FormField>
            <FormField label={t("telegram")} htmlFor="telegram">
              <Input id="telegram" dir="ltr" value={form.telegram} onChange={(e) => update("telegram", e.target.value)} />
            </FormField>
            <FormField label={t("preferredLanguage")} htmlFor="preferred_language">
              <Select id="preferred_language" value={form.preferred_language} onChange={(e) => update("preferred_language", e.target.value)}>
                <option value="">—</option>
                <option value="he">עברית</option>
                <option value="en">English</option>
                <option value="fr">Français</option>
                <option value="uk">Українська</option>
              </Select>
            </FormField>
          </div>
        </div>
      )}

      {step === 3 && (
        <div>
          <h2 className="font-display text-lg font-bold text-brand-navy">{t("step3.title")}</h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            {isProperty && (
              <>
                <FormField label={t("property.location")} htmlFor="location">
                  <Input id="location" value={form.location} onChange={(e) => update("location", e.target.value)} />
                </FormField>
                <FormField label={t("property.roomCount")} htmlFor="room_count">
                  <Input id="room_count" type="number" dir="ltr" min={0} value={form.room_count} onChange={(e) => update("room_count", e.target.value)} />
                </FormField>
                <FormField label={t("property.bedCount")} htmlFor="bed_count">
                  <Input id="bed_count" type="number" dir="ltr" min={0} value={form.bed_count} onChange={(e) => update("bed_count", e.target.value)} />
                </FormField>
                <FormField label={t("property.maxGuests")} htmlFor="max_guests">
                  <Input id="max_guests" type="number" dir="ltr" min={0} value={form.max_guests} onChange={(e) => update("max_guests", e.target.value)} />
                </FormField>
                <FormField label={t("property.priceEstimate")} htmlFor="price_estimate">
                  <Input id="price_estimate" value={form.price_estimate} onChange={(e) => update("price_estimate", e.target.value)} placeholder={t("property.priceEstimatePlaceholder")} />
                </FormField>
                <div className="sm:col-span-2">
                  <FormField label={t("property.availabilityNotes")} htmlFor="availability_notes">
                    <Textarea id="availability_notes" value={form.availability_notes} onChange={(e) => update("availability_notes", e.target.value)} placeholder={t("property.availabilityNotesPlaceholder")} />
                  </FormField>
                </div>
              </>
            )}
            {isDriver && (
              <>
                <FormField label={t("driver.vehicleType")} htmlFor="vehicle_type">
                  <Input id="vehicle_type" value={form.vehicle_type} onChange={(e) => update("vehicle_type", e.target.value)} />
                </FormField>
                <FormField label={t("driver.passengerCapacity")} htmlFor="passenger_capacity">
                  <Input id="passenger_capacity" type="number" dir="ltr" min={0} value={form.passenger_capacity} onChange={(e) => update("passenger_capacity", e.target.value)} />
                </FormField>
                <div className="sm:col-span-2">
                  <FormField label={t("driver.routes")} htmlFor="routes">
                    <Textarea id="routes" value={form.routes} onChange={(e) => update("routes", e.target.value)} />
                  </FormField>
                </div>
                <FormField label={t("driver.languagesSpoken")} htmlFor="languages_spoken">
                  <Input id="languages_spoken" value={form.languages_spoken} onChange={(e) => update("languages_spoken", e.target.value)} />
                </FormField>
              </>
            )}
            {isTour && (
              <>
                <div className="sm:col-span-2">
                  <FormField label={t("tour.description")} htmlFor="tour_description">
                    <Textarea id="tour_description" value={form.tour_description} onChange={(e) => update("tour_description", e.target.value)} />
                  </FormField>
                </div>
                <FormField label={t("tour.duration")} htmlFor="duration">
                  <Input id="duration" value={form.duration} onChange={(e) => update("duration", e.target.value)} />
                </FormField>
                <FormField label={t("tour.groupSize")} htmlFor="group_size">
                  <Input id="group_size" type="number" dir="ltr" min={0} value={form.group_size} onChange={(e) => update("group_size", e.target.value)} />
                </FormField>
                <FormField label={t("tour.price")} htmlFor="price_estimate">
                  <Input id="price_estimate" value={form.price_estimate} onChange={(e) => update("price_estimate", e.target.value)} />
                </FormField>
                <FormField label={t("tour.languagesSpoken")} htmlFor="languages_spoken">
                  <Input id="languages_spoken" value={form.languages_spoken} onChange={(e) => update("languages_spoken", e.target.value)} />
                </FormField>
              </>
            )}
            <div className="sm:col-span-2">
              <FormField label={t("notes")} htmlFor="notes">
                <Textarea id="notes" value={form.notes} onChange={(e) => update("notes", e.target.value)} />
              </FormField>
            </div>
          </div>
        </div>
      )}

      {step === 4 && (
        <div>
          <h2 className="font-display text-lg font-bold text-brand-navy">{t("step4.title")}</h2>
          <p className="mt-1 text-sm text-foreground/60">{t("step4.desc")}</p>
          <div className="mt-4">
            <ProviderPhotoUpload photos={form.photos} onChange={(photos) => update("photos", photos)} />
          </div>
        </div>
      )}

      {step === 5 && (
        <div>
          <h2 className="font-display text-lg font-bold text-brand-navy">{t("step5.title")}</h2>
          <Card className="mt-4 p-5 text-sm text-foreground/80">
            <p><span className="font-semibold text-brand-navy">{t(`types.${form.provider_type}.title`)}</span></p>
            <p className="mt-1">{form.full_name} · <span dir="ltr">{form.phone}</span></p>
            {form.photos.length > 0 && <p className="mt-1 text-foreground/60">{t("step5.photosCount", { count: form.photos.length })}</p>}
          </Card>
          {status === "error" && <p className="mt-3 text-sm text-red-600">{t("genericError")}</p>}
        </div>
      )}

      <div className="flex items-center justify-between gap-3">
        {step > 1 ? (
          <Button type="button" variant="outline" onClick={() => setStep((s) => s - 1)}>
            {t("back")}
          </Button>
        ) : (
          <span />
        )}
        {step < 5 ? (
          <Button
            type="button"
            onClick={() => setStep((s) => s + 1)}
            disabled={step === 2 && (!form.full_name || !form.phone)}
          >
            {t("next")}
          </Button>
        ) : (
          <Button type="button" onClick={handleSubmit} disabled={status === "loading"}>
            {status === "loading" ? t("submitting") : t("submit")}
          </Button>
        )}
      </div>
    </div>
  );
}
