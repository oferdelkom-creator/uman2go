import { NextResponse } from "next/server";
import { generateText } from "ai";
import { anthropic } from "@ai-sdk/anthropic";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  currentConversation,
  quota,
  salesCatalogue,
  salesEnabled,
  salesInstructions,
  salesModelId,
  validOrigin,
} from "@/lib/sales-assistant";

export const maxDuration = 60;
const fail = (error: string, status: number) =>
  NextResponse.json({ error }, { status });
export async function POST(request: Request) {
  let conversationId: string | undefined;
  let stage = "validation";
  try {
    if (!validOrigin(request)) return fail("בקשה לא מורשית.", 403);
    if (!salesEnabled()) return fail("השירות אינו זמין כרגע.", 503);
    const session = await currentConversation();
    if (!session) return fail("יש להשאיר פרטי קשר כדי להתחיל שיחה.", 401);
    if (Number(request.headers.get("content-length") ?? 0) > 12000)
      return fail("ההודעה ארוכה מדי.", 413);
    const raw = await request.text();
    if (raw.length > 12000) return fail("ההודעה ארוכה מדי.", 413);
    const body = JSON.parse(raw);
    const message = typeof body.message === "string" ? body.message.trim() : "";
    if (!message || message.length > 2000)
      return fail("יש לשלוח הודעה באורך עד 2,000 תווים.", 400);
    if (!(await quota(request, "chat")))
      return fail("הגענו למגבלת השימוש. אפשר לפנות בוואטסאפ.", 429);
    const db = createAdminClient();
    const claim = await db.rpc("sales_claim_turn", { p_id: session.id });
    if (claim.error) return fail("השיחה לא זמינה כרגע.", 503);
    if (!claim.data)
      return fail(
        "יש שיחה בעיבוד או שהגענו למגבלת השיחה. אפשר לפנות בוואטסאפ.",
        429,
      );
    conversationId = session.id;
    stage = "save";
    const saved = await db
      .from("sales_messages")
      .insert({ conversation_id: session.id, role: "user", content: message });
    if (saved.error) throw new Error("Message save failed");
    const summary = await db
      .from("sales_conversations")
      .update({ summary: `${session.summary}\n${message}`.slice(-3000) })
      .eq("id", session.id);
    if (summary.error) throw new Error("Summary save failed");
    const history = await db
      .from("sales_messages")
      .select("role,content")
      .eq("conversation_id", session.id)
      .order("id", { ascending: false })
      .limit(12);
    if (history.error) throw new Error("History unavailable");
    stage = "catalogue";
    const catalogue = await salesCatalogue(session.locale);
    stage = "model-discovery";
    const modelId = await salesModelId();
    stage = "generation";
    const result = await generateText({
      model: anthropic(modelId),
      messages: [
        {
          role: "system",
          content: salesInstructions(session.locale, catalogue),
        },
        ...(history.data ?? []).reverse().map((row) => ({
          role: row.role as "user" | "assistant",
          content: row.content,
        })),
      ],
      maxOutputTokens: 700,
      maxRetries: 0,
      abortSignal: AbortSignal.timeout(40000),
    });
    const reply = result.text.trim().slice(0, 6000);
    if (!reply) throw new Error("Empty reply");
    const answer = await db.from("sales_messages").insert({
      conversation_id: session.id,
      role: "assistant",
      content: reply,
    });
    if (answer.error) throw new Error("Reply save failed");
    return NextResponse.json({ reply });
  } catch (error) {
    // Never log provider request objects: they can contain secrets or customer messages.
    const statusCode =
      error &&
      typeof error === "object" &&
      "statusCode" in error &&
      typeof error.statusCode === "number"
        ? error.statusCode
        : undefined;
    console.error("Sales assistant request failed", { stage, statusCode });
    return fail(
      "לא התקבלה תשובה כרגע. פרטי הקשר והודעות שנשמרו זמינים לצוות. אפשר לפנות בוואטסאפ או לנסות שוב.",
      503,
    );
  } finally {
    if (conversationId)
      await createAdminClient()
        .from("sales_conversations")
        .update({ busy_until: null })
        .eq("id", conversationId);
  }
}
