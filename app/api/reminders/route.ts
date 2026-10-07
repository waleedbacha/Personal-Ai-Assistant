import { NextResponse } from "next/server";
import {
  listReminders,
  countDueReminders,
  completeReminder,
  deleteReminder,
} from "@/lib/reminders";

export const runtime = "nodejs";
export const maxDuration = 15;

// ------------------------------------------------------------
// GET /api/reminders?visitorId=xxx  → list + due count
// ------------------------------------------------------------
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const visitorId = searchParams.get("visitorId");

  if (!visitorId) {
    return NextResponse.json(
      { ok: false, error: "visitorId is required." },
      { status: 400 },
    );
  }

  try {
    const [items, dueCount] = await Promise.all([
      listReminders(visitorId),
      countDueReminders(visitorId),
    ]);

    return NextResponse.json({ ok: true, items, dueCount });
  } catch (err) {
    console.error("[reminders GET] failed:", err);
    return NextResponse.json(
      { ok: false, error: "Could not load reminders." },
      { status: 500 },
    );
  }
}

// ------------------------------------------------------------
// POST /api/reminders
// Body: { visitorId, action: "complete" | "delete", id }
// ------------------------------------------------------------
export async function POST(req: Request) {
  let body: {
    visitorId?: string;
    action?: "complete" | "delete";
    id?: string;
  };

  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { ok: false, error: "Invalid request." },
      { status: 400 },
    );
  }

  const { visitorId, action, id } = body;

  if (!visitorId || !action || !id) {
    return NextResponse.json(
      { ok: false, error: "visitorId, action, and id are required." },
      { status: 400 },
    );
  }

  if (action !== "complete" && action !== "delete") {
    return NextResponse.json(
      { ok: false, error: "Invalid action." },
      { status: 400 },
    );
  }

  try {
    const ok =
      action === "complete"
        ? await completeReminder(visitorId, id)
        : await deleteReminder(visitorId, id);

    return NextResponse.json({ ok });
  } catch (err) {
    console.error("[reminders POST] failed:", err);
    return NextResponse.json(
      { ok: false, error: "Could not update the reminder." },
      { status: 500 },
    );
  }
}
