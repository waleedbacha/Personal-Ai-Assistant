import { NextResponse } from "next/server";
import { createHmac, timingSafeEqual } from "crypto";
import { payloadToDocuments } from "@/lib/github";
import { ingestDocuments } from "@/lib/rag";

export const runtime = "nodejs";
export const maxDuration = 30;

// ------------------------------------------------------------
// HMAC-SHA256 signature verification
// ------------------------------------------------------------
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

// ------------------------------------------------------------
// POST handler
// ------------------------------------------------------------
export async function POST(req: Request) {
  const secret = process.env.GITHUB_WEBHOOK_SECRET;

  if (!secret) {
    console.error("[github-webhook] GITHUB_WEBHOOK_SECRET is not set");
    return NextResponse.json(
      { ok: false, error: "Webhook not configured." },
      { status: 500 },
    );
  }

  // 1. Read the raw body (needed for signature verification)
  const rawBody = await req.text();

  // 2. Verify the signature
  const signature = req.headers.get("x-hub-signature-256");
  if (!verifySignature(rawBody, signature, secret)) {
    console.warn("[github-webhook] Invalid signature — rejecting");
    return NextResponse.json(
      { ok: false, error: "Invalid signature." },
      { status: 401 },
    );
  }

  // 3. Check the event type
  const event = req.headers.get("x-github-event");

  // GitHub sends a "ping" event when the webhook is first created
  if (event === "ping") {
    console.log(
      "[github-webhook] Ping received — webhook is configured correctly",
    );
    return NextResponse.json({ ok: true, pong: true });
  }

  if (event !== "push") {
    // Ignore everything else (we only configured push, but be safe)
    return NextResponse.json({ ok: true, ignored: event });
  }

  // 4. Parse the payload
  let payload: any;
  try {
    payload = JSON.parse(rawBody);
  } catch {
    return NextResponse.json(
      { ok: false, error: "Invalid JSON." },
      { status: 400 },
    );
  }

  // 5. Convert commits to documents
  const documents = payloadToDocuments(payload);

  if (documents.length === 0) {
    console.log("[github-webhook] No ingestable commits in this push");
    return NextResponse.json({ ok: true, ingested: 0 });
  }

  // 6. Ingest into the knowledge base
  try {
    const count = await ingestDocuments(documents);
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
