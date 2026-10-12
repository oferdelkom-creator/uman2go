import { createHash, timingSafeEqual } from "node:crypto";
import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { completeSalesConversation } from "@/lib/sales-completion";
import { salesEnabled } from "@/lib/sales-assistant";

export const maxDuration = 60;
export async function POST(request: Request) {
  const secret = process.env.SALES_SUMMARY_CRON_SECRET;
  if (!secret || !salesEnabled())
    return NextResponse.json({ error: "Unavailable" }, { status: 503 });
  const supplied = request.headers.get("authorization") ?? "";
  const hash = (value: string) => createHash("sha256").update(value).digest();
  if (!timingSafeEqual(hash(supplied), hash(`Bearer ${secret}`)))
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const db = createAdminClient();
  const { data, error } = await db.rpc("sales_idle_candidates", { p_limit: 3 });
  if (error)
    return NextResponse.json({ error: "Queue unavailable" }, { status: 503 });
  const results = await Promise.all(
    (data ?? []).map((id) => completeSalesConversation(id, true)),
  );
  const failed = results.filter((result) => result.status >= 500).length;
  return NextResponse.json(
    {
      processed: results.length,
      accepted: results.filter((result) => result.status === 200).length,
      failed,
    },
    { status: failed ? 503 : 200 },
  );
}
