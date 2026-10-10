import { streamText, convertToModelMessages, UIMessage, stepCountIs } from "ai";
import { CHAT_MODEL } from "@/lib/ai";
import { buildSystemPrompt, type ChatMode } from "@/lib/buildSystemPrompt";
import { showContactForm } from "@/lib/contactTool";
import { buildReminderTools } from "@/lib/reminderTool";
import { retrieve, type RetrieveFilter } from "@/lib/rag";
import { getRecentCommitsTool } from "@/lib/commitTool";

export const maxDuration = 30;

function detectSourceFilter(query: string): RetrieveFilter | undefined {
  const q = query.toLowerCase();

  const calendarKeywords =
    /\b(event|events|calendar|schedule|meeting|meetings|zoom|appointment|appointments|booked|availability|available)\b/;

  const githubKeywords =
    /\b(commit|commits|push|pushed|repo|repos|repository|repositories|github)\b/;

  if (calendarKeywords.test(q)) {
    return { source: "google-calendar" };
  }

  if (githubKeywords.test(q)) {
    return {
      githubRepos: [
        "github:waleedbacha/My-Drone-Force",
        "github:waleedbacha/Personal-ai-chatbot",
        "github:waleedbacha/Henry-Golatt-Portfolio",
      ],
    };
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
  // 2. RAG retrieval — with source-aware filtering
  // ------------------------------------------------------------
  let retrievedContext = "";

  if (lastUserText) {
    try {
      const filter = detectSourceFilter(lastUserText);
      const chunks = await retrieve(lastUserText, 5, filter);

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
  // 3. System prompt + tools
  // ------------------------------------------------------------
  const systemPrompt = buildSystemPrompt(mode, retrievedContext);
  const reminderTools = buildReminderTools(visitorId);

  // ------------------------------------------------------------
  // 4. Stream with loop prevention
  // ------------------------------------------------------------
  const result = streamText({
    model: CHAT_MODEL,
    system: systemPrompt,
    messages: await convertToModelMessages(messages),
    tools: {
      showContactForm,
      getRecentCommits: getRecentCommitsTool,
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
