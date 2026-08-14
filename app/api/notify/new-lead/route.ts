import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { notifyNewLead, LEAD_TABLES, type LeadType } from "@/lib/notifyLead";

export async function POST(request: Request) {
  const { type, id } = (await request.json()) as { type: LeadType; id: string };

  if (!(type in LEAD_TABLES)) return NextResponse.json({ ok: false }, { status: 400 });

  const supabase = createAdminClient();
  const { data: row } = await supabase.from(LEAD_TABLES[type].table).select("*").eq("id", id).maybeSingle();

  if (!row) return NextResponse.json({ ok: false }, { status: 404 });

  await notifyNewLead(type, row);
  return NextResponse.json({ ok: true });
}
