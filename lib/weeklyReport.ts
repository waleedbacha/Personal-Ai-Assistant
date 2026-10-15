import { getConversationsSince } from "./conversations";
import { getRecentCommits } from "./commits";
import { getKnowledgeCollection } from "./mongodb";
import { CHAT_MODEL, OPENROUTER_MODEL } from "./ai";
import { generateText } from "ai";

export type WeeklyReportInput = {
  weekStart: Date;
  weekEnd: Date;
  commits: Array<{ repo: string; date: string; message: string }>;
  events: Array<{ title: string; start: string; location?: string }>;
  conversations: Array<{
    question: string;
    answerSummary: string;
    category: string;
  }>;
};

// ------------------------------------------------------------
// Fetch events from the calendar chunks
// ------------------------------------------------------------
async function getEventsSince(
  since: Date,
): Promise<Array<{ title: string; start: string; location?: string }>> {
  const collection = await getKnowledgeCollection();
  const all = await collection
    .find({ source: "google-calendar" })
    .project({ _id: 0, text: 1 })
    .toArray();

  const sinceStr = since.toISOString().slice(0, 10);
  const seen = new Set<string>();
  const events: Array<{ title: string; start: string; location?: string }> = [];

  for (const doc of all) {
    const text = String(doc.text ?? "");
    const lines = text.split("\n");

    const title = lines
      .find((l) => l.startsWith("Event:"))
      ?.replace("Event:", "")
      .trim();
    const start = lines
      .find((l) => l.startsWith("Start:"))
      ?.replace("Start:", "")
      .trim();
    const location = lines
      .find((l) => l.startsWith("Location:"))
      ?.replace("Location:", "")
      .trim();

    if (!title || !start) continue;
    if (start.slice(0, 10) < sinceStr) continue;

    // Deduplicate by title + start
    const key = `${title}|${start}`;
    if (seen.has(key)) continue;
    seen.add(key);

    events.push({ title, start, location });
  }

  return events;
}

// ------------------------------------------------------------
// Collect all data for the report
// ------------------------------------------------------------
export async function collectWeeklyData(
  weekStart: Date,
  weekEnd: Date,
): Promise<WeeklyReportInput> {
  const [commits, events, conversations] = await Promise.all([
    getRecentCommits({ limit: 50 }).then((c) =>
      c.map((x) => {
        const lines = x.text.split("\n");
        return {
          repo:
            lines
              .find((l) => l.startsWith("Repository:"))
              ?.replace("Repository:", "")
              .trim() ?? "",
          date:
            lines
              .find((l) => l.startsWith("Date:"))
              ?.replace("Date:", "")
              .trim() ?? "",
          message:
            lines[
              lines.findIndex((l) => l.trim() === "Message:") + 1
            ]?.trim() ?? "",
        };
      }),
    ),
    getEventsSince(weekStart),
    getConversationsSince(weekStart).then((c) =>
      c.map((x) => ({
        question: x.question,
        answerSummary: x.answerSummary,
        category: x.category,
      })),
    ),
  ]);

  return { weekStart, weekEnd, commits, events, conversations };
}

// ------------------------------------------------------------
// Build the report prompt with given data slices
// ------------------------------------------------------------
function buildReportPrompt(
  input: WeeklyReportInput,
  commits: typeof input.commits,
  events: typeof input.events,
  conversations: typeof input.conversations,
): string {
  const weekStartStr = input.weekStart.toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
  const weekEndStr = input.weekEnd.toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const commitsBlock = commits.length
    ? commits.map((c) => `- [${c.repo}] ${c.date}: ${c.message}`).join("\n")
    : "(no commits this week)";

  const eventsBlock = events.length
    ? events
        .map(
          (e) =>
            `- ${e.title} — ${e.start}${e.location ? ` at ${e.location}` : ""}`,
        )
        .join("\n")
    : "(no events this week)";

  const conversationsBlock = conversations.length
    ? conversations
        .map(
          (c) =>
            `- (${c.category}) Q: ${c.question.slice(0, 100)}\n  A: ${c.answerSummary.slice(0, 100)}`,
        )
        .join("\n")
    : "(no conversations this week)";

  return `
You are generating Waleed Badshah's weekly report.

Week: ${weekStartStr} → ${weekEndStr}

## Raw Data

### GitHub Commits (showing ${commits.length} of ${input.commits.length})
${commitsBlock}

### Calendar Events (showing ${events.length} of ${input.events.length})
${eventsBlock}

### Visitor Conversations (showing ${conversations.length} of ${input.conversations.length})
${conversationsBlock}

## Your Task

Generate a clean, professional weekly report in **Markdown**. Use this
structure EXACTLY. Do not deviate from the format.

# Weekly Report
**${weekStartStr} — ${weekEndStr}**

## Summary
2-3 sentences. Mention counts: "X commits across Y repositories, Z
meetings, and N visitor conversations."

## Development Activity
For each repository with commits, use this exact format:

### <repo-name>
| Date | Commit Message |
|------|----------------|
| YYYY-MM-DD | <message> |

One row per commit. Sort rows by date ascending.
If there are no commits, write exactly: "No commits this week."

## Meetings & Events
Use this exact format for each event:

- **<Event Title>** — <date and time>

If there are no events, write exactly: "No events scheduled."

## Visitor Interest
Use bullets. Group by theme when possible.

- **<Theme>**: <count> visitor(s) asked about <topic>

If there are no conversations, write exactly: "No visitor conversations this week."

## Focus for Next Week
1-2 sentences suggesting a focus area. Be concrete.

## Rules
- Use only the data provided above.
- Follow the formats EXACTLY as specified.
- Do not invent commits, events, or conversations.
- Do not mention that this was AI-generated.
`.trim();
}

// ------------------------------------------------------------
// Single generation attempt — returns "" on failure
// ------------------------------------------------------------

async function tryGenerate(prompt: string): Promise<string> {
  // ----------------------------------------------------------
  // Attempt 1 — Groq (fast, primary)
  // ----------------------------------------------------------
  console.log(
    "[weekly-report] OPENROUTER_API_KEY present:",
    !!process.env.OPENROUTER_API_KEY,
  );
  try {
    const { text } = await generateText({
      model: CHAT_MODEL,
      prompt,
      temperature: 0.2,
      maxOutputTokens: 2000,
      providerOptions: {
        groq: { reasoning_effort: "low" },
      },
    });

    const trimmed = (text ?? "").trim();
    if (trimmed.length >= 100) {
      console.log("[weekly-report] Groq succeeded");
      return trimmed;
    }

    console.log(
      `[weekly-report] Groq returned too short (${trimmed.length}), falling back to OpenRouter`,
    );
  } catch (err) {
    console.error(
      "[weekly-report] Groq failed, falling back to OpenRouter:",
      err,
    );
  }

  // ----------------------------------------------------------
  // Attempt 2 — OpenRouter (free tier fallback)
  // ----------------------------------------------------------
  if (process.env.OPENROUTER_API_KEY) {
    try {
      const { text } = await generateText({
        model: OPENROUTER_MODEL,
        prompt,
        temperature: 0.2,
        maxOutputTokens: 2000,
      });

      const trimmed = (text ?? "").trim();
      if (trimmed.length >= 100) {
        console.log("[weekly-report] OpenRouter succeeded");
        return trimmed;
      }

      console.log(
        `[weekly-report] OpenRouter returned too short (${trimmed.length})`,
      );
    } catch (err) {
      console.error("[weekly-report] OpenRouter failed:", err);
    }
  } else {
    console.warn(
      "[weekly-report] OPENROUTER_API_KEY not set — skipping fallback",
    );
  }

  return "";
}

// ------------------------------------------------------------
// Public: generate the report with retry-on-empty
// ------------------------------------------------------------
export async function generateWeeklyReport(
  input: WeeklyReportInput,
): Promise<string> {
  // Attempt 1 — moderate data size
  const prompt1 = buildReportPrompt(
    input,
    input.commits.slice(0, 12),
    input.events.slice(0, 10),
    input.conversations.slice(0, 8),
  );

  console.log(`[weekly-report] Attempt 1 — prompt length: ${prompt1.length}`);

  const report1 = await tryGenerate(prompt1);
  if (report1.length >= 100) {
    console.log(
      `[weekly-report] Attempt 1 succeeded (${report1.length} chars)`,
    );
    return report1;
  }

  // Attempt 2 — reduced data
  console.log("[weekly-report] Attempt 1 empty, retrying with reduced data");

  const prompt2 = buildReportPrompt(
    input,
    input.commits.slice(0, 6),
    input.events.slice(0, 4),
    input.conversations.slice(0, 3),
  );

  console.log(`[weekly-report] Attempt 2 — prompt length: ${prompt2.length}`);

  const report2 = await tryGenerate(prompt2);
  if (report2.length >= 100) {
    console.log(
      `[weekly-report] Attempt 2 succeeded (${report2.length} chars)`,
    );
    return report2;
  }

  // Both failed
  console.error("[weekly-report] Both attempts returned empty. Giving up.");
  return "";
}
