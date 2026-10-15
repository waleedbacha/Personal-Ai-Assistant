import { z } from "zod";
import { tool } from "ai";
import { getKnowledgeCollection } from "./mongodb";

// ------------------------------------------------------------
// Configuration
// ------------------------------------------------------------
const WORKING_HOURS = {
  start: 9, // 09:00 local
  end: 18, // 18:00 local
};

const BUFFER_MINUTES = 0; // set to 15 to enforce gaps between events
const TIMEZONE = "Asia/Karachi";

// ------------------------------------------------------------
// Parse an ISO-ish date string from a calendar chunk
// Handles: "2026-10-21T10:00:00+05:00", "2026-10-21", etc.
// ------------------------------------------------------------
function parseDate(raw: string): Date | null {
  if (!raw) return null;
  const cleaned = raw.trim();
  if (!cleaned) return null;
  const d = new Date(cleaned);
  return isNaN(d.getTime()) ? null : d;
}

// ------------------------------------------------------------
// Format a Date as a local-time string (Asia/Karachi)
// ------------------------------------------------------------
function fmt(d: Date): string {
  return d.toLocaleString("en-US", {
    timeZone: TIMEZONE,
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}

// ------------------------------------------------------------
// Split a date range into per-day intervals, clipped to
// working hours.
// ------------------------------------------------------------
type Interval = { start: Date; end: Date };

function dateKeyInTz(d: Date): string {
  // "2026-10-21" in the target timezone
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: TIMEZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(d);
  const y = parts.find((p) => p.type === "year")!.value;
  const m = parts.find((p) => p.type === "month")!.value;
  const day = parts.find((p) => p.type === "day")!.value;
  return `${y}-${m}-${day}`;
}

function workingWindowForDate(dayKey: string): Interval {
  // Build a Date at "dayKey T WORKING_HOURS.start" in TIMEZONE.
  // We use a helper: construct a UTC date and then adjust by the
  // timezone offset for that local moment.
  const [y, m, d] = dayKey.split("-").map(Number);

  const startLocal = new Date(Date.UTC(y, m - 1, d, WORKING_HOURS.start, 0, 0));
  const endLocal = new Date(Date.UTC(y, m - 1, d, WORKING_HOURS.end, 0, 0));

  // Adjust by the timezone offset at that local time.
  // en-US formatting gives us the offset in a way we can parse.
  const offsetMinutes = tzOffsetMinutes(startLocal);
  return {
    start: new Date(startLocal.getTime() - offsetMinutes * 60_000),
    end: new Date(endLocal.getTime() - offsetMinutes * 60_000),
  };
}

function tzOffsetMinutes(forDate: Date): number {
  // Get the timezone offset for Asia/Karachi at this moment.
  // Karachi is UTC+5 year-round, but we compute it properly anyway.
  const dtf = new Intl.DateTimeFormat("en-US", {
    timeZone: TIMEZONE,
    timeZoneName: "shortOffset",
  });
  const parts = dtf.formatToParts(forDate);
  const tzName = parts.find((p) => p.type === "timeZoneName")?.value ?? "GMT+5";
  // "GMT+5" or "GMT+05:00"
  const match = tzName.match(/GMT([+-])(\d+)(?::(\d+))?/);
  if (!match) return 0;
  const sign = match[1] === "-" ? -1 : 1;
  const hours = parseInt(match[2], 10);
  const minutes = match[3] ? parseInt(match[3], 10) : 0;
  return sign * (hours * 60 + minutes);
}

// ------------------------------------------------------------
// Merge overlapping intervals
// ------------------------------------------------------------
function mergeIntervals(intervals: Interval[]): Interval[] {
  if (intervals.length === 0) return [];
  const sorted = [...intervals].sort(
    (a, b) => a.start.getTime() - b.start.getTime(),
  );
  const merged: Interval[] = [sorted[0]];
  for (let i = 1; i < sorted.length; i++) {
    const last = merged[merged.length - 1];
    const curr = sorted[i];
    if (curr.start.getTime() <= last.end.getTime()) {
      last.end = new Date(Math.max(last.end.getTime(), curr.end.getTime()));
    } else {
      merged.push(curr);
    }
  }
  return merged;
}

// ------------------------------------------------------------
// Find free slots in a working window given busy intervals
// ------------------------------------------------------------
function freeSlotsInWindow(win: Interval, busy: Interval[]): Interval[] {
  const clipped = busy
    .map((b) => ({
      start: new Date(Math.max(b.start.getTime(), win.start.getTime())),
      end: new Date(Math.min(b.end.getTime(), win.end.getTime())),
    }))
    .filter((b) => b.start.getTime() < b.end.getTime());

  const merged = mergeIntervals(clipped);

  const free: Interval[] = [];
  let cursor = win.start;

  for (const busySlot of merged) {
    if (busySlot.start.getTime() > cursor.getTime()) {
      free.push({ start: cursor, end: busySlot.start });
    }
    if (busySlot.end.getTime() > cursor.getTime()) {
      cursor = busySlot.end;
    }
  }

  if (cursor.getTime() < win.end.getTime()) {
    free.push({ start: cursor, end: win.end });
  }

  return free;
}

// ------------------------------------------------------------
// Load all calendar events in a date range from the knowledge base
// ------------------------------------------------------------
async function loadEventsInRange(from: Date, to: Date) {
  const collection = await getKnowledgeCollection();
  const all = await collection
    .find({ source: "google-calendar" })
    .project({ _id: 0, text: 1 })
    .toArray();

  const seen = new Set<string>();
  const events: Array<{ title: string; start: Date; end: Date }> = [];

  for (const doc of all) {
    const text = String(doc.text ?? "");
    const lines = text.split("\n");

    const title = lines
      .find((l) => l.startsWith("Event:"))
      ?.replace("Event:", "")
      .trim();
    const startRaw = lines
      .find((l) => l.startsWith("Start:"))
      ?.replace("Start:", "")
      .trim();
    const endRaw = lines
      .find((l) => l.startsWith("End:"))
      ?.replace("End:", "")
      .trim();

    if (!title || !startRaw) continue;

    const start = parseDate(startRaw);
    if (!start) continue;

    // Default end to 1 hour after start if missing
    const end = endRaw
      ? (parseDate(endRaw) ?? new Date(start.getTime() + 3_600_000))
      : new Date(start.getTime() + 3_600_000);

    // Filter to requested range (overlap, not containment)
    if (end.getTime() < from.getTime()) continue;
    if (start.getTime() > to.getTime()) continue;

    // Deduplicate by title + start ISO
    const key = `${title}|${start.toISOString()}`;
    if (seen.has(key)) continue;
    seen.add(key);

    events.push({ title, start, end });
  }

  return events;
}

// ------------------------------------------------------------
// The tool
// ------------------------------------------------------------
export const getAvailabilityTool = tool({
  description:
    "Get Waleed's availability between two dates. Use when the " +
    "visitor asks if Waleed is free, when he's available, or " +
    "whether he can meet on a specific day. Returns busy events " +
    "and free slots inside working hours (09:00–18:00 Asia/Karachi).",
  inputSchema: z.object({
    fromDate: z
      .string()
      .describe("ISO date string for the start of the range, e.g. 2026-10-21"),
    toDate: z
      .string()
      .describe("ISO date string for the end of the range, e.g. 2026-10-27"),
  }),
  execute: async ({ fromDate, toDate }) => {
    try {
      const from = parseDate(fromDate);
      const to = parseDate(toDate);
      if (!from || !to) {
        return { ok: false, error: "Invalid date format." };
      }

      // Clamp to a 30-day window to keep results reasonable
      const maxTo = new Date(from.getTime() + 30 * 24 * 60 * 60 * 1000);
      const effectiveTo = to.getTime() > maxTo.getTime() ? maxTo : to;

      const events = await loadEventsInRange(from, effectiveTo);

      // Walk each day in the range
      const dayKeys: string[] = [];
      const cursor = new Date(from.getTime());
      cursor.setHours(0, 0, 0, 0);
      while (cursor.getTime() <= effectiveTo.getTime()) {
        dayKeys.push(dateKeyInTz(cursor));
        cursor.setDate(cursor.getDate() + 1);
      }

      const days = dayKeys.map((dayKey) => {
        const win = workingWindowForDate(dayKey);
        const busyOnDay = events
          .filter((e) => dateKeyInTz(e.start) === dayKey)
          .map((e) => ({
            title: e.title,
            start: e.start,
            end: new Date(e.end.getTime() + BUFFER_MINUTES * 60_000),
          }));

        const free = freeSlotsInWindow(win, busyOnDay).filter(
          (slot) => slot.end.getTime() - slot.start.getTime() >= 15 * 60_000, // at least 15 min
        );

        return {
          date: dayKey,
          weekday: new Intl.DateTimeFormat("en-US", {
            timeZone: TIMEZONE,
            weekday: "long",
          }).format(win.start),
          busy: busyOnDay.map((b) => ({
            title: b.title,
            start: fmt(b.start),
            end: fmt(b.end),
          })),
          free: free.map((f) => ({
            start: fmt(f.start),
            end: fmt(f.end),
            durationMinutes: Math.round(
              (f.end.getTime() - f.start.getTime()) / 60_000,
            ),
          })),
        };
      });

      return {
        ok: true,
        timezone: TIMEZONE,
        workingHours: `${WORKING_HOURS.start}:00–${WORKING_HOURS.end}:00`,
        fromDate: fromDate,
        toDate: toDate,
        days,
      };
    } catch (err) {
      console.error("[availability-tool] failed:", err);
      return { ok: false, error: "Could not compute availability." };
    }
  },
});
