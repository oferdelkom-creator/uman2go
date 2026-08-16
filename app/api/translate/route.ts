import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { translateListingFields } from "@/lib/translate";

const TABLE_FIELDS = {
  hotels: ["description", "area", "address", "amenities"],
  rooms: ["description"],
  drivers: ["description", "vehicle_type"],
  driver_routes: ["destination"],
  tour_guides: ["description"],
  tour_dates: ["title", "description"],
} as const;

type TranslatableTable = keyof typeof TABLE_FIELDS;

export async function POST(request: Request) {
  const { table, id } = (await request.json()) as { table: TranslatableTable; id: string };

  const fields = TABLE_FIELDS[table] as readonly string[] | undefined;
  if (!fields) return NextResponse.json({ ok: false }, { status: 400 });

  const supabase = createAdminClient();
  // `table` spans several tables with different row shapes, so Supabase
  // can't type a single .select()/.update() call against all of them at once.
  const { data: row } = await supabase
    .from(table)
    .select(fields.join(","))
    .eq("id", id)
    .maybeSingle() as { data: Record<string, unknown> | null };
  if (!row) return NextResponse.json({ ok: false }, { status: 404 });

  const toTranslate: Record<string, string | string[]> = {};
  for (const field of fields) {
    const value = row[field];
    if (typeof value === "string" && value.trim() !== "") toTranslate[field] = value;
    else if (Array.isArray(value) && value.length > 0) toTranslate[field] = value as string[];
  }

  const translated = await translateListingFields(toTranslate);
  if (!translated) return NextResponse.json({ ok: false });

  const update: Record<string, unknown> = {};
  for (const field of Object.keys(translated)) {
    update[`${field}_i18n`] = translated[field];
  }

  await supabase.from(table).update(update as never).eq("id", id);
  return NextResponse.json({ ok: true });
}
