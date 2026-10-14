import { NextResponse } from "next/server";
import { collectWeeklyData, generateWeeklyReport } from "@/lib/weeklyReport";
import { getCachedReport, saveReport } from "@/lib/reports";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const forceRefresh = searchParams.get("refresh") === "1";

  const weekEnd = new Date();
  const weekStart = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  const weekStartIso = weekStart.toISOString();
  const weekEndIso = weekEnd.toISOString();

  // ------------------------------------------------------------
  // 1. Serve from cache if fresh and not forced
  // ------------------------------------------------------------
  if (!forceRefresh) {
    const cached = await getCachedReport(weekStartIso);
    if (cached) {
      console.log("[weekly-report] Serving from cache");
      return NextResponse.json({
        ok: true,
        report: cached.report,
        weekStart: cached.weekStart,
        weekEnd: cached.weekEnd,
        cached: true,
        dataSizes: cached.dataSizes,
      });
    }
  }

  // ------------------------------------------------------------
  // 2. Collect fresh data
  // ------------------------------------------------------------
  const collectStart = Date.now();
  let data;
  try {
    console.log("[weekly-report] Collecting data…");
    data = await collectWeeklyData(weekStart, weekEnd);
    console.log(
      `[weekly-report] ${data.commits.length} commits, ${data.events.length} events, ${data.conversations.length} conversations`,
    );
  } catch (err) {
    console.error("[weekly-report] Data collection failed:", err);
    return NextResponse.json(
      { ok: false, error: "Could not gather report data." },
      { status: 500 },
    );
  }

  // ------------------------------------------------------------
  // 3. Empty-state shortcut — no LLM call needed
  // ------------------------------------------------------------
  if (
    data.commits.length === 0 &&
    data.events.length === 0 &&
    data.conversations.length === 0
  ) {
    const emptyReport = `# Weekly Report
**${weekStart.toDateString()} — ${weekEnd.toDateString()}**

## Summary
No activity recorded this week — no commits, events, or visitor conversations.

## Development Activity
No commits this week.

## Meetings & Events
No events scheduled.

## Visitor Interest
No visitor conversations this week.

## Focus for Next Week
Start the week with a fresh commit and one scheduled event.`;

    const generationMs = Date.now() - collectStart;

    await saveReport({
      weekStart: weekStartIso,
      weekEnd: weekEndIso,
      report: emptyReport,
      generatedAt: new Date().toISOString(),
      dataSizes: { commits: 0, events: 0, conversations: 0 },
      generationMs,
    });

    return NextResponse.json({
      ok: true,
      report: emptyReport,
      weekStart: weekStartIso,
      weekEnd: weekEndIso,
      cached: false,
      dataSizes: { commits: 0, events: 0, conversations: 0 },
    });
  }

  // ------------------------------------------------------------
  // 4. Generate the report
  // ------------------------------------------------------------
  let report: string;
  try {
    report = await generateWeeklyReport(data);
  } catch (err) {
    console.error("[weekly-report] Generation failed:", err);
    return NextResponse.json(
      { ok: false, error: "Could not generate the report." },
      { status: 500 },
    );
  }

  if (!report || typeof report !== "string" || report.trim().length < 50) {
    console.error(
      "[weekly-report] Report too short or empty:",
      typeof report === "string" ? report.length : typeof report,
    );
    return NextResponse.json(
      {
        ok: false,
        error: "Report generation returned empty. Please try again.",
      },
      { status: 500 },
    );
  }

  const generationMs = Date.now() - collectStart;

  const dataSizes = {
    commits: data.commits.length,
    events: data.events.length,
    conversations: data.conversations.length,
  };

  // ------------------------------------------------------------
  // 5. Persist for caching
  // ------------------------------------------------------------
  await saveReport({
    weekStart: weekStartIso,
    weekEnd: weekEndIso,
    report,
    generatedAt: new Date().toISOString(),
    dataSizes,
    generationMs,
  });

  // ------------------------------------------------------------
  // 6. Structured log for observability
  // ------------------------------------------------------------
  console.log("[weekly-report] Generated", {
    durationMs: generationMs,
    commits: dataSizes.commits,
    events: dataSizes.events,
    conversations: dataSizes.conversations,
    reportLength: report.length,
  });

  return NextResponse.json({
    ok: true,
    report,
    weekStart: weekStartIso,
    weekEnd: weekEndIso,
    cached: false,
    dataSizes,
  });
}
