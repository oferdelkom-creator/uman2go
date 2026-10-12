import { NextResponse } from "next/server";
import {
  currentConversation,
  quota,
  salesEnabled,
  validOrigin,
} from "@/lib/sales-assistant";
import { completeSalesConversation } from "@/lib/sales-completion";
export const maxDuration = 60;
export async function POST(request: Request) {
  if (!validOrigin(request))
    return NextResponse.json({ error: "בקשה לא מורשית." }, { status: 403 });
  if (!salesEnabled())
    return NextResponse.json(
      { error: "השירות אינו זמין כרגע." },
      { status: 503 },
    );
  try {
    const session = await currentConversation();
    if (!session)
      return NextResponse.json(
        { error: "לא נמצאה שיחה פעילה." },
        { status: 401 },
      );
    if (
      session.summary_email_status !== "sent" &&
      !(await quota(request, "chat"))
    )
      return NextResponse.json(
        { error: "הגענו למגבלת השימוש. הפנייה נשמרה לצוות." },
        { status: 429 },
      );
    const result = await completeSalesConversation(session.id);
    return NextResponse.json(result.body, { status: result.status });
  } catch {
    return NextResponse.json(
      { error: "השיחה נשמרה, אך הסיום לא הושלם." },
      { status: 503 },
    );
  }
}
