import { getCollection } from "./mongodb";
const TOKEN_COLLECTION = "calendar_tokens";

type GoogleTokenRow = {
  _id: string;
  refreshToken: string;
  channelId: string;
  resourceId: string;
  channelExpiry: number;
  syncToken?: string;
};

type GoogleCalendarEvent = {
  id: string;
  summary?: string;
  description?: string;
  location?: string;
  status?: string;
  htmlLink?: string;
  start?: {
    dateTime?: string;
    date?: string;
    timeZone?: string;
  };
  end?: {
    dateTime?: string;
    date?: string;
    timeZone?: string;
  };
  attendees?: Array<{
    email?: string;
    displayName?: string;
    responseStatus?: string;
  }>;
  organizer?: {
    email?: string;
    displayName?: string;
  };
};

export type CalendarIngestDoc = {
  text: string;
  source: string;
  dedupeKey: string;
};

// ------------------------------------------------------------
// Token storage
// ------------------------------------------------------------
type CalendarTokenDoc = GoogleTokenRow & { _id: string };

export async function saveCalendarToken(row: Omit<GoogleTokenRow, "_id">) {
  const collection = await getCollection<CalendarTokenDoc>(TOKEN_COLLECTION);
  await collection.updateOne(
    { _id: "primary" },
    { $set: row },
    { upsert: true },
  );
}

export async function loadCalendarToken(): Promise<GoogleTokenRow | null> {
  const collection = await getCollection<CalendarTokenDoc>(TOKEN_COLLECTION);
  const doc = await collection.findOne({ _id: "primary" });
  return doc as GoogleTokenRow | null;
}

// ------------------------------------------------------------
// Refresh access token using the stored refresh token
// ------------------------------------------------------------

export async function getAccessToken(): Promise<string | null> {
  const refreshToken = process.env.GOOGLE_REFRESH_TOKEN;
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;

  if (!refreshToken || !clientId || !clientSecret) {
    console.error("[calendar] Missing OAuth env vars");
    return null;
  }

  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      refresh_token: refreshToken,
      grant_type: "refresh_token",
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    console.error("[calendar] Token refresh failed:", res.status, err);
    return null;
  }

  const data = await res.json();
  return data.access_token ?? null;
}

// ------------------------------------------------------------
// Format a single calendar event as a text document
// ------------------------------------------------------------

function formatEvent(event: GoogleCalendarEvent): string {
  const lines: string[] = [];

  const start = event.start?.dateTime ?? event.start?.date ?? "unknown";
  const end = event.end?.dateTime ?? event.end?.date ?? "unknown";

  lines.push(`Event: ${event.summary ?? "(untitled)"}`);
  lines.push(`Start: ${start}`);
  lines.push(`End: ${end}`);

  if (event.location) {
    lines.push(`Location: ${event.location}`);
  }

  if (event.description) {
    lines.push("");
    lines.push("Description:");
    lines.push(event.description.trim());
  }

  if (event.attendees && event.attendees.length > 0) {
    lines.push("");
    lines.push("Attendees:");
    for (const a of event.attendees.slice(0, 20)) {
      const name = a.displayName || a.email || "unknown";
      lines.push(
        `- ${name}${a.responseStatus ? ` (${a.responseStatus})` : ""}`,
      );
    }
  }

  if (event.htmlLink) {
    lines.push("");
    lines.push(`Link: ${event.htmlLink}`);
  }

  return lines.join("\n");
}

export function eventToDocument(
  event: GoogleCalendarEvent,
): CalendarIngestDoc | null {
  // Skip cancelled events
  if (event.status === "cancelled") return null;

  const start = event.start?.dateTime ?? event.start?.date;
  if (!start) return null;

  // The dedupeKey combines the event ID with its last-updated timestamp.
  // If the event changes, Google bumps `updated`, so the key changes and
  // the new version gets re-embedded. If nothing changed, the key is the
  // same as the previous run, and we skip it.
  const updated =
    (event as any).updated ?? event.start?.dateTime ?? event.start?.date ?? "";
  const dedupeKey = `event:${event.id}:${updated}`;

  return {
    text: formatEvent(event),
    source: "google-calendar",
    dedupeKey,
  };
}

// ------------------------------------------------------------
// Fetch all events (or incremental since syncToken)
// ------------------------------------------------------------

export async function fetchEvents(syncToken?: string): Promise<{
  events: GoogleCalendarEvent[];
  nextSyncToken?: string;
}> {
  const accessToken = await getAccessToken();
  if (!accessToken) throw new Error("Could not obtain access token");

  const calendarId = process.env.GOOGLE_CALENDAR_ID || "primary";

  const params = new URLSearchParams({
    maxResults: "250",
    singleEvents: "true",
  });

  if (syncToken) {
    params.set("syncToken", syncToken);
  } else {
    // Minimal first-sync window: just the next 7 days.
    // Keeps embedding volume small on the free Gemini tier.
    const timeMin = new Date();
    const timeMax = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    params.set("timeMin", timeMin.toISOString());
    params.set("timeMax", timeMax.toISOString());
    params.set("orderBy", "startTime");
  }

  const url = `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(
    calendarId,
  )}/events?${params.toString()}`;

  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Calendar API error ${res.status}: ${err}`);
  }

  const data = await res.json();

  return {
    events: data.items ?? [],
    nextSyncToken: data.nextSyncToken,
  };
}
