import { getConversationsSince } from "./conversations";
import { getRecentCommits } from "./commits";
import { getKnowledgeCollection } from "./mongodb";
import { CHAT_MODEL } from "./ai";
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
// Generate the report using Groq
// ------------------------------------------------------------
export async function generateWeeklyReport(
  input: WeeklyReportInput,
): Promise<string> {
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

  const cappedCommits = input.commits.slice(0, 20);
  const cappedEvents = input.events.slice(0, 15);
  const cappedConversations = input.conversations.slice(0, 12);

  const commitsBlock = cappedCommits.length
    ? cappedCommits
        .map((c) => `- [${c.repo}] ${c.date}: ${c.message}`)
        .join("\n")
    : "(no commits this week)";

  const eventsBlock = cappedEvents.length
    ? cappedEvents
        .map(
          (e) =>
            `- ${e.title} — ${e.start}${e.location ? ` at ${e.location}` : ""}`,
        )
        .join("\n")
    : "(no events this week)";

  const conversationsBlock = cappedConversations.length
    ? cappedConversations
        .map(
          (c) =>
            `- (${c.category}) Q: ${c.question.slice(0, 120)}\n  A: ${c.answerSummary.slice(0, 120)}`,
        )
        .join("\n")
    : "(no conversations this week)";

  const prompt = `
You are generating Waleed Badshah's weekly report.

Week: ${weekStartStr} → ${weekEndStr}

## Raw Data

### GitHub Commits (showing ${cappedCommits.length} of ${input.commits.length})
${commitsBlock}

### Calendar Events (showing ${cappedEvents.length} of ${input.events.length})
${eventsBlock}

### Visitor Conversations (showing ${cappedConversations.length} of ${input.conversations.length})
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

- **<Event Title>** — <date and time><location if present>

If there are no events, write exactly: "No events scheduled."

## Visitor Interest
Use bullets. Group by theme when possible.

- **<Theme>**: <count> visitor(s) asked about <topic>

If there are no conversations, write exactly: "No visitor conversations this week."

## Focus for Next Week
1-2 sentences suggesting a focus area. Be concrete.

## Rules
- Use only the data provided above.
- Follow the formats EXACTLY as specified. Do not substitute bullet
  lists for tables, or tables for bullet lists.
- Do not invent commits, events, or conversations.
- Do not mention that this was AI-generated.
`.trim();

  const { text } = await generateText({
    model: CHAT_MODEL,
    prompt,
    temperature: 0.2,
  });

  return text;
}
