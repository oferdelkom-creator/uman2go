import { transferQuote, transferQuoteText, TRANSFER_VEHICLES, TRANSFER_STOPS } from "@/lib/transfer-pricing";
import { prepareSalesTransferDraft, submitSalesTransferDraft } from "@/lib/transfer-reservations";
import { NextResponse } from "next/server";
import { generateText, tool, jsonSchema } from "ai";
import { prepareTaxiDraft } from "@/lib/sales-taxi";
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
  const turnStartedAt = new Date().toISOString();
  let conversationId: string | undefined;
  let stage = "validation";
  try {
    if (!validOrigin(request)) return fail("בקשה לא מורשית.", 403);
    if (!salesEnabled()) return fail("השירות אינו זמין כרגע.", 503);
    const session = await currentConversation();
    if (!session) return fail("יש להשאיר פרטי קשר כדי להתחיל שיחה.", 401);
    if (session.completed_at)
      return fail("השיחה הסתיימה. אפשר לפתוח שיחה חדשה.", 409);
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
    console.info("Sales assistant model", { modelId });
    let transferReply: string | undefined;
    let preparedThisTurn = false;
    let taxiDraft: Awaited<ReturnType<typeof prepareTaxiDraft>> | undefined;
    const result = await generateText({
      model: anthropic(modelId),
      instructions: salesInstructions(session.locale, catalogue),
      tools: {

        quoteScheduledTransfer: tool({
          description: "Calculate an exact customer-final USD quote only for one-way Chisinau to Uman. Use the selected vehicle and stop package; never use for return, round trip, custom routes or immediate taxis. It does not submit a booking.",
          inputSchema: jsonSchema<{vehicle_code:string;stops_code:string;passengers:number}>({type:"object",additionalProperties:false,properties:{vehicle_code:{type:"string",enum:TRANSFER_VEHICLES.map(v=>v.code)},stops_code:{type:"string",enum:TRANSFER_STOPS.map(v=>v.code)},passengers:{type:"integer",minimum:1,maximum:57}},required:["vehicle_code","stops_code","passengers"]}),
          execute: async (input) => {
            try { const quote=transferQuote(input.vehicle_code,input.stops_code,input.passengers);transferReply=transferQuoteText(quote,session.locale)+'\n'+(session.locale==='he'?'כדי להכין בקשת הזמנה, מה תאריך הנסיעה הרצוי?':'To prepare a booking request, what is your journey date?');return quote; }
            catch { transferReply=session.locale==='he'?'הרכב, העצירות או מספר הנוסעים אינם תואמים למחירון. נבחר רכב מתאים?':'The vehicle, stops or passenger count do not match the price list. Please choose a suitable vehicle.';return {error:'Invalid quote'}; }
          },
        }),
        prepareScheduledTransferBooking: tool({
          description: "Save a draft summary only after collecting a one-way Chisinau to Uman vehicle, stop package, passenger count, exact date, Chisinau-local pickup time and pickup location. Customer name/contact are already saved. Show the exact summary and ask for a separate explicit confirmation. A draft does not submit or confirm a booking.",
          inputSchema: jsonSchema<{vehicle_code:string;stops_code:string;passengers:number;departure_date:string;departure_time:string;pickup:string;notes:string}>({type:"object",additionalProperties:false,properties:{vehicle_code:{type:"string",enum:TRANSFER_VEHICLES.map(v=>v.code)},stops_code:{type:"string",enum:TRANSFER_STOPS.map(v=>v.code)},passengers:{type:"integer",minimum:1,maximum:57},departure_date:{type:"string",pattern:"^\\d{4}-\\d{2}-\\d{2}$"},departure_time:{type:"string",pattern:"^([01]\\d|2[0-3]):[0-5]\\d$"},pickup:{type:"string",minLength:3,maxLength:400},notes:{type:"string",maxLength:1500}},required:["vehicle_code","stops_code","passengers","departure_date","departure_time","pickup","notes"]}),
          execute: async (input) => {
            preparedThisTurn=true;
            try {const draft=await prepareSalesTransferDraft(session,input);transferReply=draft.reply;return {prepared:true,requiresSeparateConfirmation:true};}
            catch {transferReply=session.locale==='he'?'הסיכום לא נשמר. בדקו תאריך, שעת איסוף, נקודת איסוף ומספר נוסעים. לא נשלחה בקשת הזמנה.':'The summary could not be saved. Check the date, pickup time, location and passenger count. No booking request was submitted.';return {error:'Invalid or unavailable draft'};}
          },
        }),
        submitScheduledTransferBooking: tool({
          description: "Submit the latest previously displayed draft as a pending-supplier booking request only when this customer message explicitly confirms that exact summary. Do not call on a question, negotiation, changed details or a generic request to book before showing the summary. Never call in the same turn as preparing the draft. No supplier approval, charge or final booking is performed.",
          inputSchema: jsonSchema<Record<string,never>>({type:"object",additionalProperties:false,properties:{}}),
          execute: async () => {
            try {if(preparedThisTurn)throw Error();const result=await submitSalesTransferDraft(session.id,message,session.locale,turnStartedAt);transferReply=result.reply;return {saved:true,status:'pending_supplier'};}
            catch {transferReply=session.locale==='he'?'כדי לשמור בקשת הזמנה, צריך תחילה סיכום מלא ולאחריו הודעת אישור מפורשת כגון ״מאשר הזמנה״. לא נשמרה בקשה חדשה.':'A complete booking summary and a separate explicit confirmation such as “confirm booking” are required. No new request was submitted.';return {error:'Confirmation required'};}
          },
        }),
        prepareImmediateTaxi: tool({
          description:
            "Prepare a taxi draft only when the customer explicitly wants an immediate ride from their current GPS location in Ukraine and has provided a full destination and passenger count. No ride is submitted. The customer must open Telegram, share GPS, review and send the request, then choose a driver and price. Never use for future rides, provider signup, or an unspecified pickup.",
          inputSchema: jsonSchema<{
            destination: string;
            passengers: number;
            immediate: true;
          }>({
            type: "object",
            additionalProperties: false,
            properties: {
              destination: { type: "string", minLength: 5, maxLength: 400 },
              passengers: { type: "integer", minimum: 1, maximum: 50 },
              immediate: { type: "boolean", const: true },
            },
            required: ["destination", "passengers", "immediate"],
          }),
          execute: async ({ destination, passengers, immediate }) => {
            if (immediate !== true) throw new Error("Immediate rides only");
            if (!taxiDraft)
              taxiDraft = await prepareTaxiDraft(
                session.id,
                destination,
                passengers,
              );
            return { prepared: true, requiresTelegramConfirmation: true };
          },
        }),
      },
      messages: (history.data ?? []).reverse().map((row) => ({
        role: row.role as "user" | "assistant",
        content: row.content,
      })),
      maxOutputTokens: 700,
      providerOptions: { anthropic: { thinking: { type: "disabled" } } },
      maxRetries: 0,
      abortSignal: AbortSignal.timeout(40000),
    });
    const reply = transferReply ?? (taxiDraft
      ? session.locale === "he"
        ? `הכנתי בקשת מונית מיידית ליעד: ${taxiDraft.destination}, עבור ${taxiDraft.passengers} נוסעים.\nהבקשה עדיין לא נשלחה לנהגים. בטלגרם לחצו Start ואז פתיחת הבקשה, שתפו GPS, בדקו את הפרטים ואשרו שליחה. הנהגים יציעו מחיר ותבחרו הצעה. הקישור תקף ל־15 דקות; אין חיוב באתר.\n${taxiDraft.url}`
        : `Prepared an immediate taxi draft to ${taxiDraft.destination} for ${taxiDraft.passengers} passengers. It has not been sent to drivers. In Telegram press Start, open the draft, share GPS, review and submit. Drivers will quote and you choose an offer. The link expires in 15 minutes; no website charge.\n${taxiDraft.url}`
      : result.text.trim().slice(0, 6000));
    if (!reply) {
      console.error("Sales assistant empty reply", {
        finishReason: result.finishReason,
      });
      throw new Error("Empty reply");
    }
    const answer = await db.from("sales_messages").insert({
      conversation_id: session.id,
      role: "assistant",
      content: reply,
    });
    if (answer.error) throw new Error("Reply save failed");
    const activity = await db
      .from("sales_conversations")
      .update({ updated_at: new Date().toISOString() })
      .eq("id", session.id);
    if (activity.error) throw new Error("Activity save failed");
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
    console.error("Sales assistant request failed", {
      stage,
      statusCode,
      errorType: error instanceof Error ? error.name : "unknown",
    });
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
