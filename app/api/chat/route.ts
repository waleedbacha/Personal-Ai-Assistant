import { streamText, convertToModelMessages, UIMessage, stepCountIs } from "ai";
import { CHAT_MODEL } from "@/lib/ai";
import { buildSystemPrompt, type ChatMode } from "@/lib/buildSystemPrompt";
import { showContactForm } from "@/lib/contactTool";
import { buildReminderTools } from "@/lib/reminderTool";
import { getRecentCommitsTool } from "@/lib/commitTool";
import { retrieve, type RetrieveFilter } from "@/lib/rag";
import { getCalendarEventsTool } from "@/lib/calendar-tool";

export const maxDuration = 60;

function detectSourceFilter(query: string): RetrieveFilter | undefined {
  const q = query.toLowerCase();

  const githubKeywords =
    /\b(commit|commits|push|pushed|repo|repos|repository|repositories|github|latest|recent)\b/;

  const calendarKeywords =
    /\b(event|events|calendar|schedule|meeting|meetings|zoom|appointment|appointments|booked|availability|available|week|month|today|tomorrow|yesterday|upcoming)\b/;

  // GitHub first — "commit this week" should route to commits, not calendar
  if (githubKeywords.test(q)) {
    return {
      githubRepos: [
        "github:waleedbacha/My-Drone-Force",
        "github:waleedbacha/Personal-ai-chatbot",
        "github:waleedbacha/Henry-Golatt-Portfolio",
      ],
    };
  }

  if (calendarKeywords.test(q)) {
    return { source: "google-calendar" };
  }

  return undefined;
}

export async function POST(req: Request) {
  const {
    messages,
    mode = "default",
    visitorId = "anonymous",
  }: {
    messages: UIMessage[];
    mode?: ChatMode;
    visitorId?: string;
  } = await req.json();

  // ------------------------------------------------------------
  // 1. Extract the latest user message
  // ------------------------------------------------------------
  const lastUserMessage = [...messages]
    .reverse()
    .find((m) => m.role === "user");

  const lastUserText =
    lastUserMessage?.parts
      ?.filter((p: any) => p.type === "text")
      .map((p: any) => p.text)
      .join("")
      .trim() ?? "";

  // ------------------------------------------------------------
  // 2. RAG retrieval — 3 chunks (was 5) for tighter answers
  // ------------------------------------------------------------
  let retrievedContext = "";

  if (lastUserText) {
    try {
      const filter = detectSourceFilter(lastUserText);
      const chunks = await retrieve(lastUserText, 3, filter);

      if (chunks.length > 0) {
        retrievedContext = chunks
          .map(
            (c, i) =>
              `[${i + 1}] (source: ${c.source}, relevance: ${c.score.toFixed(
                3,
              )})\n${c.text}`,
          )
          .join("\n\n---\n\n");
        console.log(
          `[chat] Retrieved ${chunks.length} chunks${
            filter ? ` (filtered: ${JSON.stringify(filter)})` : ""
          }`,
        );
      } else {
        console.log(
          `[chat] Retrieved 0 chunks${
            filter ? ` (filtered: ${JSON.stringify(filter)})` : ""
          }`,
        );
      }
    } catch (err) {
      console.error("[chat] RAG retrieval failed:", err);
    }
  }

  // ------------------------------------------------------------
  // 3. Build prompt + tools
  // ------------------------------------------------------------
  const systemPrompt = buildSystemPrompt(mode, retrievedContext);
  const reminderTools = buildReminderTools(visitorId);

  // ------------------------------------------------------------
  // 4. Only send the last 4 messages to the model.
  //    This prevents old answers from bleeding into new ones
  //    and keeps the request smaller.
  // ------------------------------------------------------------
  const recentMessages = messages.slice(-4);

  // ------------------------------------------------------------
  // 5. Stream with 2 steps (tool call + reply)
  // ------------------------------------------------------------
  const result = streamText({
    model: CHAT_MODEL,
    system: systemPrompt,
    messages: await convertToModelMessages(recentMessages),
    tools: {
      showContactForm,
      getRecentCommits: getRecentCommitsTool,
      getCalendarEvents: getCalendarEventsTool,
      ...reminderTools,
    },
    temperature: 0.7,
    stopWhen: stepCountIs(2),
    providerOptions: {
      groq: {
        reasoning_effort: "low",
        reasoning_format: "hidden",
      },
    },
  });

  return result.toUIMessageStreamResponse();
}
