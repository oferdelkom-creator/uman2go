"use client";

import { useMemo, useState, type FormEvent } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/Button";
import { FormField, Input } from "@/components/ui/FormField";
import { formatCurrency, nightsBetween } from "@/lib/format";
import type { Room } from "@/lib/types";

type Extra = { name: string; price: number };

export function BookingForm({
  room,
  hotelId,
  extraServices,
}: {
  room: Room;
  hotelId: string;
  extraServices: Extra[];
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [checkIn, setCheckIn] = useState("");
  const [checkOut, setCheckOut] = useState("");
  const [guests, setGuests] = useState(1);
  const [selectedExtras, setSelectedExtras] = useState<Extra[]>([]);
  const [status, setStatus] = useState<"idle" | "loading" | "done" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState("");

  const nights = useMemo(() => (checkIn && checkOut ? nightsBetween(checkIn, checkOut) : 0), [checkIn, checkOut]);
  const roomTotal = room.pricing_type === "per_night_per_guest" ? room.price_per_night * nights * guests : room.price_per_night * nights;
  const extrasTotal = selectedExtras.reduce((sum, e) => sum + e.price, 0);
  const total = roomTotal + extrasTotal;

  function toggleExtra(extra: Extra) {
    setSelectedExtras((prev) =>
      prev.some((e) => e.name === extra.name) ? prev.filter((e) => e.name !== extra.name) : [...prev, extra]
    );
  }

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setStatus("loading");
    setErrorMessage("");

    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      router.push(`/login?next=${encodeURIComponent(pathname)}`);
      return;
    }

    const { data, error } = await supabase
      .from("bookings")
      .insert({
        hotel_id: hotelId,
        room_id: room.id,
        guest_id: user.id,
        check_in: checkIn,
        check_out: checkOut,
        guests_count: guests,
        price_per_night: room.price_per_night,
        currency: room.currency,
        room_pricing_type: room.pricing_type,
        selected_extras: selectedExtras,
        extras_total: extrasTotal,
      })
      .select("id")
      .single();

    if (error) {
      setStatus("error");
      setErrorMessage(error.message.includes("not available") ? "החדר אינו זמין בתאריכים אלו" : "אירעה שגיאה, נסו שוב");
      return;
    }

    setStatus("done");
    fetch("/api/notify/new-booking", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: data.id }),
    }).catch(() => {});
  }

  if (status === "done") {
    return (
      <div className="rounded-2xl bg-brand-teal/10 p-5 text-center text-brand-teal">
        <p className="font-display text-base font-bold">הבקשה נשלחה!</p>
        <p className="mt-1 text-sm">בעל המלון יאשר את ההזמנה בקרוב. תוכלו לעקוב אחרי הסטטוס באזור האישי.</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="grid gap-3 rounded-2xl bg-brand-cream-deep p-4">
      <div className="grid grid-cols-2 gap-3">
        <FormField label="הגעה" htmlFor={`checkin-${room.id}`} required>
          <Input id={`checkin-${room.id}`} type="date" dir="ltr" required value={checkIn} onChange={(e) => setCheckIn(e.target.value)} />
        </FormField>
        <FormField label="עזיבה" htmlFor={`checkout-${room.id}`} required>
          <Input id={`checkout-${room.id}`} type="date" dir="ltr" required min={checkIn} value={checkOut} onChange={(e) => setCheckOut(e.target.value)} />
        </FormField>
      </div>
      <FormField label="מספר אורחים" htmlFor={`guests-${room.id}`} required>
        <Input
          id={`guests-${room.id}`}
          type="number"
          dir="ltr"
          min={1}
          max={room.capacity}
          value={guests}
          onChange={(e) => setGuests(Number(e.target.value))}
          required
        />
      </FormField>

      {extraServices.length > 0 && (
        <div className="flex flex-col gap-1.5">
          <p className="text-sm font-semibold text-brand-navy">שירותים נוספים</p>
          {extraServices.map((extra) => (
            <label key={extra.name} className="flex items-center justify-between gap-2 text-sm text-brand-navy/80">
              <span className="flex items-center gap-2">
                <input type="checkbox" onChange={() => toggleExtra(extra)} className="h-4 w-4 rounded border-brand-navy/30 text-brand-terracotta" />
                {extra.name}
              </span>
              <span dir="ltr">{formatCurrency(extra.price, room.currency)}</span>
            </label>
          ))}
        </div>
      )}

      {nights > 0 && (
        <div className="flex items-center justify-between border-t border-brand-navy/10 pt-3 text-sm">
          <span className="text-brand-navy/70">{nights} לילות</span>
          <span dir="ltr" className="font-display font-bold text-brand-terracotta">
            {formatCurrency(total, room.currency)}
          </span>
        </div>
      )}

      {status === "error" && <p className="text-sm text-red-600">{errorMessage}</p>}

      <Button type="submit" disabled={status === "loading" || nights <= 0} className="w-full">
        {status === "loading" ? "שולח..." : "בקשת הזמנה"}
      </Button>
      <p className="text-center text-xs text-brand-navy/50">
        יש להתחבר כדי להשלים הזמנה. <Link href="/signup" className="underline">עדיין אין לכם חשבון?</Link>
      </p>
    </form>
  );
}
