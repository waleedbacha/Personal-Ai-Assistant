import { NextResponse } from "next/server";
import {
  getAccessToken,
  saveCalendarToken,
  loadCalendarToken,
} from "@/lib/calendar";

export const runtime = "nodejs";
export const maxDuration = 30;

export async function GET() {
  return handleRenew();
}

export async function POST() {
  return handleRenew();
}

async function handleRenew() {
  const channelToken = process.env.GOOGLE_CALENDAR_CHANNEL_TOKEN;
  const calendarId = process.env.GOOGLE_CALENDAR_ID || "primary";
  const webhookUrl =
    process.env.CALENDAR_WEBHOOK_URL ||
    "https://personal-ai-assistant-theta-self.vercel.app/api/calendar/webhook";

  if (!channelToken) {
    return NextResponse.json(
      { ok: false, error: "GOOGLE_CALENDAR_CHANNEL_TOKEN is not set." },
      { status: 500 },
    );
  }

  const accessToken = await getAccessToken();
  if (!accessToken) {
    return NextResponse.json(
      { ok: false, error: "Could not obtain access token." },
      { status: 500 },
    );
  }

  const channelId = crypto.randomUUID();
  const expiration = Date.now() + 6 * 24 * 60 * 60 * 1000;

  const res = await fetch(
    `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(
      calendarId,
    )}/events/watch`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        id: channelId,
        type: "web_hook",
        address: webhookUrl,
        token: channelToken,
        expiration: String(expiration),
      }),
    },
  );

  if (!res.ok) {
    const err = await res.text();
    console.error("[calendar/renew] Renewal failed:", res.status, err);
    return NextResponse.json(
      { ok: false, error: `Renewal failed: ${res.status}`, detail: err },
      { status: 500 },
    );
  }

  const data = await res.json();

  const stored = await loadCalendarToken();
  await saveCalendarToken({
    refreshToken: stored?.refreshToken ?? "",
    syncToken: stored?.syncToken,
    channelId: data.id,
    resourceId: data.resourceId,
    channelExpiry: Number(data.expiration),
  });

  console.log(
    "[calendar/renew] Channel renewed until",
    new Date(Number(data.expiration)).toISOString(),
  );

  return NextResponse.json({
    ok: true,
    channelId: data.id,
    expiration: data.expiration,
  });
}
