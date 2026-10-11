import { z } from "zod";
import { tool } from "ai";
import { getKnowledgeCollection } from "./mongodb";

/**
 * Query calendar events for a date range.
 * This bypasses RAG entirely and queries MongoDB directly,
 * because date-based questions need precision, not similarity.
 */
export const getCalendarEventsTool = tool({
  description:
    "Get Waleed's calendar events for a specific date range. " +
    "Use this when the visitor asks about upcoming events, events today, " +
    "events this week, events in a specific month, or schedule questions. " +
    "Provide ISO date strings for the start and end of the range. " +
    "Today's date is provided in the system prompt — use it to compute " +
    "the range.",
  inputSchema: z.object({
    fromDate: z
      .string()
      .describe("Start of date range in ISO format, e.g. 2026-10-11"),
    toDate: z
      .string()
      .describe("End of date range in ISO format, e.g. 2026-10-18"),
  }),
  execute: async ({ fromDate, toDate }) => {
    try {
      const collection = await getKnowledgeCollection();

      // Calendar chunks contain lines like "Start: 2026-10-15T20:00:00+05:00"
      // We do a text-based match on the date prefix.
      const from = fromDate.slice(0, 10); // "2026-10-11"
      const to = toDate.slice(0, 10);

      // Fetch all calendar chunks, then filter by date in JS.
      // The collection is small enough (dozens of docs) that this is fast.
      const all = await collection
        .find({ source: "google-calendar" })
        .project({ _id: 0, text: 1 })
        .toArray();

      const matched = all.filter((doc) => {
        const text = String(doc.text ?? "");
        // Extract all "Start: YYYY-MM-DD" lines
        const startMatches = text.match(/Start:\s*(\d{4}-\d{2}-\d{2})/g);
        if (!startMatches) return false;

        return startMatches.some((line) => {
          const date = line.replace("Start:", "").trim().slice(0, 10);
          return date >= from && date <= to;
        });
      });

      return {
        ok: true,
        count: matched.length,
        fromDate: from,
        toDate: to,
        events: matched.map((m) => String(m.text ?? "")),
      };
    } catch (err) {
      console.error("[calendar-tool] failed:", err);
      return { ok: false, error: "Could not fetch events." };
    }
  },
});
