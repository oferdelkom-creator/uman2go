"use client";

import { useState, type FormEvent } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/Button";
import { FormField, Input, Select, Textarea } from "@/components/ui/FormField";
import type { Room } from "@/lib/types";

export function RoomForm({ hotelId, room }: { hotelId: string; room?: Room }) {
  const t = useTranslations("owner.roomForm");
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const formData = new FormData(e.currentTarget);
    const payload = {
      name: String(formData.get("name")),
      description: String(formData.get("description") ?? ""),
      capacity: Number(formData.get("capacity")),
      price_per_night: Number(formData.get("price_per_night")),
      currency: String(formData.get("currency")),
      pricing_type: String(formData.get("pricing_type")),
      quantity: Number(formData.get("quantity")),
      status: String(formData.get("status")),
      photos: String(formData.get("photos") ?? "")
        .split(/[\n,]/)
        .map((s) => s.trim())
        .filter(Boolean),
    };

    const supabase = createClient();
    const { data: saved, error } = room
      ? await supabase.from("rooms").update(payload).eq("id", room.id).select("id").single()
      : await supabase.from("rooms").insert({ ...payload, hotel_id: hotelId }).select("id").single();

    if (error) {
      setError(t("genericError"));
      setLoading(false);
      return;
    }

    fetch("/api/translate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ table: "rooms", id: saved.id }),
    }).catch(() => {});

    router.push("/owner/rooms");
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="grid gap-4 sm:grid-cols-2">
      <FormField label={t("name")} htmlFor="name" required>
        <Input id="name" name="name" defaultValue={room?.name} required />
      </FormField>
      <FormField label={t("capacity")} htmlFor="capacity" required>
        <Input id="capacity" name="capacity" type="number" dir="ltr" min={1} defaultValue={room?.capacity ?? 2} required />
      </FormField>
      <FormField label={t("pricePerNight")} htmlFor="price_per_night" required>
        <Input id="price_per_night" name="price_per_night" type="number" dir="ltr" min={0} step="0.01" defaultValue={room?.price_per_night} required />
      </FormField>
      <FormField label={t("currency")} htmlFor="currency" required>
        <Select id="currency" name="currency" defaultValue={room?.currency ?? "USD"}>
          <option value="USD">USD</option>
          <option value="ILS">ILS</option>
          <option value="EUR">EUR</option>
        </Select>
      </FormField>
      <FormField label={t("pricingType")} htmlFor="pricing_type" required>
        <Select id="pricing_type" name="pricing_type" defaultValue={room?.pricing_type ?? "per_night"}>
          <option value="per_night">{t("pricingTypePerNight")}</option>
          <option value="per_night_per_guest">{t("pricingTypePerNightPerGuest")}</option>
        </Select>
      </FormField>
      <FormField label={t("quantity")} htmlFor="quantity" required>
        <Input id="quantity" name="quantity" type="number" dir="ltr" min={1} defaultValue={room?.quantity ?? 1} required />
      </FormField>
      <FormField label={t("status")} htmlFor="status" required>
        <Select id="status" name="status" defaultValue={room?.status ?? "active"}>
          <option value="active">{t("statusActive")}</option>
          <option value="hidden">{t("statusHidden")}</option>
        </Select>
      </FormField>
      <div className="sm:col-span-2">
        <FormField label={t("description")} htmlFor="description">
          <Textarea id="description" name="description" defaultValue={room?.description} />
        </FormField>
      </div>
      <div className="sm:col-span-2">
        <FormField label={t("photos")} htmlFor="photos">
          <Textarea id="photos" name="photos" dir="ltr" defaultValue={room?.photos.join("\n")} />
        </FormField>
      </div>
      {error && <p className="sm:col-span-2 text-sm text-red-600">{error}</p>}
      <div className="sm:col-span-2">
        <Button type="submit" disabled={loading}>
          {loading ? t("saving") : room ? t("saveChanges") : t("addRoom")}
        </Button>
      </div>
    </form>
  );
}
