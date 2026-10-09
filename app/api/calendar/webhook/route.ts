import { NextResponse } from "next/server";
import {
  fetchEvents,
  eventToDocument,
  loadCalendarToken,
  saveCalendarToken,
  CalendarIngestDoc,
} from "@/lib/calendar";
import { appendDocumentsDeduped } from "@/lib/rag";

export const runtime = "nodejs";
export const maxDuration = 30;

export async function POST(req: Request) {
  // 1. Verify the channel token — Google sends it in this header
  const channelToken = req.headers.get("x-goog-channel-token");
  const expectedToken = process.env.GOOGLE_CALENDAR_CHANNEL_TOKEN;

  if (!expectedToken || channelToken !== expectedToken) {
    console.warn("[calendar/webhook] Invalid channel token");
    return NextResponse.json(
      { ok: false, error: "Invalid token." },
      { status: 401 },
    );
  }

  // 2. Check the resource state — we only care about "exists" (real change)
  const resourceState = req.headers.get("x-goog-resource-state");

  // Google sends a "sync" message first, just to verify the endpoint
  if (resourceState === "sync") {
    console.log("[calendar/webhook] Sync handshake received");
    return NextResponse.json({ ok: true });
  }

  // 3. Fetch changed events
  try {
    const stored = await loadCalendarToken();
    const { events, nextSyncToken } = await fetchEvents(stored?.syncToken);

    // 4. Convert to documents and ingest
    const docs = events
      .map((e) => eventToDocument(e))
      .filter((d): d is NonNullable<typeof d> => d !== null);

    let ingested = 0;
    let skipped = 0;
    if (docs.length > 0) {
      const result = await appendDocumentsDeduped(docs);
      ingested = result.inserted;
      skipped = result.skipped;
      console.log(
        `[calendar/webhook] Ingested ${ingested} chunks (skipped ${skipped} already-stored events) from ${docs.length} fetched`,
      );
    }

    // 5. Update sync token for next time
    if (stored) {
      await saveCalendarToken({
        ...stored,
        syncToken: nextSyncToken,
      });
    }

    return NextResponse.json({ ok: true, ingested });
  } catch (err) {
    console.error("[calendar/webhook] Ingestion failed:", err);
    return NextResponse.json(
      { ok: false, error: "Ingestion failed." },
      { status: 500 },
    );
  }
}
function appendDocuments(
  docs: CalendarIngestDoc[],
): number | PromiseLike<number> {
  throw new Error("Function not implemented.");
}
