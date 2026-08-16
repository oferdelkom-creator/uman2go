"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "@/i18n/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/Button";
import { FormField, Input, Select, Textarea } from "@/components/ui/FormField";
import type { Room } from "@/lib/types";

export function RoomForm({ hotelId, room }: { hotelId: string; room?: Room }) {
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
    const { error } = room
      ? await supabase.from("rooms").update(payload).eq("id", room.id)
      : await supabase.from("rooms").insert({ ...payload, hotel_id: hotelId });

    if (error) {
      setError("אירעה שגיאה, נסו שוב");
      setLoading(false);
      return;
    }

    router.push("/owner/rooms");
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="grid gap-4 sm:grid-cols-2">
      <FormField label="שם החדר" htmlFor="name" required>
        <Input id="name" name="name" defaultValue={room?.name} required />
      </FormField>
      <FormField label="קיבולת אורחים" htmlFor="capacity" required>
        <Input id="capacity" name="capacity" type="number" dir="ltr" min={1} defaultValue={room?.capacity ?? 2} required />
      </FormField>
      <FormField label="מחיר ללילה" htmlFor="price_per_night" required>
        <Input id="price_per_night" name="price_per_night" type="number" dir="ltr" min={0} step="0.01" defaultValue={room?.price_per_night} required />
      </FormField>
      <FormField label="מטבע" htmlFor="currency" required>
        <Select id="currency" name="currency" defaultValue={room?.currency ?? "USD"}>
          <option value="USD">USD</option>
          <option value="ILS">ILS</option>
          <option value="EUR">EUR</option>
        </Select>
      </FormField>
      <FormField label="סוג תמחור" htmlFor="pricing_type" required>
        <Select id="pricing_type" name="pricing_type" defaultValue={room?.pricing_type ?? "per_night"}>
          <option value="per_night">מחיר קבוע ללילה</option>
          <option value="per_night_per_guest">מחיר ללילה לכל אורח</option>
        </Select>
      </FormField>
      <FormField label="מספר חדרים מסוג זה" htmlFor="quantity" required>
        <Input id="quantity" name="quantity" type="number" dir="ltr" min={1} defaultValue={room?.quantity ?? 1} required />
      </FormField>
      <FormField label="סטטוס" htmlFor="status" required>
        <Select id="status" name="status" defaultValue={room?.status ?? "active"}>
          <option value="active">פעיל</option>
          <option value="hidden">מוסתר</option>
        </Select>
      </FormField>
      <div className="sm:col-span-2">
        <FormField label="תיאור" htmlFor="description">
          <Textarea id="description" name="description" defaultValue={room?.description} />
        </FormField>
      </div>
      <div className="sm:col-span-2">
        <FormField label="קישורי תמונות (אחד בכל שורה)" htmlFor="photos">
          <Textarea id="photos" name="photos" dir="ltr" defaultValue={room?.photos.join("\n")} />
        </FormField>
      </div>
      {error && <p className="sm:col-span-2 text-sm text-red-600">{error}</p>}
      <div className="sm:col-span-2">
        <Button type="submit" disabled={loading}>
          {loading ? "שומר..." : room ? "שמירת שינויים" : "הוספת חדר"}
        </Button>
      </div>
    </form>
  );
}
