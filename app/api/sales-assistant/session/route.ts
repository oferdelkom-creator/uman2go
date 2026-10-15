import { randomBytes } from "node:crypto";
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  currentConversation,
  hashToken,
  quota,
  SALES_COOKIE,
  salesEnabled,
  validOrigin,
} from "@/lib/sales-assistant";

export const dynamic = "force-dynamic";
const fail = (error: string, status: number) =>
  NextResponse.json({ error }, { status });
export async function GET() {
  try {
    if (!salesEnabled()) return NextResponse.json({ enabled: false });
    const session = await currentConversation();
    if (!session)
      return NextResponse.json(
        { enabled: true, session: null },
        { headers: { "Cache-Control": "no-store" } },
      );
    const { data: messages, error } = await createAdminClient()
      .from("sales_messages")
      .select("role,content")
      .eq("conversation_id", session.id)
      .order("id")
      .limit(80);
    if (error) return fail("השיחה לא נטענה. אפשר לנסות שוב.", 503);
    return NextResponse.json(
      {
        enabled: true,
        session: {
          fullName: session.full_name,
          messages,
          completed: Boolean(session.completed_at),
          emailAccepted: session.summary_email_status === "sent",
        },
      },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch {
    return fail("השירות אינו זמין כרגע.", 503);
  }
}
export async function POST(request: Request) {
  try {
    if (!validOrigin(request)) return fail("בקשה לא מורשית.", 403);
    if (!salesEnabled()) return fail("השירות אינו זמין כרגע.", 503);
    if (Number(request.headers.get("content-length") ?? 0) > 4096)
      return fail("בקשה גדולה מדי.", 413);
    const raw = await request.text();
    if (raw.length > 4096) return fail("בקשה גדולה מדי.", 413);
    const body = JSON.parse(raw);
    const fullName =
      typeof body.fullName === "string" ? body.fullName.trim() : "";
    const contact = typeof body.contact === "string" ? body.contact.trim() : "";
    const validContact =
      /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contact) ||
      (/^\+?[\d\s()-]{7,24}$/.test(contact) &&
        contact.replace(/\D/g, "").length >= 7);
    if (
      fullName.length < 2 ||
      fullName.length > 100 ||
      contact.length > 160 ||
      !validContact ||
      body.consent !== true
    )
      return fail("יש להזין שם, טלפון או מייל ולאשר שמירה.", 400);
    const existing = await currentConversation();
    if (existing)
      return fail("כבר קיימת שיחה. אפשר להמשיך בה או לפתוח חדשה.", 409);
    if (!(await quota(request, "start")))
      return fail("הגענו למגבלת השימוש. אפשר לפנות בוואטסאפ.", 429);
    const db = createAdminClient();
    // Honour the original 30-day policy for legacy consent; retain opted-in enquiries for follow-up.
    const cleanup = await db
      .from("sales_conversations")
      .delete()
      .lt("expires_at", new Date().toISOString())
      .eq("retained_for_followup", false);
    if (cleanup.error) return fail("השירות אינו זמין כרגע.", 503);
    await db
      .from("sales_usage")
      .delete()
      .lt(
        "day",
        new Date(Date.now() - 2 * 86400000).toISOString().slice(0, 10),
      );
    const token = randomBytes(32).toString("hex");
    const { error } = await db.from("sales_conversations").insert({
      token_hash: hashToken(token),
      retained_for_followup: body.retentionConsentVersion === "followup-v1",
      full_name: fullName,
      contact,
      locale: ["he", "en", "fr", "uk"].includes(body.locale)
        ? body.locale
        : "he",
    });
    if (error) return fail("הפרטים לא נשמרו. אפשר לנסות שוב.", 503);
    (await cookies()).set(SALES_COOKIE, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      path: "/api/sales-assistant",
      maxAge: 30 * 86400,
    });
    return NextResponse.json({ saved: true });
  } catch {
    return fail("לא ניתן להתחיל שיחה כרגע.", 400);
  }
}
export async function DELETE(request: Request) {
  if (!validOrigin(request)) return fail("בקשה לא מורשית.", 403);
  (await cookies()).delete({
    name: SALES_COOKIE,
    path: "/api/sales-assistant",
  });
  return NextResponse.json({ reset: true });
}

