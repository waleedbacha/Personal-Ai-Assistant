import { NextResponse } from "next/server";
import { sendContactEmail, type ContactPayload } from "@/lib/email";

export const runtime = "nodejs";
export const maxDuration = 15;

// ------------------------------------------------------------
// Very light in-memory throttle to stop form spam.
// Resets on cold start — good enough for a portfolio.
// ------------------------------------------------------------

const WINDOW_MS = 5 * 60 * 1000; // 5 minutes
const MAX_PER_WINDOW = 3;

type Entry = { count: number; resetAt: number };
const buckets = new Map<string, Entry>();

function getIp(req: Request): string {
  const fwd = req.headers.get("x-forwarded-for");
  if (fwd) return fwd.split(",")[0]!.trim();
  const real = req.headers.get("x-real-ip");
  if (real) return real;
  return "unknown";
}

function checkRate(ip: string): boolean {
  const now = Date.now();
  const entry = buckets.get(ip);

  if (!entry || entry.resetAt < now) {
    buckets.set(ip, { count: 1, resetAt: now + WINDOW_MS });
    return true;
  }

  if (entry.count >= MAX_PER_WINDOW) return false;

  entry.count += 1;
  return true;
}

// ------------------------------------------------------------
// POST handler
// ------------------------------------------------------------

export async function POST(req: Request) {
  const ip = getIp(req);

  if (!checkRate(ip)) {
    return NextResponse.json(
      { ok: false, error: "Too many submissions. Please try again later." },
      { status: 429 },
    );
  }

  let body: Partial<ContactPayload>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { ok: false, error: "Invalid request." },
      { status: 400 },
    );
  }

  const payload: ContactPayload = {
    name: typeof body.name === "string" ? body.name : "",
    email: typeof body.email === "string" ? body.email : "",
    message: typeof body.message === "string" ? body.message : "",
    source: typeof body.source === "string" ? body.source : undefined,
  };

  const result = await sendContactEmail(payload);

  if (!result.ok) {
    return NextResponse.json(result, { status: 400 });
  }

  return NextResponse.json({ ok: true });
}
