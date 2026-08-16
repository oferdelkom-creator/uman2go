"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "@/i18n/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/Button";
import { FormField, Input, Textarea } from "@/components/ui/FormField";
import { slugify } from "@/lib/slug";
import type { Hotel } from "@/lib/types";

export function HotelForm({ hotel }: { hotel?: Hotel }) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const formData = new FormData(e.currentTarget);
    const name = String(formData.get("name"));
    const payload = {
      name,
      slug: hotel?.slug ?? slugify(String(formData.get("slug") || name)),
      description: String(formData.get("description") ?? ""),
      area: String(formData.get("area") ?? ""),
      address: String(formData.get("address") ?? ""),
      distance_to_kever_meters: formData.get("distance_to_kever_meters")
        ? Number(formData.get("distance_to_kever_meters"))
        : null,
      amenities: String(formData.get("amenities") ?? "")
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean),
      photos: String(formData.get("photos") ?? "")
        .split(/[\n,]/)
        .map((s) => s.trim())
        .filter(Boolean),
      contact_name: String(formData.get("contact_name") ?? "") || null,
      whatsapp_phone: String(formData.get("whatsapp_phone") ?? "") || null,
      phone_alt: String(formData.get("phone_alt") ?? "") || null,
    };

    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      setError("יש להתחבר");
      setLoading(false);
      return;
    }

    const { error } = hotel
      ? await supabase.from("hotels").update(payload).eq("id", hotel.id)
      : await supabase.from("hotels").insert({ ...payload, owner_id: user.id });

    if (error) {
      setError(error.message.includes("duplicate") ? "כתובת ה-URL הזו כבר תפוסה" : "אירעה שגיאה, נסו שוב");
      setLoading(false);
      return;
    }

    router.push("/owner");
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="grid gap-4 sm:grid-cols-2">
      <FormField label="שם המלון" htmlFor="name" required>
        <Input id="name" name="name" defaultValue={hotel?.name} required />
      </FormField>
      {!hotel && (
        <FormField label="כתובת URL (slug)" htmlFor="slug">
          <Input id="slug" name="slug" dir="ltr" placeholder="my-hotel" />
        </FormField>
      )}
      <FormField label="אזור" htmlFor="area">
        <Input id="area" name="area" defaultValue={hotel?.area} />
      </FormField>
      <FormField label="כתובת" htmlFor="address">
        <Input id="address" name="address" defaultValue={hotel?.address} />
      </FormField>
      <FormField label="מרחק מהציון (מטרים)" htmlFor="distance_to_kever_meters">
        <Input id="distance_to_kever_meters" name="distance_to_kever_meters" type="number" dir="ltr" defaultValue={hotel?.distance_to_kever_meters ?? ""} />
      </FormField>
      <FormField label="איש קשר" htmlFor="contact_name">
        <Input id="contact_name" name="contact_name" defaultValue={hotel?.contact_name ?? ""} />
      </FormField>
      <FormField label="וואטסאפ" htmlFor="whatsapp_phone">
        <Input id="whatsapp_phone" name="whatsapp_phone" dir="ltr" defaultValue={hotel?.whatsapp_phone ?? ""} />
      </FormField>
      <FormField label="טלפון נוסף" htmlFor="phone_alt">
        <Input id="phone_alt" name="phone_alt" dir="ltr" defaultValue={hotel?.phone_alt ?? ""} />
      </FormField>
      <div className="sm:col-span-2">
        <FormField label="מתקנים (מופרדים בפסיק)" htmlFor="amenities">
          <Input id="amenities" name="amenities" defaultValue={hotel?.amenities.join(", ")} placeholder="חניה, מטבחון, מיזוג" />
        </FormField>
      </div>
      <div className="sm:col-span-2">
        <FormField label="תיאור" htmlFor="description">
          <Textarea id="description" name="description" defaultValue={hotel?.description} />
        </FormField>
      </div>
      <div className="sm:col-span-2">
        <FormField label="קישורי תמונות (אחד בכל שורה)" htmlFor="photos">
          <Textarea id="photos" name="photos" dir="ltr" defaultValue={hotel?.photos.join("\n")} />
        </FormField>
      </div>

      {error && <p className="sm:col-span-2 text-sm text-red-600">{error}</p>}

      <div className="sm:col-span-2">
        <Button type="submit" disabled={loading}>
          {loading ? "שומר..." : hotel ? "שמירת שינויים" : "יצירת מלון"}
        </Button>
      </div>
    </form>
  );
}
