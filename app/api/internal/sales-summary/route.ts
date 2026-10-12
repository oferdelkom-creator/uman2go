import { createHmac, timingSafeEqual } from "node:crypto";
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
  const match = /^SalesCron (\d{10}):([0-9a-f-]{36}):([0-9a-f]{64})$/.exec(
    supplied,
  );
  if (!match || Math.abs(Date.now() - Number(match[1]) * 1000) > 90000)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const expected = createHmac("sha256", secret)
    .update(`${match[1]}:${match[2]}`)
    .digest();
  if (!timingSafeEqual(Buffer.from(match[3], "hex"), expected))
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const db = createAdminClient();
  const replay = await db.rpc("sales_take_quota", {
    p_bucket: `scheduler:${match[2]}`,
    p_limit: 1,
  });
  if (replay.error)
    return NextResponse.json({ error: "Queue unavailable" }, { status: 503 });
  if (!replay.data)
    return NextResponse.json({ error: "Already processed" }, { status: 409 });
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
