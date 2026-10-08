import { NextResponse } from "next/server";
import { createHmac, timingSafeEqual } from "crypto";
import { payloadToDocuments } from "@/lib/github";
import { appendDocuments } from "@/lib/rag";

export const runtime = "nodejs";
export const maxDuration = 30;

function verifySignature(
  rawBody: string,
  signatureHeader: string | null,
  secret: string,
): boolean {
  if (!signatureHeader) return false;

  const expected =
    "sha256=" + createHmac("sha256", secret).update(rawBody).digest("hex");

  try {
    return timingSafeEqual(Buffer.from(signatureHeader), Buffer.from(expected));
  } catch {
    return false;
  }
}

export async function POST(req: Request) {
  const secret = process.env.GITHUB_WEBHOOK_SECRET;

  if (!secret) {
    console.error("[github-webhook] GITHUB_WEBHOOK_SECRET is not set");
    return NextResponse.json(
      { ok: false, error: "Webhook not configured." },
      { status: 500 },
    );
  }

  const rawBody = await req.text();
  const signature = req.headers.get("x-hub-signature-256");

  if (!verifySignature(rawBody, signature, secret)) {
    console.warn("[github-webhook] Invalid signature — rejecting");
    return NextResponse.json(
      { ok: false, error: "Invalid signature." },
      { status: 401 },
    );
  }

  const event = req.headers.get("x-github-event");

  if (event === "ping") {
    console.log(
      "[github-webhook] Ping received — webhook is configured correctly",
    );
    return NextResponse.json({ ok: true, pong: true });
  }

  if (event !== "push") {
    return NextResponse.json({ ok: true, ignored: event });
  }

  let payload: any;
  try {
    payload = JSON.parse(rawBody);
  } catch {
    return NextResponse.json(
      { ok: false, error: "Invalid JSON." },
      { status: 400 },
    );
  }

  const documents = payloadToDocuments(payload);

  if (documents.length === 0) {
    console.log("[github-webhook] No ingestable commits in this push");
    return NextResponse.json({ ok: true, ingested: 0 });
  }

  try {
    const count = await appendDocuments(documents);
    console.log(
      `[github-webhook] Ingested ${count} chunks from ${documents.length} docs`,
    );
    return NextResponse.json({ ok: true, ingested: count });
  } catch (err) {
    console.error("[github-webhook] Ingestion failed:", err);
    return NextResponse.json(
      { ok: false, error: "Ingestion failed." },
      { status: 500 },
    );
  }
}
