import { NextResponse } from "next/server";
import { logConversation } from "@/lib/conversations";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    await logConversation({
      visitorId: body.visitorId ?? "anonymous",
      question: body.question ?? "",
      answerSummary: body.answerSummary ?? "",
      category: body.category ?? "general",
      createdAt: new Date().toISOString(),
    });
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[log-conversation] failed:", err);
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}
